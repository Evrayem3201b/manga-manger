import { Colors } from "@/constants/theme";
import { SimpleDisplay } from "@/utils/types";
import { Octicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Card from "./card";
import { ThemedText } from "./themed-text";

const { width } = Dimensions.get("window");
const cardWidth = 175;
const numColumns = Math.floor(width / cardWidth);

interface Props {
  search?: boolean;
  mangaSimple: (SimpleDisplay & {
    isAdult?: boolean;
    coverOnlineLink?: string;
  })[];
  style?: ViewStyle;
}

export default function CardContainer({ mangaSimple, search, style }: Props) {
  const db = useSQLiteContext();

  const [localManga, setLocalManga] = useState(mangaSimple);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const isSyncingRef = useRef(false);
  const hasAttemptedSync = useRef(false); // Track if we've already tried syncing this session

  // 2. The Trigger: Watch mangaSimple for data
  useEffect(() => {
    if (search || mangaSimple.length === 0 || hasAttemptedSync.current) return;

    async function runSyncFlow() {
      hasAttemptedSync.current = true; // Lock immediately to prevent double-runs

      try {
        // Check for the restore flag
        const flag = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM app_meta WHERE prop = 'needs_cover_sync'`,
        );

        await performSync();

        if (flag?.value === "1") {
          await db.runAsync(
            `UPDATE app_meta SET value = '0' WHERE prop = 'needs_cover_sync'`,
          );
          Alert.alert("Library restored", "Covers synced successfully");
        }
      } catch (e) {
        Alert.alert("Sync Flow Error", `${e}`);
      }
    }

    runSyncFlow();
  }, [mangaSimple, db]); // Runs when manga list arrives or DB changes

  useEffect(() => {
    setLocalManga(mangaSimple);
  }, [mangaSimple]);

  const downloadItem = async (item: any, coversDir: FileSystem.Directory) => {
    if (!item.coverOnlineLink) return false;

    try {
      setSyncingIds((prev) => [...prev, item.id]);

      // Ensure filename is clean
      const destinationFile = new FileSystem.File(coversDir, `${item.id}.jpg`);

      const output = await FileSystem.File.downloadFileAsync(
        item.coverOnlineLink,
        destinationFile,
        { idempotent: true },
      );

      await db.runAsync(`UPDATE manga SET cover_url = ? WHERE id = ?`, [
        output.uri,
        item.id,
      ]);

      setLocalManga((prev) =>
        prev.map((m) =>
          m.id === item.id ? { ...m, coverUrl: { uri: output.uri } } : m,
        ),
      );
      return true;
    } catch (e) {
      // Alert.alert(`Download failed for ${item.name}`, e);
      return false;
    } finally {
      setSyncingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const performSync = async () => {
    if (isSyncingRef.current || search) return;
    isSyncingRef.current = true;

    const failedItems: typeof mangaSimple = [];

    try {
      // Use the standard document path for covers
      const coversDir = new FileSystem.Directory(
        FileSystem.Paths.document,
        "covers",
      );

      if (!coversDir.exists) {
        await coversDir.create();
      }

      for (const item of mangaSimple) {
        let needsDownload = false;

        // SAFE PATH CHECK:
        // We check if the file exists physically in the 'covers' folder
        const localFile = new FileSystem.File(coversDir, `${item.id}.jpg`);

        // If the database path is empty OR the physical file is missing
        if (!item.coverUrl?.uri || !localFile.exists) {
          needsDownload = true;
        }

        if (needsDownload && item.coverOnlineLink) {
          const success = await downloadItem(item, coversDir);
          if (!success) failedItems.push(item);
        }
      }

      // Quick retry for failed items
      if (failedItems.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        for (const item of failedItems) {
          await downloadItem(item, coversDir);
        }
      }
    } catch (err) {
      Alert.alert("Sync process error", `${err}`);
    } finally {
      isSyncingRef.current = false;
    }
  };

  return (
    <FlatList
      data={localManga}
      key={`grid-${numColumns}`}
      numColumns={numColumns}
      contentContainerStyle={[styles.listContent, style]}
      columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : null}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        !search ? (
          <View style={styles.headerWrapper}>
            <Pressable
              onPress={() => router.push("/home/add-manga")}
              style={({ pressed }) => [
                styles.headerActionContainer,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <View style={styles.iconCircle}>
                <Octicons name="plus" size={18} color={Colors.dark.primary} />
              </View>
              <View>
                <ThemedText style={styles.headerActionTitle}>
                  Add New Manga
                </ThemedText>
                <ThemedText style={styles.headerActionSub}>
                  Expand your library collection
                </ThemedText>
              </View>
            </Pressable>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push(`/${search ? "search" : "home"}/template/${item.id}`)
          }
        >
          <View style={styles.cardWrapper}>
            <Card
              {...item}
              isAdult={item.isAdult}
              search={search}
              isFavorite={item.isFavorite}
              isPlanToRead={item.isPlanToRead}
              isDownloading={syncingIds.includes(item.id)}
            />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 100, alignItems: "center" },
  columnWrapper: { justifyContent: "center", gap: 15 },
  cardWrapper: { paddingVertical: 10, alignItems: "center" },
  headerWrapper: {
    width: width,
    alignItems: "center",
    paddingVertical: 15,
  },
  headerActionContainer: {
    width: width - 40,
    backgroundColor: "#111",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#222",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 15,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  headerActionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  headerActionSub: {
    fontSize: 12,
    color: "#555",
    marginTop: 1,
  },
});
