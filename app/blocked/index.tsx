import Card from "@/components/card";
import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  blocked_at: Date;
}

export default function BlockedMangaPage() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [data, setData] = useState<BlockedManga[]>([]);
  const [localQuery, setLocalQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    try {
      let sql = `SELECT manga_id, name, manga_image, blocked_at FROM blocked_manga`;
      let params: any[] = [];

      if (localQuery) {
        sql += ` WHERE name LIKE ?`;
        params.push(`%${localQuery}%`);
      }
      sql += ` ORDER BY blocked_at DESC`; // Changed to Alpha for easier finding in lists

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
      message: `Do you want to restore "${name}"? It will reappear in search results immediately.`,
      type: "info",
      confirmText: "Restore",
      onConfirm: async () => {
        await db.runAsync("DELETE FROM blocked_manga WHERE manga_id = ?", [id]);
        fetchBlocked();
      },
    });
  };

  const renderItem = ({ item }: { item: BlockedManga }) => (
    <View style={styles.itemContainer}>
      <Card
        id={item.manga_id}
        name={item.name}
        totalChap={0}
        isAdult={false}
        status="blocked"
        coverUrl={{ uri: item.manga_image }}
        currentChap={0}
        search={true}
      />
      <Pressable
        style={styles.unblockActionBtn}
        onPress={() => handleUnblock(item.manga_id, item.name)}
      >
        <MaterialCommunityIcons
          name="eye-check"
          size={18}
          color={Colors.dark.primary}
        />
        <Text style={styles.unblockText}>Restore</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenHug
      scroll={false}
      title="Blacklist"
      // Removed the large negative margin to prevent overlap with the Layout header
      style={{ marginTop: -40 }}
    >
      <View style={styles.headerInfo}>
        <Ionicons name="shield-checkmark" size={14} color="#555" />
        <Text style={styles.headerInfoText}>Hidden from search results</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#444" />
          <TextInput
            style={styles.searchBar}
            placeholder="Search restricted titles..."
            placeholderTextColor="#444"
            value={localQuery}
            onChangeText={setLocalQuery}
          />
          {localQuery !== "" && (
            <Pressable onPress={() => setLocalQuery("")}>
              <Ionicons name="close-circle" size={18} color="#444" />
            </Pressable>
          )}
        </View>
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
              <View style={styles.emptyIconCircle}>
                <Ionicons name="shield-checkmark" size={40} color="#222" />
              </View>
              <Text style={styles.emptyTitle}>Everything is clear</Text>
              <Text style={styles.emptySub}>
                Titles you block will appear here.
              </Text>
            </View>
          }
        />
      )}
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 15,
    marginTop: 0,
  },
  headerInfoText: {
    color: "#555",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111", // Matching your search box style
    borderRadius: 14,
    paddingHorizontal: 15,
    height: 48,
    borderWidth: 1,
    borderColor: "#222",
  },
  searchBar: {
    flex: 1,
    color: "#fff",
    marginLeft: 10,
    fontSize: 15,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 10,
  },
  itemContainer: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
  },
  unblockActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  unblockText: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  listContent: {
    paddingBottom: 150,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#0a0a0a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#111",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
  emptySub: {
    color: "#444",
    fontSize: 14,
    marginTop: 6,
    textAlign: "center",
  },
});
