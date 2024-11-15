import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceSchemas } from '../../schemas.types'

import eventSourceSchema_v2021_09_13 from '#spruce/schemas/spruceEventUtils/v2021_09_13/eventSource.schema'
import didGenerateStoryEmitTargetSchema_v2024_09_19 from '#spruce/schemas/eightbitstories/v2024_09_19/didGenerateStoryEmitTarget.schema'
import didGenerateStoryEmitPayloadSchema_v2024_09_19 from '#spruce/schemas/eightbitstories/v2024_09_19/didGenerateStoryEmitPayload.schema'

const didGenerateStoryEmitTargetAndPayloadSchema: SpruceSchemas.Eightbitstories.v2024_09_19.DidGenerateStoryEmitTargetAndPayloadSchema  = {
	id: 'didGenerateStoryEmitTargetAndPayload',
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
	                options: {schema: didGenerateStoryEmitTargetSchema_v2024_09_19,}
	            },
	            /** . */
	            'payload': {
	                type: 'schema',
	                isRequired: true,
	                options: {schema: didGenerateStoryEmitPayloadSchema_v2024_09_19,}
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(didGenerateStoryEmitTargetAndPayloadSchema)

export default didGenerateStoryEmitTargetAndPayloadSchema
