import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'



const storySourceSchema: SpruceSchemas.Eightbitstories.v2024_09_19.StorySourceSchema  = {
	id: 'storySource',
	version: 'v2024_09_19',
	namespace: 'Eightbitstories',
	name: '',
	    fields: {
	            /** . */
	            'personId': {
	                type: 'id',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(storySourceSchema)

export default storySourceSchema
