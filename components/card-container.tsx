import { SimpleDisplay } from "@/utils/types";
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

  useEffect(() => {
    setLocalManga(mangaSimple);

    // Check if ANY item needs a download before starting the process
    // This prevents the loop from running FileSystem checks on healthy data
    const hasStaleData = mangaSimple.some(
      (m) => !m.coverUrl?.uri || m.coverUrl.uri.startsWith("http"),
    );

    if (hasStaleData) {
      performSync(mangaSimple);
    }
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
      console.error(`Download failed for ${item.name}:`, e);
      return false;
    } finally {
      setSyncingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  const performSync = async (itemsToProcess: typeof mangaSimple) => {
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

      for (const item of itemsToProcess) {
        const currentUri = item.coverUrl?.uri;

        // ONLY check the file system if the URI is missing or is an online link
        // If the URI is already a local 'file://' path, we assume it's fine.
        const isRemote = !currentUri || currentUri.startsWith("http");

        if (isRemote) {
          const file = new FileSystem.File(coversDir, `${item.id}.512.jpg.jpg`);

          if (!file.exists) {
            const success = await downloadItem(item, coversDir);
            if (!success) failedItems.push(item);
          } else {
            // File exists but DB path was wrong/remote (Imported DB case)
            await db.runAsync(`UPDATE manga SET cover_url = ? WHERE id = ?`, [
              file.uri,
              item.id,
            ]);
            setLocalManga((prev) =>
              prev.map((m) =>
                m.id === item.id ? { ...m, coverUrl: { uri: file.uri } } : m,
              ),
            );
          }
        }
      }

      // Retry failed ones once
      if (failedItems.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        for (const item of failedItems) {
          await downloadItem(item, coversDir);
        }
      }
    } catch (err) {
      console.error("Sync process failed:", err);
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
});
