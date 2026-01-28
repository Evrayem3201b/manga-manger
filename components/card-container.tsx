import { useFilterStore } from "@/stores/category-store";
import { SimpleDisplay } from "@/utils/types";
import * as FileSystem from "expo-file-system";
import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const filterKeyword = useFilterStore((state) => state.filter);
  const [favIds, setFavIds] = useState<string[]>([]);
  const [planIds, setPlanIds] = useState<string[]>([]);

  const [localManga, setLocalManga] = useState(mangaSimple);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);
  const isSyncingRef = useRef(false);

  useEffect(() => {
    setLocalManga(mangaSimple);
    performSync();
  }, [mangaSimple]);

  const downloadItem = async (item: any, coversDir: FileSystem.Directory) => {
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
      return true; // Success
    } catch (e) {
      console.error(`Download failed for ${item.name}:`, e);
      return false; // Failed
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
      if (!coversDir.exists) await coversDir.create();

      // --- FIRST PASS ---
      for (const item of mangaSimple) {
        const isRemote = item.coverUrl?.uri?.startsWith("http");
        const hasPath = !!item.coverUrl?.uri;
        let needsDownload = false;

        if (isRemote || !hasPath) {
          needsDownload = true;
        } else {
          const file = new FileSystem.File(coversDir, `${item.id}.jpg`);
          if (!file.exists) {
            await db.runAsync(
              `UPDATE manga SET cover_url = NULL WHERE id = ?`,
              [item.id],
            );
            needsDownload = true;
          }
        }

        if (needsDownload && item.coverOnlineLink) {
          const success = await downloadItem(item, coversDir);
          if (!success) failedItems.push(item);
        }
      }

      // --- RETRY PASS (If there are failed items) ---
      if (failedItems.length > 0) {
        console.log(`Retrying ${failedItems.length} failed downloads...`);
        // Optional: Wait 2 seconds before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));

        for (const item of failedItems) {
          await downloadItem(item, coversDir);
        }
      }
    } finally {
      isSyncingRef.current = false;
    }
  };

  useEffect(() => {
    async function fetchLibrary() {
      const favs = await db.getAllAsync<{ manga_id: string }>(
        "SELECT manga_id FROM favorites",
      );
      const plan = await db.getAllAsync<{ manga_id: string }>(
        "SELECT manga_id FROM plan_to_read",
      );
      setFavIds(favs.map((f) => f.manga_id));
      setPlanIds(plan.map((p) => p.manga_id));
    }
    fetchLibrary();
  }, [filterKeyword, db]);

  const filteredManga = useMemo(() => {
    return localManga.filter((item) => {
      if (filterKeyword === "all") return true;
      if (filterKeyword === "favorites") return favIds.includes(item.id);
      if (filterKeyword === "plan-to-read") return planIds.includes(item.id);
      return item.status === filterKeyword;
    });
  }, [localManga, filterKeyword, favIds, planIds]);

  return (
    <FlatList
      data={filteredManga}
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
