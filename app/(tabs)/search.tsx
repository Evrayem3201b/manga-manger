import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useSearchManga } from "@/hooks/fetching/useSearchManga";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
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
  const db = useSQLiteContext();
  const [ids, setIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<
    { query: string; result_ids: string[] }[]
  >([]);
  const { results } = useSearchManga(debounced);

  // 2. Handle Debounce separately to keep UI snappy
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // 3. Save to DB ONLY when results arrive and actually exist
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
          console.error("Cache error:", e);
        }
      };
      saveToCache();
    }
  }, [results]); // Only trigger when API results change

  // 4. Load history once on mount
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
  }, []);
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
              placeholder="Search manga, anime, characters..."
              placeholderTextColor="#999"
              style={styles.input}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </Pressable>
            )}
          </View>

          <CardContainer search mangaSimple={results} />
          {/* 1. Show Recent Searches ONLY when the input is empty */}
          {query.length === 0 && recentSearches.length > 0 && (
            <View style={styles.historyContainer}>
              <ThemedText
                lightColor={Colors.dark.text}
                style={styles.sectionTitle}
              >
                Recent Searches
              </ThemedText>
              {recentSearches.map((item, index) => (
                <Pressable
                  key={index}
                  style={styles.recentItem}
                  onPress={() => {
                    setQuery(item.query);
                    setDebounced(item.query); // Skip debounce for history clicks
                  }}
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color={Colors.dark.primary}
                  />
                  <Text style={styles.recentText}>{item.query}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* 2. Show No Results message only when user has typed but nothing came back */}
          {query.length > 2 && results.length === 0 && (
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
  historyContainer: {
    // flex: 1,
    // width: "100%",
    height: "100%",
    marginTop: 10,
    alignItems: "flex-start",
  },
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: Colors.dark.background, // true dark background
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,

    backgroundColor: "#1a1a1e", // elevated dark surface
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",

    marginBottom: 24,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#f5f5f7", // primary text
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9b9ba1", // muted label
    marginBottom: 10,
    paddingHorizontal: 4,
  },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
  },

  recentText: {
    fontSize: 16,
    color: "#e6e6eb",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    opacity: 0.85,
  },

  emptyText: {
    fontSize: 15,
    color: "#8e8e93",
    textAlign: "center",
    maxWidth: 260,
  },
});
