import CardContainer from "@/components/card-container";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { useSearchManga } from "@/hooks/fetching/useSearchManga";
import { Ionicons } from "@expo/vector-icons";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
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

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    const saveQuery = async () => {
      if (query.length === 0) return;
      try {
        await db.runAsync(
          `INSERT INTO search_cache (query, result_ids, created_at) VALUES (?, ?, ?)`,
          [query, JSON.stringify(ids), Date.now()],
        );
      } catch (e) {
        console.error("Failed to save recent search:", e);
      }
    };
    saveQuery();
    return () => clearTimeout(t);
  }, [query]);

  const { results } = useSearchManga(debounced);
  setIds(results.map((m) => m.id));
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

          {query.length > 0 && results.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>
                No results yet. Start typing to search.
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
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
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
