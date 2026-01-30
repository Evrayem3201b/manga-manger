import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { getStatusFromName } from "@/utils/getStatus";
import { MangaDB } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Home() {
  const db = useSQLiteContext();
  const [data, setData] = useState<MangaDB[]>([]);
  const [localQuery, setLocalQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("all");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "priority" | "queue">(
    "recent",
  );
  const [isMigrating, setIsMigrating] = useState(true);

  const activeFilterCount =
    (selectedStatus !== "all" ? 1 : 0) + selectedGenres.length;
  const runMigrations = useCallback(async () => {
    try {
      const tableInfo: any = await db.getAllAsync(`PRAGMA table_info(manga)`);
      const columns = tableInfo.map((c: any) => c.name);
      if (!columns.includes("is_pinned")) {
        await db.runAsync(
          `ALTER TABLE manga ADD COLUMN is_pinned INTEGER DEFAULT 0`,
        );
      }
      if (!columns.includes("queue_order")) {
        await db.runAsync(
          `ALTER TABLE manga ADD COLUMN queue_order INTEGER DEFAULT 0`,
        );
      }

      return true;
    } catch (e) {
      console.error("Migration Error:", e);
      return false;
    }
  }, [db]);

  useEffect(() => {
    async function init() {
      const success = await runMigrations();
      if (!success)
        Alert.alert("Database Error", "Structure could not be updated.");
      setIsMigrating(false);
      getGenres();
    }
    init();
  }, [runMigrations]);

  async function getGenres() {
    try {
      const result: { genre: string }[] = await db.getAllAsync(
        `SELECT DISTINCT genre FROM manga_genres ORDER BY genre ASC`,
      );
      setAvailableGenres(result.map((r) => r.genre));
    } catch (e) {
      console.error("Genre fetch error:", e);
    }
  }

  const fetchFilteredManga = useCallback(async () => {
    if (isMigrating) return;
    try {
      let params = `%${localQuery}%`;
      let sql = `SELECT m.*, 
                            EXISTS(SELECT 1 FROM favorites f WHERE f.manga_id = m.id) AS is_favorite,
                             EXISTS(SELECT 1 FROM plan_to_read p WHERE p.manga_id = m.id) AS is_planned,
                            GROUP_CONCAT(g.genre, ',') AS genres  FROM manga m LEFT JOIN manga_genres g ON g.manga_id = m.id WHERE m.name LIKE ? GROUP BY m.id ORDER BY m.updated_at DESC`;

      const fetchedData: MangaDB[] = await db.getAllAsync(sql, params);

      if (selectedStatus === "favorites") {
        const newData = fetchedData.filter((m) => m.is_favorite === 1);
        setData(newData);
        return;
      }
      if (selectedStatus === "plan-to-read") {
        const newData = fetchedData.filter((m) => m.is_planned === 1);
        setData(newData);
        return;
      }

      if (selectedGenres.length > 0) {
        const newData = fetchedData.filter((m) => {
          const mangaGenres = m.genres?.split(",");

          return mangaGenres?.some((genre) => selectedGenres.includes(genre));
        });
        setData(newData);
        return;
      }
      setData(fetchedData);
    } catch (e) {
      Alert.alert("Filter Error", "Error: " + e);
    }
  }, [selectedStatus, selectedGenres, localQuery, sortBy, isMigrating, db]);

  useFocusEffect(
    useCallback(() => {
      fetchFilteredManga();
    }, [fetchFilteredManga]),
  );

  if (isMigrating) {
    return (
      <ScreenHug title="My Library">
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loaderText}>Syncing Database...</Text>
        </View>
      </ScreenHug>
    );
  }

  return (
    <ScreenHug scroll={false} title="My Library" count={data?.length}>
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#444" />
          <TextInput
            style={styles.searchBar}
            placeholder="Filter collection..."
            placeholderTextColor="#444"
            value={localQuery}
            onChangeText={setLocalQuery}
          />
        </View>

        <Pressable
          style={[
            styles.filterBtn,
            activeFilterCount > 0 && styles.filterBtnActive,
          ]}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons
            name="options"
            size={22}
            color={activeFilterCount > 0 ? "#000" : Colors.dark.primary}
          />
        </Pressable>
      </View>

      <CardContainer
        mangaSimple={data.map((item) => ({
          id: item.id,
          name: item.name,
          totalChap: item.total_chap,
          status: item.status,
          coverUrl: { uri: item.cover_url },
          currentChap: item.current_chap,
          isAdult: item.is_adult === 1,
          isPinned: item.is_pinned === 1,
          inQueue: (item.queue_order ?? 0) > 0,
          coverOnlineLink: item.cover_online_link,
          isFavorite: !!item.is_favorite,
          isPlanToRead: !!item.is_planned,
        }))}
      />

      <Modal visible={showFilters} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Library Filters</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Filter logic content here remains the same as your provided code */}
              <Text style={styles.label}>Status & Lists</Text>
              <View style={styles.chipRow}>
                {[
                  "all",
                  "ongoing",
                  "completed",
                  "plan-to-read",
                  "favorites",
                ].map(async (s) => {
                  const status = await getStatusFromName(s)?.title;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setSelectedStatus(s)}
                      style={[
                        styles.chip,
                        selectedStatus === s && styles.chipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          selectedStatus === s && styles.chipTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={[styles.label, { marginTop: 20 }]}>Genres</Text>
              <View style={styles.chipRow}>
                {availableGenres.map((g) => (
                  <Pressable
                    key={g}
                    onPress={() =>
                      setSelectedGenres((prev) =>
                        prev.includes(g)
                          ? prev.filter((x) => x !== g)
                          : [...prev, g],
                      )
                    }
                    style={[
                      styles.chip,
                      selectedGenres.includes(g) && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selectedGenres.includes(g) && styles.chipTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <View style={styles.modalFooter}>
              <Pressable
                style={styles.applyBtn}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyBtnText}>
                  Show {data.length} Results
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loaderText: { color: "#666", marginTop: 10, fontWeight: "600" },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 15, marginTop: 20 },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: "#222",
  },
  searchBar: { flex: 1, color: "#fff", marginLeft: 10, fontSize: 16 },
  filterBtn: {
    width: 52,
    height: 52,
    backgroundColor: "#111",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  sortBtn: {
    width: 52,
    height: 52,
    backgroundColor: "#111",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  filterBtnActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0a0a0a",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: "70%",
    borderTopWidth: 1,
    borderColor: "#222",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "800" },
  label: {
    color: "#444",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  chipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  chipText: { color: "#666", fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: "#000", fontWeight: "800" },
  modalFooter: { paddingTop: 10 },
  applyBtn: {
    backgroundColor: Colors.dark.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: { fontWeight: "900", fontSize: 16 },
});
