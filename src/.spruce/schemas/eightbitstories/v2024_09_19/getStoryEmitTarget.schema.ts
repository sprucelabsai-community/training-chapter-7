import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'



const getStoryEmitTargetSchema: SpruceSchemas.Eightbitstories.v2024_09_19.GetStoryEmitTargetSchema  = {
	id: 'getStoryEmitTarget',
	version: 'v2024_09_19',
	namespace: 'Eightbitstories',
	name: '',
	    fields: {
	            /** . */
	            'storyId': {
	                type: 'id',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(getStoryEmitTargetSchema)

export default getStoryEmitTargetSchema
