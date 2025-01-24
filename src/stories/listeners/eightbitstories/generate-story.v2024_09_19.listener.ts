import { SkillEventContract } from '@sprucelabs/mercury-types'
import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import { SpruceSchemas } from '#spruce/schemas/schemas.types'
import StoryGeneratorImpl from '../../../StoryGenerator'

export default async (
    event: SpruceEvent<SkillEventContract, EmitPayload>
): SpruceEventResponse => {
    const { payload, client, source, log, stores } = event
    const { personId } = source

    try {
        const families = await stores.getStore('families')
        const family = await families.findOne({
            'source.personId': personId,
        })

        const generator = await StoryGeneratorImpl.Generator({
            openaiApiKey: 'aoeu',
            stores,
        })
        const storyId = await generator.generate({
            ...payload,
            familyId: family!.id,
        })

        await client.emitAndFlattenResponses(
            'eightbitstories.did-generate-story::v2024_09_19',
            {
                target: { personId: personId! },
                payload: { storyId },
            }
        )
    } catch (err: any) {
        log.error(`failed to generate story`, err)
        await client.emitAndFlattenResponses(
            'eightbitstories.did-fail-to-generate-story::v2024_09_19',
            {
                target: {
                    personId: personId!,
                },
                payload: {
                    errorMessage: err.message ?? `Failed to generate story!`,
                },
            }
        )
    }
}

type EmitPayload =
    SpruceSchemas.Eightbitstories.v2024_09_19.GenerateStoryEmitTargetAndPayload
