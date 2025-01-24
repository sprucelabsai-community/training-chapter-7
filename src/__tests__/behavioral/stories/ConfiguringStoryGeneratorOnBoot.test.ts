import { fake } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import StoryGeneratorImpl, {
    StoryGenerator,
    StoryGeneratorConstructorOptions,
    StoryGeneratorGenerateOptions,
} from '../../../StoryGenerator'
import AbstractEightBitTest from '../../support/AbstractEightBitTest'

@fake.login()
export default class ConfiguringStoryGeneratorOnBootTest extends AbstractEightBitTest {
    @test()
    protected static async throwsIfMissingOpenAiKeyInEnv() {
        delete process.env.OPENAI_KEY
        const err = await assert.doesThrowAsync(() => this.bootSkill())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['env.OPENAI_KEY'],
        })
    }

    @test()
    protected static async passesEnvToStoryGenerator() {
        StoryGeneratorImpl.Class = SpyStoryGenerator
        const { skill } = await this.bootSkill()
        const { generator } = skill.getContext()
        const spy = generator as SpyStoryGenerator
        assert.isEqual(spy.openAiKey, process.env.OPENAI_KEY)
    }
}

class SpyStoryGenerator implements StoryGenerator {
    public openAiKey: string
    public constructor(options: StoryGeneratorConstructorOptions) {
        const { openAiApiKey: openaiApiKey } = options
        this.openAiKey = openaiApiKey
    }

    public async generate(
        _options: StoryGeneratorGenerateOptions
    ): Promise<string> {
        return ''
    }
}
