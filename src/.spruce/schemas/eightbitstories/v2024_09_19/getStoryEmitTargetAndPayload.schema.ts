import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'

import eventSourceSchema_v2021_09_13 from '#spruce/schemas/spruceEventUtils/v2021_09_13/eventSource.schema'
import getStoryEmitTargetSchema_v2024_09_19 from '#spruce/schemas/eightbitstories/v2024_09_19/getStoryEmitTarget.schema'

const getStoryEmitTargetAndPayloadSchema: SpruceSchemas.Eightbitstories.v2024_09_19.GetStoryEmitTargetAndPayloadSchema  = {
	id: 'getStoryEmitTargetAndPayload',
	version: 'v2024_09_19',
	namespace: 'Eightbitstories',
	name: '',
	    fields: {
	            /** Source. */
	            'source': {
	                label: 'Source',
	                type: 'schema',
	                options: {schema: eventSourceSchema_v2021_09_13,}
	            },
	            /** . */
	            'target': {
	                type: 'schema',
	                isRequired: true,
	                options: {schema: getStoryEmitTargetSchema_v2024_09_19,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(getStoryEmitTargetAndPayloadSchema)

export default getStoryEmitTargetAndPayloadSchema
