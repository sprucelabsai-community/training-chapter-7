import {
    AbstractSkillViewController,
    ViewControllerOptions,
    SkillView,
    SkillViewControllerLoadOptions,
    CardViewController,
} from '@sprucelabs/heartwood-view-controllers'

export default class ReadSkillViewController extends AbstractSkillViewController {
    public static id = 'read'

    protected cardVc: CardViewController

    public constructor(options: ViewControllerOptions) {
        super(options)

        this.cardVc = this.CardVc()
    }

    private CardVc(): CardViewController {
        return this.Controller('card', {
            header: {
                title: `Tonight's Story!`,
            },
            body: {
                sections: [{}],
            },
        })
    }

    public async load(options: SkillViewControllerLoadOptions<ReadArgs>) {
        const { args } = options
        const { storyId } = args

        const client = await this.connectToApi()
        const [{ story }] = await client.emitAndFlattenResponses(
            'eightbitstories.get-story::v2024_09_19',
            {
                target: {
                    storyId,
                },
            }
        )

        this.cardVc.updateSection(0, {
            text: {
                content: story.body,
            },
        })
    }

    public render(): SkillView {
        return {
            layouts: [
                {
                    cards: [this.cardVc.render()],
                },
            ],
        }
    }
}

export interface ReadArgs {
    storyId: string
}
