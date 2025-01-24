import '#spruce/permissions/permissions.types'
import getStoryEmitTargetAndPayloadSchema from '#spruce/schemas/eightbitstories/v2024_09_19/getStoryEmitTargetAndPayload.schema'
import getStoryResponsePayloadSchema from '#spruce/schemas/eightbitstories/v2024_09_19/getStoryResponsePayload.schema'
import { buildEventContract } from '@sprucelabs/mercury-types'


const getStoryEventContract = buildEventContract({
    eventSignatures: {
        'eightbitstories.get-story::v2024_09_19': {
            isGlobal: true,
            emitPermissions: {"contractId":"eightbitstories.eightbitstories","permissionIdsAny":["can-read-story"]},
            
            emitPayloadSchema: getStoryEmitTargetAndPayloadSchema,
            responsePayloadSchema: getStoryResponsePayloadSchema,
            
            
        }
    }
})
export default getStoryEventContract

export type GetStoryEventContract = typeof getStoryEventContract