import { fake, seed } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import Openai, { ClientOptions } from 'openai'
import { ChatCompletion, ChatModel } from 'openai/resources'
import {
    ChatCompletionCreateParamsBase,
    ChatCompletionMessageParam,
} from 'openai/resources/chat/completions'
import { Family, PublicFamilyMember } from '../../../eightbitstories.types'
import StoryGeneratorImpl, {
    StoryGenerator,
    StoryGeneratorGenerateOptions,
} from '../../../StoryGenerator'
import AbstractEightBitTest from '../../support/AbstractEightBitTest'

@fake.login()
export default class StoryGeneratorTest extends AbstractEightBitTest {
    private static generator: StoryGenerator
    private static members: PublicFamilyMember[]
    private static family: Family
    private static apiKey: string

    protected static async beforeAll(): Promise<void> {
        await super.beforeAll()
        assert.isEqual(
            StoryGeneratorImpl.Openai,
            Openai,
            "Make sure to set StoryGenerator's static prop openia to the openai from openai"
        )
    }

    @seed('familyMembers', 3)
    @seed('families', 1)
    protected static async beforeEach() {
        await super.beforeEach()

        this.apiKey = generateId()

        StoryGeneratorImpl.Openai = MockOpenAi
        this.generator = await StoryGeneratorImpl.Generator({
            stores: this.stores,
            openaiApiKey: this.apiKey,
        })

        this.family = await this.getFirstFamily()
        this.members = await this.familyMembers.find({})

        this.chatGptResponseMessage = generateId()
    }

    @test()
    protected static async throwsWithMissing() {
        const err = await assert.doesThrowAsync(() =>
            //@ts-ignore
            StoryGeneratorImpl.Generator()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['stores', 'openaiApiKey'],
        })
    }

    @test()
    protected static async generateMethodThowsWithMissing() {
        //@ts-ignore
        const err = await assert.doesThrowAsync(() => this.generator.generate())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: [
                'storyElements',
                'familyMembers',
                'familyId',
                'personId',
            ],
        })
    }

    @test()
    protected static async generateStoryThrowsIfNoStoryElementsSelected() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMembers: [generateId()],
                storyElements: [],
            },
            ['storyElements']
        )
    }

    @test()
    protected static async generateStoryThrowsIfNoFamilyMemberSelected() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMembers: [],
                storyElements: [generateId()],
            },
            ['familyMembers']
        )
    }

    @test()
    protected static async throwsIfPassedBadFamilyId() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyId: generateId(),
                familyMembers: [generateId()],
                storyElements: [generateId()],
            },
            ['familyId']
        )
    }

    @test()
    protected static async throwsIfPassedBadFamilyMemberId() {
        await this.assertGenerateThrowsInvalidParams(
            {
                familyMembers: [generateId()],
                storyElements: [generateId()],
            },
            ['familyMembers']
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
                familyMembers: [this.member.id, generateId()],
                storyElements: [generateId()],
            },
            ['familyMembers']
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

    @test()
    protected static async generatesExpectedSecondMessage() {
        const storyElements = [generateId()]

        const expected = this.generateSecondMessage(storyElements)

        await this.generateStoryWithAllMembers({ storyElements })

        this.assertSecondMessageEquals(expected)
    }

    @test()
    protected static async generatesSecondMessageWithMultipleElements() {
        const storyElements = [generateId(), generateId()]
        const expected = this.generateSecondMessage(storyElements)
        await this.generateStoryWithAllMembers({ storyElements })
        this.assertSecondMessageEquals(expected)
    }

    @test()
    protected static async generatesSecondMessageWithCurrentChallenge() {
        const storyElements = [generateId()]
        const currentChallenge = generateId()
        const expected = this.generateSecondMessage(
            storyElements,
            currentChallenge
        )
        await this.generateStoryWithAllMembers({
            storyElements,
            currentChallenge,
        })
        this.assertSecondMessageEquals(expected)
    }

    @test()
    protected static async storyGeneratorCreatesStoryRecordWithResponseFromChatGpt() {
        const storyId = await this.generateStoryWithAllMembers()

        const story = await this.stories.findOne({
            id: storyId,
        })

        assert.isTruthy(story, 'Story generator did not create story record.')
        assert.isEqual(story.body, this.chatGptResponseMessage)
        assert.isEqualDeep(story.source, {
            personId: this.fakedPerson.id,
        })
    }

    private static set chatGptResponseMessage(message: string) {
        MockOpenAi.completionMessage = message
    }

    private static get chatGptResponseMessage() {
        return MockOpenAi.completionMessage
    }

    private static assertSecondMessageEquals(expected: string) {
        this.openAi.assertSecondCompletionMessageEquals({
            role: 'system',
            content: expected,
        })
    }

    private static generateSecondMessage(
        storyElements: string[],
        currentChallenge?: string
    ) {
        const elements = storyElements.join(', ')
        const members = this.generateFamilyMembersPartOfPrompt()
        let expected = `Family Name:
${this.family.name}

Family Values:
${this.family.values}

Family Members:
${members}

Here are the story elements the family wants worked into the story for tonight:

${elements}`

        if (currentChallenge) {
            expected += `\n\nHere is a current challenge they are facing that they would like incorporated into tonight's story:\n${currentChallenge}`
        }

        return expected
    }

    private static generateFamilyMembersPartOfPrompt() {
        return this.members
            .map(
                (m) => `Name: ${m.name}
Bio: ${m.bio}`
            )
            .join('\n\n')
    }

    private static get openAi(): MockOpenAi {
        return MockOpenAi.instance
    }

    private static async generateStoryWithAllMembers(
        options?: Partial<StoryGeneratorGenerateOptions>
    ) {
        return await this.generateStory({
            familyMembers: this.members.map((m) => m.id),
            storyElements: [generateId()],
            ...options,
        })
    }

    private static get member() {
        return this.members[0]
    }

    private static async assertGenerateThrowsInvalidParams(
        options: Partial<StoryGeneratorGenerateOptions>,
        parameters: string[]
    ) {
        const err = await assert.doesThrowAsync(() =>
            this.generateStory({
                storyElements: [],
                familyMembers: [],
                ...options,
            })
        )
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters,
        })
    }

    private static generateStory(
        options: Omit<StoryGeneratorGenerateOptions, 'personId' | 'familyId'>
    ) {
        return this.generator.generate({
            personId: this.fakedPerson.id,
            familyId: this.family.id,
            ...options,
        })
    }
}

class MockOpenAi extends Openai {
    public static instance: MockOpenAi
    public static completionMessage: string

    private constructorOptions: ClientOptions
    private didCreateCompletion = false
    private createOptions?: ChatCompletionCreateParamsBase

    public constructor(options: ClientOptions) {
        super(options)
        MockOpenAi.instance = this
        this.constructorOptions = options

        //@ts-ignore
        this.chat.completions.create = async (options) => {
            this.createOptions = options
            this.didCreateCompletion = true
            return {
                id: generateId(),
                created: Date.now(),
                model: '4o',
                object: 'chat.completion',
                choices: [
                    {
                        finish_reason: 'stop' as const,
                        index: 0,
                        logprobs: null,
                        message: {
                            content: this.messageContent,
                            role: 'assistant',
                            refusal: null,
                        },
                    },
                ],
            } as ChatCompletion
        }
    }

    private get messageContent() {
        return MockOpenAi.completionMessage
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

    public assertFirstCompletionMessageEquals(
        expected: ChatCompletionMessageParam
    ) {
        assert.isEqualDeep(
            this.createOptions?.messages?.[0],
            expected,
            'Did not pass the expected first message to the completion.'
        )
    }

    public assertSecondCompletionMessageEquals(
        expected: ChatCompletionMessageParam
    ) {
        assert.isEqualDeep(
            this.createOptions?.messages?.[1],
            expected,
            'Did not pass the expected second message to the completion.'
        )
    }
}
