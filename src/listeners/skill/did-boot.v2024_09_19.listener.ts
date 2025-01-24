import { SchemaError } from '@sprucelabs/schema'
import {
    SpruceEvent,
    SpruceEventResponse,
} from '@sprucelabs/spruce-event-utils'
import StoryGeneratorImpl from '../../StoryGenerator'

export default async (event: SpruceEvent): SpruceEventResponse => {
    if (!process.env.FEEDBACK_PHONE) {
        throw new SchemaError({
            code: 'MISSING_PARAMETERS',
            parameters: ['env.FEEDBACK_PHONE'],
            friendlyMessage: `You have to set FEEDBACK_PHONE in your skill's .env to boot!`,
        })
    }

    if (!process.env.OPENAI_KEY) {
        throw new SchemaError({
            code: 'MISSING_PARAMETERS',
            parameters: ['env.OPENAI_KEY'],
            friendlyMessage: `You have to set OPENAI_KEY in your skill's env to boot!`,
        })
    }

    const { skill, stores } = event

    const generator = await StoryGeneratorImpl.Generator({
        openaiApiKey: process.env.OPENAI_KEY,
        stores,
    })

    skill.updateContext('generator', generator)
}
