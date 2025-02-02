import FamiliesStore from '../../family/Families.store'
import StoriesStore from '../../stores/Stories.store'
import FamilyMembersStore from '../../members/FamilyMembers.store'

declare module '@sprucelabs/data-stores/build/types/stores.types' {
	interface StoreMap {
                families: FamiliesStore
                stories: StoriesStore
                familyMembers: FamilyMembersStore
	}

	interface StoreOptionsMap {
                families: Omit<Parameters<typeof FamiliesStore['Store']>[0], keyof UniversalStoreOptions>   
                stories: Omit<Parameters<typeof StoriesStore['Store']>[0], keyof UniversalStoreOptions>   
                familyMembers: Omit<Parameters<typeof FamilyMembersStore['Store']>[0], keyof UniversalStoreOptions>   
        }
}