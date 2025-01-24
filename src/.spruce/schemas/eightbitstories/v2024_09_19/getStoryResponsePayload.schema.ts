import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'

import getStoryStorySchema_v2024_09_19 from '#spruce/schemas/eightbitstories/v2024_09_19/getStoryStory.schema'

const getStoryResponsePayloadSchema: SpruceSchemas.Eightbitstories.v2024_09_19.GetStoryResponsePayloadSchema  = {
	id: 'getStoryResponsePayload',
	version: 'v2024_09_19',
	namespace: 'Eightbitstories',
	name: '',
	    fields: {
	            /** . */
	            'story': {
	                type: 'schema',
	                isRequired: true,
	                options: {schema: getStoryStorySchema_v2024_09_19,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(getStoryResponsePayloadSchema)

export default getStoryResponsePayloadSchema
