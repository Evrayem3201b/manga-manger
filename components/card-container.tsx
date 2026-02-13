import { Colors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext"; // Added
import { SimpleDisplay } from "@/utils/types";
import { Octicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useRef, useState } from "react";
import {
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
  const { showAlert } = useAlert(); // Added

  const [localManga, setLocalManga] = useState(mangaSimple);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const isSyncingRef = useRef(false);
  const hasAttemptedSync = useRef(false);

  useEffect(() => {
    if (search || mangaSimple.length === 0 || hasAttemptedSync.current) return;

    async function runSyncFlow() {
      hasAttemptedSync.current = true;

      try {
        const flag = await db.getFirstAsync<{ value: string }>(
          `SELECT value FROM app_meta WHERE prop = 'needs_cover_sync'`,
        );

        await performSync();

        if (flag?.value === "1") {
          await db.runAsync(
            `UPDATE app_meta SET value = '0' WHERE prop = 'needs_cover_sync'`,
          );
          // Replaced native Alert with custom showAlert (Info style)
          showAlert({
            title: "Library restored",
            message: "Covers synced successfully",
            type: "success",
          });
        }
      } catch (e) {
        // Replaced native Alert
        showAlert({
          title: "Sync Flow Error",
          message: `${e}`,
          type: "danger",
        });
      }
    }

    runSyncFlow();
  }, [mangaSimple, db]);

  useEffect(() => {
    setLocalManga(mangaSimple);
  }, [mangaSimple]);

  const downloadItem = async (item: any, coversDir: FileSystem.Directory) => {
    if (!item.coverOnlineLink) return false;

    try {
      setSyncingIds((prev) => [...prev, item.id]);

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
      const coversDir = new FileSystem.Directory(
        FileSystem.Paths.document,
        "covers",
      );

      if (!coversDir.exists) {
        await coversDir.create();
      }

      for (const item of mangaSimple) {
        let needsDownload = false;

        const localFile = new FileSystem.File(coversDir, `${item.id}.jpg`);

        if (!item.coverUrl?.uri || !localFile.exists) {
          needsDownload = true;
        }

        if (needsDownload && item.coverOnlineLink) {
          const success = await downloadItem(item, coversDir);
          if (!success) failedItems.push(item);
        }
      }

      if (failedItems.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        for (const item of failedItems) {
          await downloadItem(item, coversDir);
        }
      }
    } catch (err) {
      // Replaced native Alert
      showAlert({
        title: "Sync process error",
        message: `${err}`,
        type: "danger",
      });
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
