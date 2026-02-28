import { useTabsStore } from "@/stores/tabsStore/useTabsStore";

export const setSelected = (index: number) => {
    useTabsStore.getState().setSelectedTab(index);
};
