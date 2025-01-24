import { buildSchema, dropFields } from '@sprucelabs/schema'
import storyBuilder from '../../../../schemas/v2024_09_19/story.builder'

const getStoryResponsePayloadBuilder = buildSchema({
    id: 'getStoryResponsePayload',
    fields: {
        story: {
            type: 'schema',
            isRequired: true,
            options: {
                schema: buildSchema({
                    id: 'getStoryStory',
                    fields: {
                        ...dropFields(storyBuilder.fields, ['source']),
                    },
                }),
            },
        },
    },
})

export default getStoryResponsePayloadBuilder
