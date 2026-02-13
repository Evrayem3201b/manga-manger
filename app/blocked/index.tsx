import Card from "@/components/card";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface BlockedManga {
  manga_id: string;
  name: string;
  manga_image: string;
}

export default function BlockedMangaPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { showAlert } = useAlert(); // Initialize

  const [data, setData] = useState<BlockedManga[]>([]);
  const [localQuery, setLocalQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    try {
      let sql = `SELECT manga_id, name, manga_image FROM blocked_manga`;
      let params: any[] = [];

      if (localQuery) {
        sql += ` WHERE name LIKE ?`;
        params.push(`%${localQuery}%`);
      }
      sql += ` ORDER BY blocked_at DESC`;

      const results: BlockedManga[] = await db.getAllAsync(sql, params);
      setData(results);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [db, localQuery]);

  useFocusEffect(
    useCallback(() => {
      fetchBlocked();
    }, [fetchBlocked]),
  );

  const handleUnblock = (id: string, name: string) => {
    showAlert({
      title: "Unblock Manga",
      message: `Restore "${name}" to search results?`,
      type: "info",
      confirmText: "Unblock",
      onConfirm: async () => {
        await db.runAsync("DELETE FROM blocked_manga WHERE manga_id = ?", [id]);
        fetchBlocked();
      },
    });
  };

  const renderItem = ({ item }: { item: BlockedManga }) => (
    <Pressable
      onPress={() => handleUnblock(item.manga_id, item.name)}
      style={styles.cardWrapper}
    >
      <Card
        id={item.manga_id}
        name={item.name}
        totalChap={0}
        isAdult={false}
        status="blocked"
        coverUrl={{ uri: item.manga_image }}
        currentChap={0}
        search={true} // Uses the simpler "Total Ch." label style
      />
      {/* Visual indicator that this is a blocked item */}
      <View style={styles.blockOverlay}>
        <Ionicons name="ban" size={20} color="rgba(255,255,255,0.6)" />
      </View>
    </Pressable>
  );

  return (
    <ScreenHug
      scroll={false}
      title="Blacklist"
      style={{
        marginTop: -50,
      }}
      count={data?.length}
    >
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#444" />
          <TextInput
            style={styles.searchBar}
            placeholder="Search blacklist..."
            placeholderTextColor="#444"
            value={localQuery}
            onChangeText={setLocalQuery}
          />
        </View>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.manga_id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={60}
                color="#1a1a1e"
              />
              <Text style={styles.emptyText}>No blocked content found</Text>
            </View>
          }
        />
      )}
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: "row", gap: 10, marginBottom: 20, marginTop: 10 },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: "#1a1a1e",
  },
  searchBar: { flex: 1, color: "#fff", marginLeft: 10, fontSize: 16 },
  backBtn: {
    width: 52,
    height: 52,
    backgroundColor: "#0d0d0d",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1a1a1e",
  },
  columnWrapper: { justifyContent: "space-between", paddingHorizontal: 5 },
  cardWrapper: { position: "relative" },
  listContent: { paddingBottom: 100 },
  blockOverlay: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 4,
    borderRadius: 8,
    zIndex: 40,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 100,
    opacity: 0.3,
  },
  emptyText: { color: "#fff", marginTop: 15, fontWeight: "700", fontSize: 16 },
});
