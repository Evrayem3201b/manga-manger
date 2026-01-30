import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { MangaDB } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [isMigrating, setIsMigrating] = useState(true);

  const activeFilterCount =
    (selectedStatus !== "all" ? 1 : 0) + selectedGenres.length;

  // --- MIGRATIONS ---
  const runMigrations = useCallback(async () => {
    try {
      const tableInfo: any = await db.getAllAsync(`PRAGMA table_info(manga)`);
      const appMetaInfo: any = await db.getAllAsync(
        `PRAGMA table_info(app_meta)`,
      );
      const columns = tableInfo.map((c: any) => c.name);
      const metaColumns = appMetaInfo.map((c: any) => c.name);
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
      if (!metaColumns.includes("prop")) {
        await db.runAsync(`ALTER TABLE app_meta ADD COLUMN prop TEXT`);
      }
      if (!metaColumns.includes("value")) {
        await db.runAsync(
          `ALTER TABLE app_meta ADD COLUMN value TEXT DEFAULT '0'`,
        );
      }
      return true;
    } catch (e) {
      console.error("Migration Error:", e);
      return false;
    }
  }, [db]);

  // --- DYNAMIC GENRE FETCHING ---
  const getGenres = useCallback(
    async (status: string | null) => {
      try {
        let sql = `
        SELECT DISTINCT g.genre 
        FROM manga_genres g
        JOIN manga m ON g.manga_id = m.id
      `;
        let params: any[] = [];

        if (status && status !== "all") {
          if (status === "favorites") {
            sql += ` WHERE EXISTS(SELECT 1 FROM favorites f WHERE f.manga_id = m.id)`;
          } else if (status === "plan-to-read") {
            sql += ` WHERE EXISTS(SELECT 1 FROM plan_to_read p WHERE p.manga_id = m.id)`;
          } else {
            sql += ` WHERE m.status = ?`;
            params.push(status);
          }
        }

        sql += ` ORDER BY g.genre ASC`;

        const result: { genre: string }[] = await db.getAllAsync(sql, params);
        const validGenres = result.map((r) => r.genre);
        setAvailableGenres(validGenres);

        // Cleanup selected genres if they are no longer in the valid list for this status
        setSelectedGenres((prev) =>
          prev.filter((g) => validGenres.includes(g)),
        );
      } catch (e) {
        console.error("Genre fetch error:", e);
      }
    },
    [db],
  );

  // --- FILTERED FETCH ---
  const fetchFilteredManga = useCallback(async () => {
    if (isMigrating) return;
    try {
      let params: any[] = [`%${localQuery}%`];

      let sql = `
        SELECT m.*, 
          EXISTS(SELECT 1 FROM favorites f WHERE f.manga_id = m.id) AS is_favorite,
          EXISTS(SELECT 1 FROM plan_to_read p WHERE p.manga_id = m.id) AS is_planned,
          (SELECT GROUP_CONCAT(genre) FROM manga_genres WHERE manga_id = m.id) AS genres
        FROM manga m
        WHERE m.name LIKE ?
      `;

      if (selectedStatus && selectedStatus !== "all") {
        if (selectedStatus === "favorites") {
          sql += ` AND EXISTS(SELECT 1 FROM favorites f WHERE f.manga_id = m.id)`;
        } else if (selectedStatus === "plan-to-read") {
          sql += ` AND EXISTS(SELECT 1 FROM plan_to_read p WHERE p.manga_id = m.id)`;
        } else {
          sql += ` AND m.status = ?`;
          params.push(selectedStatus);
        }
      }

      if (selectedGenres.length > 0) {
        selectedGenres.forEach((genre) => {
          sql += ` AND EXISTS(SELECT 1 FROM manga_genres mg WHERE mg.manga_id = m.id AND mg.genre = ?)`;
          params.push(genre);
        });
      }

      sql += ` ORDER BY m.updated_at DESC`;

      const fetchedData: MangaDB[] = await db.getAllAsync(sql, params);
      setData(fetchedData);
    } catch (e) {
      console.error("Fetch Error:", e);
    }
  }, [selectedStatus, selectedGenres, localQuery, isMigrating, db]);

  // Initial load
  useEffect(() => {
    async function init() {
      const success = await runMigrations();
      if (success) {
        setIsMigrating(false);
        getGenres(selectedStatus);
      }
    }
    init();
  }, [runMigrations]);

  // Sync genres when status changes
  useEffect(() => {
    if (!isMigrating) {
      getGenres(selectedStatus);
    }
  }, [selectedStatus, isMigrating, getGenres]);

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
              <Text style={styles.label}>Status & Lists</Text>
              <View style={styles.chipRow}>
                {[
                  "all",
                  "ongoing",
                  "completed",
                  "plan-to-read",
                  "favorites",
                  "cancelled",
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
                      {s.replace(/-/g, " ").toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 25 }]}>
                Genres ({availableGenres.length})
              </Text>
              <View style={styles.chipRow}>
                {availableGenres.length > 0 ? (
                  availableGenres.map((g) => (
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
                  ))
                ) : (
                  <Text style={styles.emptyText}>No genres found</Text>
                )}
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
    height: "75%",
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
  modalFooter: { paddingTop: 20 },
  applyBtn: {
    backgroundColor: Colors.dark.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: { color: "#000", fontWeight: "900", fontSize: 16 },
  emptyText: { color: "#333", fontStyle: "italic", marginTop: 5 },
});
