import { SimpleStoreFactory } from '@sprucelabs/data-stores'
import { assertOptions, SchemaError } from '@sprucelabs/schema'
import { fake, seed } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import Openai, { ClientOptions } from 'openai'
import { ChatCompletion, ChatModel } from 'openai/resources'
import { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions'
import { PublicFamilyMember } from '../../../eightbitstories.types'
import FamilyMembersStore from '../../../members/FamilyMembers.store'
import AbstractEightBitTest from '../../support/AbstractEightBitTest'

@fake.login()
export default class StoryGeneratorTest extends AbstractEightBitTest {
    private static generator: StoryGenerator
    private static members: PublicFamilyMember[]
    private static apiKey: string

    protected static async beforeAll(): Promise<void> {
        await super.beforeAll()
        assert.isEqual(
            StoryGenerator.Openai,
            Openai,
            "Make sure to set StoryGenerator's static prop openia to the openai from openai"
        )
    }

    @seed('familyMembers', 3)
    protected static async beforeEach() {
        await super.beforeEach()

        this.apiKey = generateId()

        StoryGenerator.Openai = MockOpenAi
        this.generator = await StoryGenerator.Generator({
            stores: this.stores,
            openaiApiKey: this.apiKey,
        })
        this.members = await this.familyMembers.find({})
    }

    @test()
    protected static async throwsWithMissing() {
        const err = await assert.doesThrowAsync(() =>
            //@ts-ignore
            StoryGenerator.Generator()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['stores', 'openaiApiKey'],
        })
    }

    @test()
    protected static async generateMethodThowsWithMissing() {
        //@ts-ignore
        const err = await assert.doesThrowAsync(() => this.generateStory())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['storyElements', 'familyMemberIds'],
        })
    }

    @test()
    protected static async generateStoryThrowsIfNoStoryElementsSelected() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMemberIds: [generateId()],
                storyElements: [],
            },
            ['storyElements']
        )
    }

    @test()
    protected static async generateStorysIfNoFamilyMemberSelected() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMemberIds: [],
                storyElements: [generateId()],
            },
            ['familyMemberIds']
        )
    }

    @test()
    protected static async throwsIfPassedBadFamilyMemberId() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMemberIds: [generateId()],
                storyElements: [generateId()],
            },
            ['familyMemberIds']
        )
    }

    @test()
    protected static async passesIfPassedEverythingNeeded() {
        await this.generateStoryWithAllMembers()
    }

    @test()
    protected static async throwsIfSecondFamilyMemberIdIsBad() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMemberIds: [this.member.id, generateId()],
                storyElements: [generateId()],
            },
            ['familyMemberIds']
        )

        this.openAi.assertDidNotCallChatCompletionCreate()
    }

    @test()
    protected static async callsChatGptCompletionsCreate() {
        await this.generateStoryWithAllMembers()
        assert.isTruthy(this.openAi, 'You did not construct an openai instance')
        this.openAi.assertApiKeyEquals(this.apiKey)
        this.openAi.assertChatCompletionCalled()
    }

    @test()
    protected static async callsCompletionCreateWithExpectedModel() {
        await this.generateStoryWithAllMembers()
        this.openAi.assertCreateCompletionModeEquals('o1-preview')
    }

    @test()
    protected static async passesExpectedFirstMessage() {
        await this.generateStoryWithAllMembers()
        this.openAi.assertFirstCompletionMessageEquals({
            role: 'system',
            content: `You are a master story teller! Once a night, you gather with a family to tell amazing stories about that family. The family has filled out a form that includes their values, their family members, some elements they'd like incorporated into the story, as well as an optional challenge they are currently facing. You take this input and write a 10 minute bedtime story that incorporates all the family pieces to create a once-in-a-lifetime, amazing, creative, bedtime story, to help the family connect with themselves, each other, and to fall asleep. Family form follows:`,
        })
    }

    private static get openAi(): MockOpenAi {
        return MockOpenAi.instance
    }

    private static async generateStoryWithAllMembers() {
        await this.generateStory({
            familyMemberIds: this.members.map((m) => m.id),
            storyElements: [generateId()],
        })
    }

    private static get member() {
        return this.members[0]
    }

    private static async assertGenerateThrowsInvalidParams(
        options: GenerateStoryOptions,
        parameters: string[]
    ) {
        const err = await assert.doesThrowAsync(() =>
            this.generateStory(options)
        )
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters,
        })
    }

    private static generateStory(options: GenerateStoryOptions) {
        return this.generator.generateStory(options)
    }
}

class StoryGenerator {
    public static Openai = Openai
    private familyMembers: FamilyMembersStore
    private openai: Openai

    private constructor(options: {
        familyMembers: FamilyMembersStore
        openaiApiKey: string
    }) {
        const { familyMembers, openaiApiKey } = options
        this.familyMembers = familyMembers
        this.openai = new StoryGenerator.Openai({
            apiKey: openaiApiKey,
        })
    }

    public static async Generator(options: StoryGeneratorOptions) {
        const { stores, openaiApiKey } = assertOptions(options, [
            'stores',
            'openaiApiKey',
        ])
        const familyMembers = await stores.getStore('familyMembers')
        return new this({ familyMembers, openaiApiKey })
    }

    public async generateStory(options: GenerateStoryOptions) {
        const { storyElements, familyMemberIds } = assertOptions(options, [
            'storyElements',
            'familyMemberIds',
        ])

        if (storyElements.length === 0) {
            throw new SchemaError({
                code: 'INVALID_PARAMETERS',
                parameters: ['storyElements'],
            })
        }

        if (familyMemberIds.length === 0) {
            this.throwInvalidFamilyMemberIds()
        }

        for (const memberId of familyMemberIds) {
            const match = await this.familyMembers.findOne({
                id: memberId,
            })

            if (!match) {
                this.throwInvalidFamilyMemberIds()
            }
        }
        await this.openai.chat.completions.create({
            model: 'o1-preview',
            messages: [
                {
                    role: 'system',
                    content:
                        "You are a master story teller! Once a night, you gather with a family to tell amazing stories about that family. The family has filled out a form that includes their values, their family members, some elements they'd like incorporated into the story, as well as an optional challenge they are currently facing. You take this input and write a 10 minute bedtime story that incorporates all the family pieces to create a once-in-a-lifetime, amazing, creative, bedtime story, to help the family connect with themselves, each other, and to fall asleep. Family form follows:",
                },
            ],
        })
    }

    private throwInvalidFamilyMemberIds() {
        throw new SchemaError({
            code: 'INVALID_PARAMETERS',
            parameters: ['familyMemberIds'],
        })
    }
}

interface StoryGeneratorOptions {
    stores: SimpleStoreFactory
    openaiApiKey: string
}

interface GenerateStoryOptions {
    storyElements: string[]
    familyMemberIds: string[]
    currentChallenge?: string
}

class MockOpenAi extends Openai {
    public static instance: MockOpenAi

    private constructorOptions: ClientOptions
    private didCreateCompletion = false
    private createOptions?: ChatCompletionCreateParamsBase

    public constructor(options: ClientOptions) {
        super(options)
        MockOpenAi.instance = this
        this.constructorOptions = options

        this.chat.completions.create = async (options) => {
            this.createOptions = options
            this.didCreateCompletion = true
            return {} as ChatCompletion
        }
    }

    public assertApiKeyEquals(expected: string) {
        assert.isEqual(
            this.constructorOptions.apiKey,
            expected,
            'Wrong API key passed to openai'
        )
    }

    public assertChatCompletionCalled() {
        assert.isTrue(
            this.didCreateCompletion,
            `Did not call openai.chat.completions.create`
        )
    }

    public assertDidNotCallChatCompletionCreate() {
        assert.isFalse(
            this.didCreateCompletion,
            'You called openai.chat.completions.create and should not have!'
        )
    }

    public assertCreateCompletionModeEquals(expected: ChatModel) {
        assert.isEqual(
            this.createOptions?.model,
            expected,
            'Did not pass expected model to create completion'
        )
    }

    public assertFirstCompletionMessageEquals(expected: {
        role: string
        content: string
    }) {
        assert.isEqualDeep(
            this.createOptions?.messages?.[0],
            expected,
            'Did not pass the expected first message to the completion.'
        )
    }
}
