import { SpruceSchemas } from '@sprucelabs/mercury-types'
import { StoryGenerator } from './StoryGenerator'

export type FamilySchema =
    SpruceSchemas.Eightbitstories.v2024_09_19.FamilySchema
export type Family = SpruceSchemas.Eightbitstories.v2024_09_19.Family
export type CreateFamily =
    SpruceSchemas.Eightbitstories.v2024_09_19.CreateFamily
export type FamilyMember =
    SpruceSchemas.Eightbitstories.v2024_09_19.FamilyMember
export type PublicFamilyMember =
    SpruceSchemas.Eightbitstories.v2024_09_19.PublicFamilyMember
export type FamilyMemberSchema =
    SpruceSchemas.Eightbitstories.v2024_09_19.FamilyMemberSchema
export type CreateFamilyMember =
    SpruceSchemas.Eightbitstories.v2024_09_19.CreateFamilyMember
export type UpdateFamilyMember =
    SpruceSchemas.Eightbitstories.v2024_09_19.UpdateFamilyMember
export type GenerateStoryPayload =
    SpruceSchemas.Eightbitstories.v2024_09_19.GenerateStoryEmitPayload

declare module '@sprucelabs/spruce-skill-utils/build/types/skill.types' {
    interface SkillContext {
        generator: StoryGenerator
    }
}
