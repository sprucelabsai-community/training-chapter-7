import { fake, seed } from '@sprucelabs/spruce-test-fixtures'
import { test, generateId, assert } from '@sprucelabs/test-utils'
import { GenerateStoryPayload } from '../../../eightbitstories.types'
import StoryGeneratorImpl, {
    StoryGenerator,
    StoryGeneratorGenerateOptions,
} from '../../../StoryGenerator'
import AbstractEightBitTest from '../../support/AbstractEightBitTest'
import {
    DidFailTargetAndPayload,
    DidGenerateTargetAndPayload,
} from '../../support/EventFaker'

@fake.login()
export default class GenerateStoryListenerTest extends AbstractEightBitTest {
    private static familyId: string

    @seed('families', 1)
    protected static async beforeEach() {
        await super.beforeEach()

        const family = await this.getFirstFamily()
        this.familyId = family.id

        StoryGeneratorImpl.Class = MockStoryGenerator
        delete MockStoryGenerator.errorMessage

        await this.eventFaker.fakeDidGenerateStory()

        await this.bootSkill()
    }

    @test()
    protected static async skillIsListening() {
        await this.emitGenerateStory()
    }

    @test()
    protected static async callsGenerateOnStoryGenerator() {
        await this.emitGenerateStory()

        assert.isTruthy(
            this.mockGenerator,
            `You did not construct a story generator`
        )

        this.mockGenerator.assertGenerateWasCalled()
    }

    @test()
    protected static async passesPayloadToGenerate() {
        const payload: Omit<StoryGeneratorGenerateOptions, 'familyId'> = {
            currentChallenge: generateId(),
            familyMembers: [generateId()],
            storyElements: [generateId()],
        }

        await this.emitGenerateStory(payload)

        this.mockGenerator.assertOptionsPassedToGenerateEqual({
            ...payload,
            familyId: this.familyId,
        })
    }

    @test()
    protected static async emitsDidGenerateStoryOnSuccess() {
        let passedTarget: DidGenerateTargetAndPayload['target'] | undefined
        let passedPayload: DidGenerateTargetAndPayload['payload'] | undefined

        await this.eventFaker.fakeDidGenerateStory(({ target, payload }) => {
            passedTarget = target
            passedPayload = payload
        })

        await this.emitGenerateStory()

        assert.isEqualDeep(passedTarget, {
            personId: this.fakedPerson.id,
        })

        assert.isEqualDeep(passedPayload, {
            storyId: this.mockGenerator.getGeneratedStoryId(),
        })
    }

    @test()
    protected static async emitsDidFailToGenerateOnFail() {
        MockStoryGenerator.errorMessage = generateId()

        let passedTarget: DidFailTargetAndPayload['target'] | undefined
        let passedPayload: DidFailTargetAndPayload['payload'] | undefined

        await this.eventFaker.fakeDidFailToGenerateStory(
            ({ target, payload }) => {
                passedTarget = target
                passedPayload = payload
            }
        )

        await this.emitGenerateStory()

        assert.isEqualDeep(passedTarget, { personId: this.fakedPerson.id })
        assert.isEqualDeep(passedPayload, {
            errorMessage: MockStoryGenerator.errorMessage,
        })
    }

    @test()
    protected static async usesProperFamily() {
        await this.families.delete({})

        await this.families.createOne({
            name: generateId(),
            values: generateId(),
            source: {
                personId: generateId(),
            },
        })

        const secondFamily = await this.families.createOne({
            name: generateId(),
            values: generateId(),
            source: {
                personId: this.fakedPerson.id,
            },
        })

        await this.emitGenerateStory()
        this.mockGenerator.assertFamilyIdPassedToGenerate(secondFamily.id)
    }

    private static get mockGenerator(): MockStoryGenerator {
        return MockStoryGenerator.instance
    }

    private static async emitGenerateStory(payload?: GenerateStoryPayload) {
        await this.fakedClient.emitAndFlattenResponses(
            'eightbitstories.generate-story::v2024_09_19',
            {
                payload: payload ?? {
                    familyMembers: [generateId()],
                    storyElements: ['wizard'],
                },
            }
        )
    }
}

class MockStoryGenerator implements StoryGenerator {
    public static instance: MockStoryGenerator
    private generateOptions?: StoryGeneratorGenerateOptions
    private storyId = generateId()
    public static errorMessage?: string

    public constructor() {
        MockStoryGenerator.instance = this
    }

    public async generate(options: StoryGeneratorGenerateOptions) {
        if (MockStoryGenerator.errorMessage) {
            throw new Error(MockStoryGenerator.errorMessage)
        }
        this.generateOptions = options
        return this.storyId
    }

    public getGeneratedStoryId() {
        return this.storyId
    }

    public assertGenerateWasCalled() {
        assert.isTruthy(
            this.generateOptions,
            `You did not call generate() on your story generator`
        )
    }

    public assertOptionsPassedToGenerateEqual(
        expected: StoryGeneratorGenerateOptions
    ) {
        assert.isEqualDeep(
            this.generateOptions,
            expected,
            'You did not pass the expected options to generate()!'
        )
    }

    public assertFamilyIdPassedToGenerate(familyId: string) {
        assert.isEqual(
            this.generateOptions?.familyId,
            familyId,
            'The familyId passed to generate does not match.'
        )
    }
}
