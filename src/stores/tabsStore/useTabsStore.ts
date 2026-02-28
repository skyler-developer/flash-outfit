import { create } from "zustand";

interface TabsStore {
  selectedTab: number;
  setSelectedTab: (tab: number) => void;
}

export const useTabsStore = create<TabsStore>((set) => ({
  selectedTab: 0,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
}));
