import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { MangaDB } from "@/utils/types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
      let params: any[] = [`%${localQuery}%`];
      let sql = `SELECT m.* FROM manga m`;
      if (selectedStatus === "favorites")
        sql += ` JOIN favorites f ON m.id = f.manga_id`;
      else if (selectedStatus === "plan-to-read")
        sql += ` JOIN plan_to_read p ON m.id = p.manga_id`;
      if (selectedGenres.length > 0)
        sql += ` JOIN manga_genres mg ON m.id = mg.manga_id`;
      sql += ` WHERE m.name LIKE ?`;
      if (
        selectedStatus !== "all" &&
        selectedStatus !== "favorites" &&
        selectedStatus !== "plan-to-read"
      ) {
        sql += ` AND m.status = ?`;
        params.push(selectedStatus);
      }
      if (selectedGenres.length > 0) {
        sql += ` AND mg.genre IN (${selectedGenres.map(() => "?").join(",")})`;
        params.push(...selectedGenres);
        sql += ` GROUP BY m.id HAVING COUNT(DISTINCT mg.genre) = ?`;
        params.push(selectedGenres.length);
      }
      sql += ` ORDER BY m.is_pinned DESC`;
      if (sortBy === "queue") sql += `, m.queue_order ASC, m.updated_at DESC`;
      else if (sortBy === "priority")
        sql += `, m.rating DESC, m.updated_at DESC`;
      else sql += `, m.updated_at DESC`;

      const fetchedData: MangaDB[] = await db.getAllAsync(sql, params);
      setData(fetchedData);
    } catch (e) {
      console.error("Filter Error:", e);
    }
  }, [selectedStatus, selectedGenres, localQuery, sortBy, isMigrating]);

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
            styles.sortBtn,
            sortBy !== "recent" && { borderColor: Colors.dark.primary },
          ]}
          onPress={() =>
            setSortBy((prev) =>
              prev === "recent"
                ? "priority"
                : prev === "priority"
                  ? "queue"
                  : "recent",
            )
          }
        >
          <MaterialCommunityIcons
            name={
              sortBy === "queue"
                ? "layers-triple"
                : sortBy === "priority"
                  ? "star-check"
                  : "clock-outline"
            }
            size={22}
            color={sortBy !== "recent" ? Colors.dark.primary : "#444"}
          />
        </Pressable>
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
              <Text style={styles.label}>Status & Lists</Text>
              <View style={styles.chipRow}>
                {[
                  "all",
                  "ongoing",
                  "completed",
                  "plan-to-read",
                  "favorites",
                ].map((s) => (
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
                      {s.replace("-", " ")}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
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
});
