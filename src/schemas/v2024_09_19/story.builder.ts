import { buildSchema } from '@sprucelabs/schema'

export default buildSchema({
    id: 'story',
    name: 'Story',
    fields: {
        id: {
            type: 'text',
            isRequired: true,
        },
        body: {
            type: 'text',
            isRequired: true,
        },
        source: {
            type: 'schema',
            isRequired: true,
            options: {
                schema: buildSchema({
                    id: 'storySource',
                    fields: {
                        personId: {
                            type: 'id',
                            isRequired: true,
                        },
                    },
                }),
            },
        },
    },
})
