import { Colors } from "@/constants/theme";
import { useFilterStore } from "@/stores/category-store";
import { SimpleDisplay } from "@/utils/types";
import { Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Card from "./card";
import { ThemedText } from "./themed-text";

const { width } = Dimensions.get("window");
// Adjust cardWidth slightly to ensure margin/padding is accounted for
const cardWidth = 175;
const numColumns = Math.floor(width / cardWidth);

interface Props {
  search?: boolean;
  mangaSimple: SimpleDisplay[] & { isAdult?: boolean }[];
  style?: ViewStyle;
}

export default function CardContainer({ mangaSimple, search, style }: Props) {
  const db = useSQLiteContext();
  const filterKeyword = useFilterStore((state) => state.filter);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);

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
  }, [filterKeyword]);

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
      // Centering the whole list container
      contentContainerStyle={[styles.listContent, style]}
      // Ensuring columns are spread evenly
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        filterKeyword === "all" && !search ? (
          <View style={styles.headerWrapper}>
            <Pressable
              onPress={() => router.push("/home/add-manga")}
              style={({ pressed }) => [
                styles.headerActionContainer,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.iconCircle}>
                <Octicons name="plus" size={18} color={Colors.dark.primary} />
              </View>
              <View>
                <ThemedText style={styles.headerActionTitle}>
                  Add New Manga
                </ThemedText>
                <ThemedText style={styles.headerActionSub}>
                  Expand your library collection
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push(`/${search ? "search" : "home"}/template/${item.id}`)
          }
        >
          <View style={styles.cardWrapper}>
            <Card {...item} isAdult={item.isAdult} search={search} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 100,
    alignItems: "center", // Crucial for centering the header and list
  },
  columnWrapper: {
    justifyContent: "center", // This prevents the "shifted right" look
    gap: 15, // Adds consistent spacing between cards horizontally
  },
  cardWrapper: {
    paddingVertical: 10,
    alignItems: "center",
  },
  headerWrapper: {
    width: width,
    alignItems: "center",
    paddingVertical: 15,
  },
  headerActionContainer: {
    width: width - 40,
    backgroundColor: "#111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 15,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  headerActionSub: {
    fontSize: 12,
    color: "#555",
    marginTop: 1,
  },
});
