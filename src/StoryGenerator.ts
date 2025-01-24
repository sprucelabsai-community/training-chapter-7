import { SimpleStoreFactory } from '@sprucelabs/data-stores'
import { assertOptions, SchemaError } from '@sprucelabs/schema'
import Openai from 'openai'
import { GenerateStoryPayload } from './eightbitstories.types'
import FamiliesStore from './family/Families.store'
import FamilyMembersStore from './members/FamilyMembers.store'

export default class StoryGeneratorImpl implements StoryGenerator {
    public static Class?: new () => StoryGenerator
    public static Openai = Openai

    private familyMembers: FamilyMembersStore
    private openai: Openai
    private families: FamiliesStore

    private constructor(options: {
        familyMembers: FamilyMembersStore
        openaiApiKey: string
        families: FamiliesStore
    }) {
        const { familyMembers, openaiApiKey, families } = options
        this.familyMembers = familyMembers
        this.families = families
        this.openai = new StoryGeneratorImpl.Openai({
            apiKey: openaiApiKey,
        })
    }

    public static async Generator(options: StoryGeneratorOptions) {
        const { stores, openaiApiKey } = assertOptions(options, [
            'stores',
            'openaiApiKey',
        ])
        const familyMembers = await stores.getStore('familyMembers')
        const families = await stores.getStore('families')

        return new (this.Class ?? this)({
            familyMembers,
            openaiApiKey,
            families,
        })
    }

    public async generate(options: StoryGeneratorGenerateOptions) {
        const { storyElements, familyMembers, familyId, currentChallenge } =
            assertOptions(options, [
                'storyElements',
                'familyMembers',
                'familyId',
            ])

        if (storyElements.length === 0) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['storyElements'],
            })
        }

        const family = await this.families.findOne({
            id: familyId,
        })

        if (!family) {
            this.throwInvalidFamilyMemberIds(['familyId'])
        }

        if (familyMembers.length === 0) {
            this.throwInvalidFamilyMemberIds(['familyMembers'])
        }

        let message = `Family Name:
${family?.name}

Family Values:
${family?.values}

Family Members:
`

        for (const memberId of familyMembers) {
            const match = await this.familyMembers.findOne({
                id: memberId,
            })

            if (!match) {
                this.throwInvalidFamilyMemberIds(['familyMembers'])
            }

            message += `Name: ${match?.name}
Bio: ${match?.bio}

`
        }

        message += `Here are the story elements the family wants worked into the story for tonight:

${storyElements.join(', ')}`

        if (currentChallenge) {
            message += `\n\nHere is a current challenge they are facing that they would like incorporated into tonight's story:\n${currentChallenge}`
        }

        const response = await this.openai.chat.completions.create({
            model: 'o1-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        "You are a master story teller! Once a night, you gather with a family to tell amazing stories about that family. The family has filled out a form that includes their values, their family members, some elements they'd like incorporated into the story, as well as an optional challenge they are currently facing. You take this input and write a 10 minute bedtime story that incorporates all the family pieces to create a once-in-a-lifetime, amazing, creative, bedtime story, to help the family connect with themselves, each other, and to fall asleep. Family form follows:",
                },
                {
                    role: 'system',
                    content: message,
                },
            ],
        })

        return response.choices[0].message.content!
    }

    private throwInvalidFamilyMemberIds(parameters: string[]) {
        throw new SchemaError({
            code: 'INVALID_PARAMETERS',
            parameters,
        })
    }
}

interface StoryGeneratorOptions {
    stores: SimpleStoreFactory
    openaiApiKey: string
}

export interface StoryGenerator {
    generate(options: StoryGeneratorGenerateOptions): Promise<string>
}

export type StoryGeneratorGenerateOptions = GenerateStoryPayload & {
    familyId: string
}
