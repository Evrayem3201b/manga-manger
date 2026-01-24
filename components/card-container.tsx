import { useFilterStore } from "@/stores/category-store";
import { SimpleDisplay } from "@/utils/types";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useState } from "react";
import { Dimensions, FlatList, Pressable, View, ViewStyle } from "react-native";
import Card from "./card";

const { width } = Dimensions.get("window");
const cardWidth = 170;
const numColumns = Math.floor(width / cardWidth);
interface Props {
  search?: boolean;
  mangaSimple: SimpleDisplay[];
  style?: ViewStyle;
}

export default function CardContainer({ mangaSimple, search, style }: Props) {
  const db = useSQLiteContext();
  const filterKeyword = useFilterStore((state) => state.filter);

  // 1. Store the IDs in simple arrays (or Sets for speed)
  const [favIds, setFavIds] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);

  // 2. Fetch IDs once when the component mounts or filter changes
  useEffect(() => {
    async function fetchLibrary() {
      const favs = await db.getAllAsync<{ manga_id: string }>(
        "SELECT manga_id FROM favorites",
      );
      const plan = await db.getAllAsync<{ manga_id: string }>(
        "SELECT manga_id FROM plan_to_read",
      );

      setFavIds(favs.map((f) => f.manga_id));
      setPlanIds(plan.map((p) => p.manga_id));
    }
    fetchLibrary();
  }, [filterKeyword]); // Refresh when the user switches tabs

  // 3. Now the filter is SYNCHRONOUS and fast
  const filteredManga = useMemo(() => {
    return mangaSimple.filter((item: SimpleDisplay) => {
      if (filterKeyword === "all") return true;
      if (filterKeyword === "favorites") return favIds.includes(item.id);
      if (filterKeyword === "plan-to-read") return planIds.includes(item.id);
      return item.status === filterKeyword;
    });
  }, [mangaSimple, filterKeyword, favIds, planIds]);

  return (
    <FlatList
      data={filteredManga}
      key={`grid-${numColumns}`}
      numColumns={numColumns}
      contentContainerStyle={{ paddingBottom: 80 }}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push(`/${search ? "search" : "home"}/${item.id}`)
          }
        >
          <View style={{ width: width / numColumns, paddingVertical: 10 }}>
            <Card {...item} search={search} />
          </View>
        </Pressable>
      )}
    />
  );
}
