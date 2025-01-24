import { SimpleStoreFactory } from '@sprucelabs/data-stores'
import { assertOptions, SchemaError } from '@sprucelabs/schema'
import Openai from 'openai'
import { Family, GenerateStoryPayload } from './eightbitstories.types'
import FamiliesStore from './family/Families.store'
import FamilyMembersStore from './members/FamilyMembers.store'
import StoriesStore from './stores/Stories.store'

export default class StoryGeneratorImpl implements StoryGenerator {
    public static Class?: new (
        options: StoryGeneratorConstructorOptions
    ) => StoryGenerator
    public static Openai = Openai

    private familyMembers: FamilyMembersStore
    private openai: Openai
    private families: FamiliesStore
    private stories: StoriesStore

    private constructor(options: StoryGeneratorConstructorOptions) {
        const {
            familyMembers,
            openAiApiKey: openaiApiKey,
            families,
            stories,
        } = options

        this.familyMembers = familyMembers
        this.families = families
        this.stories = stories
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
        const stories = await stores.getStore('stories')

        return new (this.Class ?? this)({
            familyMembers,
            openAiApiKey: openaiApiKey,
            families,
            stories,
        })
    }

    public async generate(options: StoryGeneratorGenerateOptions) {
        const {
            storyElements,
            familyMembers,
            familyId,
            currentChallenge,
            personId,
        } = assertOptions(options, [
            'storyElements',
            'familyMembers',
            'familyId',
            'personId',
        ])

        if (storyElements.length === 0) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['storyElements'],
            })
        }

        const family = (await this.families.findOne({
            id: familyId,
        })) as Family | null

        if (!family) {
            this.throwInvalidFamilyMemberIds(['familyId'])
        }

        if (familyMembers.length === 0) {
            this.throwInvalidFamilyMemberIds(['familyMembers'])
        }

        let message = await this.generatePrompt({
            family: family!,
            familyMembers,
            storyElements,
            currentChallenge,
        })

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

        const story = await this.stories.createOne({
            body: response.choices[0].message.content!,
            source: {
                personId,
            },
        })

        return story.id
    }

    private async generatePrompt(options: {
        family: Family
        familyMembers: string[]
        storyElements: string[]
        currentChallenge: string | null | undefined
    }) {
        const { family, familyMembers, storyElements, currentChallenge } =
            options

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
        return message
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
    personId: string
}

export interface StoryGeneratorConstructorOptions {
    familyMembers: FamilyMembersStore
    openAiApiKey: string
    families: FamiliesStore
    stories: StoriesStore
}
