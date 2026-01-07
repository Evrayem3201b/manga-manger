import { UserFilter } from "@/utils/types";
import { create } from "zustand";

type CategoryStore = {
  filter: UserFilter;
  handleOnPress: (selectedFilter: UserFilter) => void;
};

export const useFilterStore = create<CategoryStore>((set) => ({
  filter: "all",

  handleOnPress: (selectedFilter) => {
    return set({ filter: selectedFilter });
  },
}));
