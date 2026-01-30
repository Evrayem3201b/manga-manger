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
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const RECENT_SEARCHES_KEY = "@recent_searches_db";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Local Filter States
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  // 1. Fetch data based ONLY on the text query
  const { results, isFetching } = useSearchManga(debounced, 20, 0);
  const db = useSQLiteContext();

  // Persistence Logic
  useFocusEffect(
    useCallback(() => {
      loadRecentSearches();
    }, []),
  );

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      if (query.trim().length > 2) {
        saveSearch(query.trim());
      }
    }, 600);

    return () => clearTimeout(t);
  }, [query]);

  const loadRecentSearches = async () => {
    try {
      const searchCache: { query: string }[] = await db.getAllAsync(
        `SELECT query FROM search_cache ORDER BY created_at DESC`,
      );

      if (searchCache) setRecentSearches(searchCache.map((s) => s.query));
    } catch (e) {
      Alert.alert("Failed to load searches");
    }
  };

  const saveSearch = async (term: string) => {
    try {
      setRecentSearches([term, ...recentSearches]);
      await db.runAsync(
        `INSERT INTO search_cache (query, created_at) VALUES (?, ?)`,
        [term, Date.now()],
      );
    } catch (e) {
      Alert.alert("Failed to save search", `${e}`);
    }
  };

  const removeSearch = async (term: string) => {
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    await db.runAsync(`DELETE FROM search_cache WHERE query = ?`, term);
  };

  const clearAllRecent = async () => {
    setRecentSearches([]);
    await db.runAsync(`DELETE FROM search_cache`);
  };

  // 2. Extract dynamic genres from results
  const availableGenres = useMemo(() => {
    const genres = new Set<string>();
    results.forEach((manga) => {
      manga.genres.forEach((g) => genres.add(g));
    });
    return Array.from(genres).sort();
  }, [results]);

  // 3. Client-side Filter Logic
  const filteredResults = useMemo(() => {
    return results.filter((manga) => {
      const matchStatus = !selectedStatus || manga.status === selectedStatus;
      const matchGenres =
        selectedGenres.length === 0 ||
        selectedGenres.every((g) => manga.genres.includes(g));
      return matchStatus && matchGenres;
    });
  }, [results, selectedStatus, selectedGenres]);

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
              name="globe-outline"
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

        {/* --- RECENT SEARCHES CONTENT (Appears when query is empty) --- */}
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

            {recentSearches.length > 0 ? (
              recentSearches.map((item, idx) => (
                <Pressable
                  key={idx}
                  style={styles.recentItem}
                  onPress={() => setQuery(item)}
                >
                  <View style={styles.recentLeft}>
                    <MaterialCommunityIcons
                      name="history"
                      size={20}
                      color="#444"
                    />
                    <Text style={styles.recentText}>{item}</Text>
                  </View>
                  <Pressable hitSlop={10} onPress={() => removeSearch(item)}>
                    <Ionicons name="close" size={18} color="#444" />
                  </Pressable>
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyRecent}>
                <Ionicons name="search-outline" size={50} color="#1a1a1e" />
                <Text style={styles.emptyRecentText}>
                  Try searching for a title or author
                </Text>
              </View>
            )}
          </ScrollView>
        ) : (
          <CardContainer search mangaSimple={filteredResults} />
        )}

        {/* --- MODAL (Kept exactly as requested) --- */}
        <Modal visible={showFilters} animationType="slide" transparent>
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
  // Recent Searches Styling
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
  recentText: {
    color: "#888",
    fontSize: 16,
    fontWeight: "500",
    width: "70%",
  },
  emptyRecent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 100,
  },
  emptyRecentText: {
    color: "#333",
    marginTop: 15,
    fontSize: 14,
    fontWeight: "600",
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
});
