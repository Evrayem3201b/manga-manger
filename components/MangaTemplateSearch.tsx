import { Colors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext"; // Import Alert Hook
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import { getStatusFromName } from "@/utils/getStatus";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import Badge from "./badge";
import ScreenHug from "./ScreenHug";
import Tag from "./tag";
import { ThemedText } from "./themed-text";
import { Button } from "./ui/button";

const INITIAL_VISIBLE_TAGS = 5;

export default function MangaTemplate({ id }: { id: string }) {
  const db = useSQLiteContext();
  const router = useRouter();
  const { showAlert } = useAlert(); // Initialize Alert

  const {
    result: apiData,
    isLoading: apiLoading,
    genres: apiGenres,
  } = useMangaDetails(id);

  const [isAdding, setIsAdding] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const [data, setData] = useState<any>(null);
  const [genres, setGenres] = useState<any[] | null>(null);
  const [query, setQuery] = useState("0");

  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);

  useEffect(() => {
    async function checkStatus() {
      try {
        const localCheck = await db.getFirstAsync<{ id: string }>(
          "SELECT id FROM manga WHERE id = ?",
          [id],
        );
        setIsInLibrary(!!localCheck);

        const blockCheck = await db.getFirstAsync<{ manga_id: string }>(
          "SELECT manga_id FROM blocked_manga WHERE manga_id = ?",
          [id],
        );
        setIsBlocked(!!blockCheck);

        if (apiData) {
          setData(apiData);
          setGenres(apiGenres);
          setQuery(String(apiData?.currentChap || "0"));
        }
      } catch (e) {
        console.error("Load Error", e);
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, [id, apiData, apiGenres, db]);

  async function handleImageDownload(coverUri: string) {
    try {
      const coversDir = new FileSystem.Directory(
        FileSystem.Paths.document,
        "covers",
      );
      if (!coversDir.exists) await coversDir.create();
      const dest = new FileSystem.File(coversDir, `${id}.jpg`);
      const output = await FileSystem.File.downloadFileAsync(coverUri, dest, {
        idempotent: true,
      });
      return output.uri;
    } catch (e) {
      return null;
    }
  }
  async function addToLibrary() {
    if (!data || isAdding || isInLibrary) return;
    setIsAdding(true);
    try {
      const localUri = await handleImageDownload(data.coverUrl?.uri);

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT OR REPLACE INTO manga (id, name, description, cover_url, cover_online_link, status, year, rating, total_chap, current_chap, is_adult, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.name ?? "Unknown",
            data.description ?? "",
            localUri ?? data.coverUrl?.uri ?? "",
            data.coverUrl?.uri ?? "",
            data.status ?? "ongoing",
            data.year ?? null,
            data.rating ?? null,
            data.totalChap ?? 0,
            parseInt(query) || 0,
            data.isAdult ? 1 : 0,
            Date.now(),
            Date.now(),
          ],
        );
      });
      setIsInLibrary(true);
      showAlert({
        title: "Success",
        message: "Added to your library.",
        type: "success",
      });
    } catch (e) {
      showAlert({
        title: "Error",
        message: "Failed to add manga to library.",
        type: "danger",
      });
    } finally {
      setIsAdding(false);
    }
  }

  const toggleBlock = async () => {
    if (isBlocking || !data) return;

    if (!isBlocked) {
      showAlert({
        title: "Block Manga?",
        message:
          "This will hide this title from search results and remove it from your library.",
        type: "danger",
        confirmText: "Block",
        onConfirm: async () => {
          setIsBlocking(true);
          try {
            await db.runAsync(
              "INSERT INTO blocked_manga (manga_id, name, manga_image) VALUES (?, ?, ?)",
              [
                id,
                data.name ?? "Unknown",
                data.coverOnlineLink ?? data.coverUrl?.uri ?? "",
              ],
            );
            // Also clean up from library if it was there
            await db.runAsync("DELETE FROM manga WHERE id = ?", [id]);
            setIsBlocked(true);
            router.back();
          } catch (e) {
            showAlert({
              title: "Error",
              message: "Failed to block manga.",
              type: "danger",
            });
          } finally {
            setIsBlocking(false);
          }
        },
      });
    } else {
      setIsBlocking(true);
      try {
        await db.runAsync("DELETE FROM blocked_manga WHERE manga_id = ?", [id]);
        setIsBlocked(false);
        showAlert({
          title: "Unblocked",
          message: "Manga is now visible again.",
          type: "info",
        });
      } catch (e) {
        console.error(e);
      } finally {
        setIsBlocking(false);
      }
    }
  };

  if (isLoading || apiLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  const visibleGenres = expanded
    ? genres
    : genres?.slice(0, INITIAL_VISIBLE_TAGS);
  const hiddenCount = Math.max(0, (genres?.length || 0) - INITIAL_VISIBLE_TAGS);

  return (
    <ScreenHug title="" style={{ paddingTop: 30, alignItems: "center" }} scroll>
      <View style={{ position: "relative" }}>
        <Badge status={getStatusFromName(data?.status || "ongoing")} />
        <View style={styles.mangaImageWrapper}>
          <Image source={data?.coverUrl} style={styles.mangaImage} />
          <LinearGradient
            colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0)"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>

      <Text style={styles.mangaTitle} selectable>
        {data?.name}
      </Text>

      <View style={styles.genreContainer}>
        {visibleGenres?.map((tag: any, i: number) => (
          <Tag title={tag.attributes.name.en} key={i} />
        ))}
        {hiddenCount > 0 && (
          <Pressable onPress={() => setExpanded(!expanded)}>
            <View style={styles.moreTag}>
              <Text style={styles.moreTagText}>
                {expanded ? "Show less" : `+${hiddenCount} more`}
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <View style={styles.sourceContainer}>
        <Pressable
          onPress={() => Linking.openURL(`https://mangadex.org/title/${id}`)}
          style={styles.premiumSourceBtn}
        >
          <MaterialCommunityIcons
            name="integrated-circuit-chip"
            size={16}
            color={Colors.dark.primary}
          />
          <Text style={styles.premiumSourceText}>View on MANGADEX</Text>
          <Ionicons name="chevron-forward" size={14} color="#555" />
        </Pressable>
      </View>

      <View style={styles.descriptionWrapper}>
        <View
          style={{
            maxHeight: expandedText ? undefined : 60,
            overflow: "hidden",
          }}
        >
          <Markdown style={styles.markdown}>
            {data?.description || "No description."}
          </Markdown>
        </View>
        <Pressable
          onPress={() => setExpandedText(!expandedText)}
          style={{ paddingVertical: 8 }}
        >
          <ThemedText style={styles.showMoreText}>
            {expandedText ? "SHOW LESS ↑" : "SHOW MORE ↓"}
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.stepperSection}>
        <ThemedText style={styles.sectionTitle}>Initial Progress</ThemedText>
        <View style={styles.largeStepperRow}>
          <Pressable
            style={styles.circleStepBtn}
            onPress={() => setQuery(String(Math.max(0, parseInt(query) - 1)))}
          >
            <Ionicons name="remove" size={28} color="#fff" />
          </Pressable>
          <View style={styles.hugeNumberContainer}>
            <TextInput
              keyboardType="numeric"
              style={styles.hugeNumberInput}
              value={query}
              onChangeText={setQuery}
              selectTextOnFocus
            />
            <Text style={styles.totalLabel}>OF {data?.totalChap || "?"}</Text>
          </View>
          <Pressable
            style={styles.circleStepBtn}
            onPress={() => setQuery(String(parseInt(query) + 1))}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Button
          style={[styles.primaryBtn, isInLibrary ? styles.disabledBtn : {}]}
          onPress={addToLibrary}
          disabled={isAdding || isInLibrary}
        >
          {isAdding ? (
            <ActivityIndicator color="#fff" />
          ) : isInLibrary ? (
            <View style={styles.row}>
              <Ionicons
                name="checkmark"
                size={18}
                color="rgba(255,255,255,0.4)"
              />
              <Text style={styles.disabledBtnText}>In Library</Text>
            </View>
          ) : (
            "Add to Library"
          )}
        </Button>

        <Pressable
          style={[styles.blockBtn, isBlocked && styles.blockBtnActive]}
          onPress={toggleBlock}
        >
          {isBlocking ? (
            <ActivityIndicator size="small" color="#ff4444" />
          ) : (
            <Ionicons
              name={isBlocked ? "eye-off" : "ban"}
              size={22}
              color={isBlocked ? Colors.dark.primary : "#ff4444"}
            />
          )}
        </Pressable>
      </View>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  mangaImageWrapper: {
    width: 250,
    height: 350,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#1a1a1e",
  },
  mangaImage: { width: "100%", height: "100%", borderRadius: 25 },
  mangaTitle: {
    marginTop: 20,
    fontSize: 32,
    height: "auto",
    textAlign: "center",
    fontFamily: "ni",
    color: "#fff",
  },
  genreContainer: {
    flexWrap: "wrap",
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
    width: "80%",
    justifyContent: "center",
  },
  moreTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  moreTagText: { color: "#fff", fontSize: 12 },
  showMoreText: { color: Colors.dark.primary, fontWeight: "700", fontSize: 12 },
  stepperSection: { marginTop: 30, width: "90%", alignItems: "center" },
  largeStepperRow: { flexDirection: "row", alignItems: "center", gap: 30 },
  circleStepBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a1a1e",
    justifyContent: "center",
    alignItems: "center",
  },
  hugeNumberInput: {
    fontSize: 40,
    color: "#fff",
    textAlign: "center",
    fontFamily: "ni",
  },
  totalLabel: {
    fontSize: 10,
    color: Colors.dark.primary,
    fontWeight: "700",
    marginTop: -5,
  },
  hugeNumberContainer: { alignItems: "center", minWidth: 80 },

  // ACTION AREA
  actionRow: {
    flexDirection: "row",
    width: "92%",
    gap: 12,
    marginTop: 30,
    paddingBottom: 60, // Increased to ensure it's above the bottom of the screen
  },
  primaryBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.dark.primary,
  },
  disabledBtn: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  disabledBtnText: {
    color: "rgba(255,255,255,0.4)",
    fontWeight: "700",
    marginLeft: 6,
  },
  blockBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 68, 68, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.2)",
  },
  blockBtnActive: {
    backgroundColor: "#111",
    borderColor: Colors.dark.primary,
  },
  row: { flexDirection: "row", alignItems: "center" },
  markdown: { body: { color: "#aaa", fontSize: 14, lineHeight: 20 } } as any,
  sourceContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 25,
    marginBottom: 5,
  },
  premiumSourceBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 8,
  },
  premiumSourceText: {
    color: "#888",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  descriptionWrapper: {
    marginTop: 15,
    width: "90%",
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 15,
    borderRadius: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 20,
    textAlign: "center",
  },
});
