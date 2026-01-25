import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useSearchManga } from "@/hooks/fetching/useSearchManga";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Search() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  const limit = 20;

  const db = useSQLiteContext();
  const [recentSearches, setRecentSearches] = useState<
    { query: string; result_ids: string[] }[]
  >([]);

  const [page, setPage] = useState(1);

  // Pass limit and offset ( (page - 1) * limit ) to the hook
  const { results, total, isFetching } = useSearchManga(
    debounced,
    limit,
    (page - 1) * limit,
  );

  const totalPages = Math.ceil(total / limit);

  // 1. Handle Debounce & Reset Page on new search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // 2. Save search to history
  useEffect(() => {
    if (debounced.length > 2 && results.length > 0) {
      const saveToCache = async () => {
        try {
          const resultIds = results.map((m) => m.id);
          await db.runAsync(
            `INSERT OR REPLACE INTO search_cache (query, result_ids, created_at) VALUES (?, ?, ?)`,
            [debounced, JSON.stringify(resultIds), Date.now()],
          );
        } catch (e) {
          Alert.alert("Cache error:" + e);
        }
      };
      saveToCache();
    }
  }, [results]);

  // 3. Load history on mount
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const rows = await db.getAllAsync<{
          query: string;
          result_ids: string;
        }>(
          `SELECT query, result_ids FROM search_cache ORDER BY created_at DESC LIMIT 10`,
        );
        setRecentSearches(
          rows.map((r) => ({
            query: r.query,
            result_ids: JSON.parse(r.result_ids),
          })),
        );
      } catch (e) {
        Alert.alert(`${e}`);
      }
    };
    loadRecentSearches();
  }, [db]);

  async function removeRecentSearch(queryToDelete: string) {
    try {
      await db.runAsync(`DELETE FROM search_cache WHERE query = ?`, [
        queryToDelete,
      ]);
      // Update local state to remove it from UI immediately
      setRecentSearches((prev) =>
        prev.filter((item) => item.query !== queryToDelete),
      );
    } catch (e) {
      Alert.alert("Delete error:" + e);
    }
  }

  return (
    <ScreenHug title="Search" scroll={false}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.container}>
          {/* Search Input */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              placeholder="Search manga..."
              placeholderTextColor="#999"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            />
            {isFetching && (
              <ActivityIndicator
                size="small"
                color={Colors.dark.primary}
                style={{ marginRight: 8 }}
              />
            )}
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </Pressable>
            )}
          </View>

          {/* Results List */}
          <CardContainer search mangaSimple={results} />

          {/* Floating Pagination Bar */}
          {results.length > 0 && (
            <View style={styles.paginationWrapper}>
              <View style={styles.paginationBlur}>
                <Pressable
                  disabled={page === 1}
                  onPress={() => setPage((p) => p - 1)}
                  style={({ pressed }) => [
                    styles.pageBtn,
                    page === 1 && { opacity: 0.2 },
                    pressed && { backgroundColor: "rgba(255,255,255,0.05)" },
                  ]}
                >
                  <Ionicons
                    name="chevron-back"
                    size={22}
                    color={Colors.dark.primary}
                  />
                </Pressable>

                <View style={styles.pageInfo}>
                  <Text style={styles.pageLabel}>PAGE</Text>
                  <Text style={styles.pageCurrent}>{page}</Text>
                  <Text style={styles.pageDivider}>/</Text>
                  <Text style={styles.pageTotal}>{totalPages || 1}</Text>
                </View>

                <Pressable
                  disabled={page >= totalPages}
                  onPress={() => setPage((p) => p + 1)}
                  style={({ pressed }) => [
                    styles.pageBtn,
                    page >= totalPages && { opacity: 0.2 },
                    pressed && { backgroundColor: "rgba(255,255,255,0.05)" },
                  ]}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={22}
                    color={Colors.dark.primary}
                  />
                </Pressable>
              </View>
            </View>
          )}

          {/* Recent Searches Overlay */}
          {query.length === 0 && recentSearches.length > 0 && (
            <View style={styles.historyContainer}>
              <ThemedText style={styles.sectionTitle}>
                Recent Searches
              </ThemedText>
              {recentSearches.map((item, index) => (
                <View key={index} style={styles.recentItemRow}>
                  <Pressable
                    style={styles.recentItemContent}
                    onPress={() => setQuery(item.query)}
                  >
                    <Ionicons
                      name="time-outline"
                      size={20}
                      color={Colors.dark.primary}
                    />
                    <Text style={styles.recentText}>{item.query}</Text>
                  </Pressable>

                  {/* The 'X' Remove Button */}
                  <Pressable
                    onPress={() => removeRecentSearch(item.query)}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      { opacity: pressed ? 0.5 : 1 },
                    ]}
                  >
                    <Ionicons name="close" size={20} color="#444" />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {query.length > 2 && results.length === 0 && !isFetching && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#333" />
              <Text style={styles.emptyText}>
                No results found for `{query}`
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.dark.background,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#16161a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
    marginHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#f5f5f7",
  },
  historyContainer: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    backgroundColor: Colors.dark.background,
    bottom: 0,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
  },
  // Pagination Styles
  paginationWrapper: {
    position: "absolute",
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  paginationBlur: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(28, 28, 32, 0.95)",
    padding: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
  },
  pageBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  pageInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  pageLabel: {
    color: "#555",
    fontSize: 9,
    fontWeight: "900",
    marginRight: 8,
    letterSpacing: 1,
  },
  pageCurrent: {
    color: Colors.dark.primary,
    fontSize: 18,
    fontWeight: "bold",
  },
  pageDivider: {
    color: "#444",
    fontSize: 16,
    marginHorizontal: 6,
  },
  pageTotal: {
    color: "#777",
    fontSize: 14,
    fontWeight: "600",
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Pushes X to the right
    paddingVertical: 8,
  },
  recentItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1, // Takes up remaining space so user can tap the text easily
    height: 40,
  },
  removeBtn: {
    padding: 8,
    marginLeft: 10,
  },
  recentText: {
    fontSize: 16,
    color: "#ccc",
  },
});
