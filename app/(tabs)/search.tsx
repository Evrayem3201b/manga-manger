import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { useSearchManga } from "@/hooks/fetching/useSearchManga";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

export default function Search() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [page, setPage] = useState(0);
  const [recentSearches, setRecentSearches] = useState<
    { query: string; result_ids: string }[]
  >([]);

  // NEW: Blocked Manga State
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  // Filter States
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const LIMIT = 20;
  const { results, isFetching, total } = useSearchManga(
    debounced,
    LIMIT,
    page * LIMIT,
  );
  const db = useSQLiteContext();

  const totalPages = useMemo(() => Math.ceil((total || 0) / LIMIT), [total]);

  // --- LOAD DATA ON FOCUS ---
  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
      loadBlockedManga(); // Fetch blocked list whenever screen comes into focus
    }, []),
  );

  const loadBlockedManga = async () => {
    try {
      const blocked: { manga_id: string }[] = await db.getAllAsync(
        `SELECT manga_id FROM blocked_manga`,
      );
      setBlockedIds(new Set(blocked.map((b) => b.manga_id)));
    } catch (e) {
      console.error("Failed to load blocked manga", e);
    }
  };

  const loadRecentSearches = async () => {
    try {
      const searchCache: { query: string; result_ids: string }[] =
        await db.getAllAsync(
          `SELECT query, result_ids FROM search_cache ORDER BY created_at DESC`,
        );
      if (searchCache) setRecentSearches(searchCache);
    } catch (e) {
      console.error("Failed to load searches", e);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredResults = useMemo(() => {
    return results.filter((manga) => {
      // 1. Check if Blocked (The "Secret" Filter)
      if (blockedIds.has(manga.id)) return false;

      // 2. Check Publication Status
      const matchStatus = !selectedStatus || manga.status === selectedStatus;

      // 3. Check Genres
      const matchGenres =
        selectedGenres.length === 0 ||
        selectedGenres.every((g) => manga.genres?.includes(g));

      return matchStatus && matchGenres;
    });
  }, [results, selectedStatus, selectedGenres, blockedIds]);

  // --- SEARCH DEBOUNCE & SAVE ---
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(0);
      const trimmed = query.trim();

      const lastSearch = recentSearches[0]?.query;
      if (
        trimmed.length > 2 &&
        trimmed.toLowerCase() !== lastSearch?.toLowerCase()
      ) {
        saveSearch(trimmed);
      }
    }, 600);

    return () => clearTimeout(t);
  }, [query]);

  const saveSearch = async (term: string) => {
    try {
      const uniqueId = Date.now().toString();
      await db.runAsync(
        `INSERT OR REPLACE INTO search_cache (query, result_ids, created_at) VALUES (?, ?, ?)`,
        [term, uniqueId, Date.now()],
      );
      loadRecentSearches();
    } catch (e) {
      console.error("Failed to save search", e);
    }
  };

  const removeSearch = async (id: string) => {
    try {
      await db.runAsync(`DELETE FROM search_cache WHERE result_ids = ?`, [id]);
      setRecentSearches((prev) => prev.filter((s) => s.result_ids !== id));
    } catch (e) {
      console.error("Delete failed", e);
    }
  };

  const clearAllRecent = async () => {
    try {
      setRecentSearches([]);
      await db.runAsync(`DELETE FROM search_cache`);
    } catch (e) {
      console.error("Clear failed", e);
    }
  };

  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>();
    results.forEach((manga) => {
      manga.genres?.forEach((g) => genresSet.add(g));
    });
    return Array.from(genresSet).sort();
  }, [results]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre],
    );
  };

  const clearFilters = () => {
    setSelectedStatus(null);
    setSelectedGenres([]);
  };

  return (
    <ScreenHug title="Search" scroll={false}>
      <View style={styles.container}>
        <View style={styles.searchRow}>
          <View
            style={[styles.searchBox, isFocused && styles.searchBoxFocused]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={isFocused ? Colors.dark.primary : "#555"}
            />
            <TextInput
              placeholder="Discover new manga..."
              placeholderTextColor="#555"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            />
            {isFetching && (
              <ActivityIndicator size="small" color={Colors.dark.primary} />
            )}
          </View>

          <Pressable
            style={[
              styles.filterBtn,
              (selectedStatus || selectedGenres.length > 0) &&
                styles.filterBtnActive,
            ]}
            onPress={() => setShowFilters(true)}
          >
            <View>
              <Ionicons
                name="options"
                size={22}
                color={
                  selectedStatus || selectedGenres.length > 0
                    ? "#000"
                    : Colors.dark.primary
                }
              />
              {(selectedStatus || selectedGenres.length > 0) && (
                <View style={styles.filterBadge} />
              )}
            </View>
          </Pressable>
        </View>

        {query === "" ? (
          <ScrollView
            style={styles.recentContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent Searches</Text>
              {recentSearches.length > 0 && (
                <Pressable onPress={clearAllRecent}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </Pressable>
              )}
            </View>

            {recentSearches.map((item, idx) => (
              <Pressable
                key={idx}
                style={styles.recentItem}
                onPress={() => setQuery(item.query)}
              >
                <View style={styles.recentLeft}>
                  <MaterialCommunityIcons
                    name="history"
                    size={20}
                    color="#444"
                  />
                  <Text style={styles.recentText} numberOfLines={1}>
                    {item.query}
                  </Text>
                </View>
                <Pressable
                  hitSlop={15}
                  onPress={() => removeSearch(item.result_ids)}
                >
                  <Ionicons name="close" size={18} color="#444" />
                </Pressable>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <>
            {total > LIMIT && filteredResults.length !== 0 && (
              <View style={styles.paginationRow}>
                <Pressable
                  style={[styles.pageBtn, page === 0 && styles.btnDisabled]}
                  disabled={page === 0 || isFetching}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <Ionicons
                    name="chevron-back"
                    size={20}
                    color={page === 0 ? "#333" : "#fff"}
                  />
                </Pressable>

                <View style={styles.pageIndicator}>
                  <Text style={styles.pageText}>
                    {page + 1}{" "}
                    <Text style={styles.pageTotalText}>/ {totalPages}</Text>
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.pageBtn,
                    page + 1 >= totalPages && styles.btnDisabled,
                  ]}
                  disabled={page + 1 >= totalPages || isFetching}
                  onPress={() => setPage((p) => p + 1)}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={page + 1 >= totalPages ? "#333" : "#fff"}
                  />
                </Pressable>
              </View>
            )}
            <CardContainer search mangaSimple={filteredResults} />
          </>
        )}

        {/* Modal remains the same */}
        <Modal visible={showFilters} animationType="slide" transparent>
          {/* ... modal content ... */}
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Filters</Text>
                  <Text style={styles.modalSubTitle}>
                    {filteredResults.length} matches found
                  </Text>
                </View>
                <Pressable onPress={() => setShowFilters(false)}>
                  <Ionicons name="close" size={28} color="#555" />
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Publication Status</Text>
                  {selectedStatus && (
                    <Pressable onPress={() => setSelectedStatus(null)}>
                      <Text style={styles.clearText}>Reset</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.chipRow}>
                  {["ongoing", "completed", "hiatus", "cancelled"].map((s) => (
                    <Pressable
                      key={s}
                      onPress={() =>
                        setSelectedStatus(selectedStatus === s ? null : s)
                      }
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
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                {availableGenres.length > 0 && (
                  <>
                    <View style={[styles.sectionHeader, { marginTop: 25 }]}>
                      <Text style={styles.label}>Genres in Results</Text>
                      {selectedGenres.length > 0 && (
                        <Pressable onPress={() => setSelectedGenres([])}>
                          <Text style={styles.clearText}>Reset</Text>
                        </Pressable>
                      )}
                    </View>
                    <View style={styles.chipRow}>
                      {availableGenres.map((g) => (
                        <Pressable
                          key={g}
                          onPress={() => toggleGenre(g)}
                          style={[
                            styles.chip,
                            selectedGenres.includes(g) && styles.chipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selectedGenres.includes(g) &&
                                styles.chipTextActive,
                            ]}
                          >
                            {g}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.footerRow}>
                <Pressable style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear All</Text>
                </Pressable>
                <Pressable
                  style={styles.applyBtn}
                  onPress={() => setShowFilters(false)}
                >
                  <Text style={styles.applyBtnText}>Show Results</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  // ... your existing styles ...
  container: { flex: 1, paddingTop: 10 },
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 15 },
  searchBox: {
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
  searchBoxFocused: { borderColor: Colors.dark.primary },
  input: { flex: 1, color: "#fff", marginLeft: 10, fontSize: 16 },
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
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
  },
  recentContainer: { flex: 1, marginBottom: 90 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 5,
  },
  recentTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  clearAllText: { color: Colors.dark.primary, fontSize: 14, fontWeight: "600" },
  recentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#111",
  },
  recentLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  recentText: { color: "#888", fontSize: 16, fontWeight: "500", width: "70%" },
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
    alignItems: "flex-start",
    marginBottom: 25,
  },
  modalTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  modalSubTitle: { color: "#555", fontSize: 13, marginTop: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    color: "#444",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  clearText: { color: Colors.dark.primary, fontSize: 12, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  chipActive: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  chipText: { color: "#666", fontSize: 13, fontWeight: "600" },
  chipTextActive: { color: "#000", fontWeight: "800" },
  footerRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  clearBtn: {
    flex: 1,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  clearBtnText: { color: "#fff", fontWeight: "700" },
  applyBtn: {
    flex: 2,
    backgroundColor: Colors.dark.primary,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  applyBtnText: { fontWeight: "900", fontSize: 16, color: "#000" },

  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 15,
    marginTop: 0,
    paddingBottom: 15,
  },
  pageBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#111",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  btnDisabled: { opacity: 0.5, borderColor: "transparent" },
  pageIndicator: {
    backgroundColor: "#111",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#222",
  },
  pageText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  pageTotalText: { color: "#555", fontSize: 14, fontWeight: "400" },
});
