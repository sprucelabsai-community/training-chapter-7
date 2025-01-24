import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'

import storySourceSchema_v2024_09_19 from '#spruce/schemas/eightbitstories/v2024_09_19/storySource.schema'

const storySchema: SpruceSchemas.Eightbitstories.v2024_09_19.StorySchema  = {
	id: 'story',
	version: 'v2024_09_19',
	namespace: 'Eightbitstories',
	name: 'Story',
	    fields: {
	            /** . */
	            'id': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'body': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'source': {
	                type: 'schema',
	                isRequired: true,
	                options: {schema: storySourceSchema_v2024_09_19,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(storySchema)

export default storySchema
