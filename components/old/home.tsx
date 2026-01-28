import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import TabsContainer from "@/components/tab-container";
import { useFilterStore } from "@/stores/category-store";
import { filters, MangaDB } from "@/utils/types";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

export default function Home() {
  const db = useSQLiteContext();
  const [data, setData] = useState<MangaDB[]>([]);
  const [localQuery, setLocalQuery] = useState("");
  const currentFilter = useFilterStore((state) => state.filter);

  useFocusEffect(
    useCallback(() => {
      async function fetchManga() {
        let sql = "SELECT * FROM manga WHERE name LIKE ?";
        let params: any[] = [`%${localQuery}%`];

        if (currentFilter === "favorites") {
          sql =
            "SELECT m.* FROM manga m JOIN favorites f ON m.id = f.manga_id WHERE m.name LIKE ?";
        } else if (currentFilter === "plan-to-read") {
          sql =
            "SELECT m.* FROM manga m JOIN plan_to_read p ON m.id = p.manga_id WHERE m.name LIKE ?";
        } else if (currentFilter !== "all") {
          sql = "SELECT * FROM manga WHERE status = ? AND name LIKE ?";
          params = [currentFilter, `%${localQuery}%`];
        }

        sql += " ORDER BY updated_at DESC";
        const fetchedData: MangaDB[] = await db.getAllAsync(sql, params);
        setData(fetchedData);
      }
      fetchManga();
    }, [currentFilter, localQuery]),
  );

  return (
    <ScreenHug scroll={false} title="My Library" count={data?.length}>
      {/* Sleek Local Filter Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="filter-outline" size={18} color="#555" />
        <TextInput
          style={styles.searchBar}
          placeholder="Filter your collection..."
          placeholderTextColor="#444"
          value={localQuery}
          onChangeText={setLocalQuery}
        />
        {localQuery.length > 0 && (
          <Ionicons
            name="close-circle"
            size={16}
            color="#444"
            onPress={() => setLocalQuery("")}
          />
        )}
      </View>

      <TabsContainer
        data={filters.map((f) => f.name)}
        style={{
          marginVertical: 10,
          paddingBottom: 10,
          marginBottom: -10,
          zIndex: 999,
        }}
      />

      {data.length < 1 ? (
        <View style={styles.emptyState}>
          <Octicons name="stack" size={48} color="#1a1a1e" />
          <Text style={styles.emptyText}>
            {localQuery
              ? "No matches in your library."
              : "Your library is empty."}
          </Text>
        </View>
      ) : (
        <CardContainer
          mangaSimple={data.map((item) => ({
            id: item.id,
            name: item.name,
            totalChap: item.total_chap,
            status: item.status,
            coverUrl: { uri: item.cover_url },
            currentChap: item.current_chap,
            isAdult: item.is_adult === 1,
          }))}
        />
      )}
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    marginTop: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  searchBar: { flex: 1, color: "#fff", marginLeft: 10, fontSize: 15 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -50,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "center",
  },
});
