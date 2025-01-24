import { vcAssert } from '@sprucelabs/heartwood-view-controllers'
import { fake } from '@sprucelabs/spruce-test-fixtures'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import { GetStory } from '../../../eightbitstories.types'
import ReadSkillViewController from '../../../stories/Read.svc'
import AbstractEightBitTest from '../../support/AbstractEightBitTest'
import { GetStoryTargetAndPayload } from '../../support/EventFaker'

@fake.login()
export default class ReadSkillViewTest extends AbstractEightBitTest {
    private static vc: SpyReadSkillView

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()

        this.views.setController('eightbitstories.read', SpyReadSkillView)
        this.vc = this.views.Controller(
            'eightbitstories.read',
            {}
        ) as SpyReadSkillView
    }

    @test()
    protected static async rendersCard() {
        vcAssert.assertSkillViewRendersCard(this.vc)
    }

    @test()
    protected static async loadingSkillViewEmitsGetStoryEvent() {
        let passedTarget: GetStoryTargetAndPayload['target'] | undefined

        await this.eventFaker.fakeGetStory(({ target }) => {
            passedTarget = target
        })

        const storyId = generateId()

        await this.load(storyId)

        assert.isEqualDeep(passedTarget, {
            storyId,
        })
    }

    @test()
    protected static async cardBodyContainsStoryBody() {
        const story: GetStory = {
            id: generateId(),
            body: generateId(),
        }
        await this.eventFaker.fakeGetStory(() => story)

        await this.load()

        const { body } = this.views.render(this.vc.getCardVc())
        const section = body?.sections?.[0]
        assert.isTruthy(section, 'The card should render at least one section')

        const text = section.text?.content
        assert.isEqual(
            text,
            story.body,
            'The story body was not dropped into the first section.'
        )
    }

    private static async load(storyId?: string) {
        await this.views.load(this.vc, {
            storyId: storyId ?? generateId(),
        })
    }
}

class SpyReadSkillView extends ReadSkillViewController {
    public getCardVc() {
        return this.cardVc
    }
}
