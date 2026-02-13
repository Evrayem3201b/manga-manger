import { Colors } from "@/constants/theme";
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import { getBadgeColor as BadgeData } from "@/utils/BadgeData";
import { getStatusFromName } from "@/utils/getStatus";
import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  // --- STATE ---
  const {
    result: apiData,
    isLoading: apiLoading,
    genres: apiGenres,
  } = useMangaDetails(id);
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Local Data State (Merged from API or DB)
  const [data, setData] = useState<any>(null);
  const [genres, setGenres] = useState<any[] | null>(null);
  const [query, setQuery] = useState("0");
  const [readingLink, setReadingLink] = useState("");

  // UI States
  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlanToRead, setIsPlanToRead] = useState(false);

  // --- 1. INITIAL LOAD: Check Library vs API ---
  useEffect(() => {
    async function loadManga() {
      try {
        setIsInLibrary(false);
        setData(apiData);
        setGenres(apiGenres);
        setQuery(String(apiData?.currentChap || "0"));
      } catch (e) {
        console.error("Load Error", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadManga();
  }, [id, apiData, apiGenres, db]);

  // --- 2. ACTIONS: LIBRARY MANAGEMENT ---
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
    if (!data || isAdding) return;
    setIsAdding(true);
    try {
      const localUri = await handleImageDownload(data.coverUrl?.uri);
      if (!localUri) throw new Error("Image download failed");

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT OR REPLACE INTO manga (id, name, description, cover_url, cover_online_link, status, year, rating, total_chap, current_chap, is_adult, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            data.name,
            data.description,
            localUri,
            data.coverUrl?.uri,
            data.status,
            data.year,
            data.rating,
            data.totalChap,
            parseInt(query),
            data.isAdult ? 1 : 0,
            Date.now(),
            Date.now(),
          ],
        );
        if (genres) {
          for (const g of genres) {
            await db.runAsync(
              "INSERT OR REPLACE INTO manga_genres (manga_id, genre) VALUES (?, ?)",
              [id, g.attributes.name.en],
            );
          }
        }
      });
      setIsInLibrary(true);
      Alert.alert("Success", "Added to Library");
    } catch (e) {
      Alert.alert("Error", "Failed to add.");
    } finally {
      setIsAdding(false);
    }
  }

  async function saveProgress() {
    try {
      await db.runAsync(
        "UPDATE manga SET current_chap = ?, reading_link = ?, updated_at = ? WHERE id = ?",
        [parseInt(query) || 0, readingLink, Date.now(), id],
      );
      Alert.alert("Success", "Progress saved!");
    } catch (e) {
      Alert.alert("Error", "Save failed");
    }
  }

  async function deleteManga() {
    try {
      await db.runAsync("DELETE FROM manga WHERE id = ?", [id]);
      router.replace("/(tabs)/homeNew");
    } catch (e) {
      Alert.alert("Error", "Delete failed");
    }
  }

  const toggleFavorite = async () => {
    const next = !isFavorite;
    setIsFavorite(next);
    if (next)
      await db.runAsync(
        "INSERT OR REPLACE INTO favorites (manga_id, added_at) VALUES (?, ?)",
        [id, Date.now()],
      );
    else await db.runAsync("DELETE FROM favorites WHERE manga_id = ?", [id]);
  };

  const togglePlanToRead = async () => {
    const next = !isPlanToRead;
    setIsPlanToRead(next);
    if (next)
      await db.runAsync(
        "INSERT OR REPLACE INTO plan_to_read (manga_id, added_at) VALUES (?, ?)",
        [id, Date.now()],
      );
    else await db.runAsync("DELETE FROM plan_to_read WHERE manga_id = ?", [id]);
  };

  // --- RENDER HELPERS ---
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

        {/* Floating Actions (Only if in Library) */}
        {isInLibrary && (
          <View style={styles.floatingActionColumn}>
            <Pressable
              style={[
                styles.floatingActionBtn,
                {
                  backgroundColor: BadgeData("favorites")?.badgeBackgroundColor,
                },
              ]}
              onPress={toggleFavorite}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite ? "#ff4444" : "#fff"}
              />
            </Pressable>
            <Pressable
              style={[
                styles.floatingActionBtn,
                {
                  backgroundColor:
                    BadgeData("plan-to-read")?.badgeBackgroundColor,
                },
              ]}
              onPress={togglePlanToRead}
            >
              <Ionicons
                name={isPlanToRead ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isPlanToRead ? Colors.dark.primary : "#fff"}
              />
            </Pressable>
          </View>
        )}

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

      {/* Genres */}
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
          style={({ pressed }) => [
            styles.premiumSourceBtn,
            { opacity: pressed ? 0.7 : 1 },
          ]}
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

      {/* Description */}
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

      {/* Stepper Section */}
      <View style={styles.stepperSection}>
        <ThemedText style={styles.sectionTitle}>Current Progress</ThemedText>
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

      {/* Conditional Footer Actions */}
      {isInLibrary ? (
        <View style={{ width: "90%" }}>
          <ThemedText style={[styles.sectionTitle, { marginTop: 40 }]}>
            Reading Source
          </ThemedText>
          <View style={styles.linkLargeButton}>
            <Ionicons name="link" size={20} color={Colors.dark.primary} />
            <TextInput
              placeholder="Paste link..."
              placeholderTextColor="#444"
              style={styles.linkText}
              value={readingLink}
              onChangeText={setReadingLink}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() =>
                Linking.openURL(readingLink).catch(() =>
                  Alert.alert("Error", "Invalid link"),
                )
              }
            >
              <Ionicons
                name="open-outline"
                size={22}
                color={Colors.dark.primary}
              />
            </Pressable>
          </View>
          <View style={styles.buttonRow}>
            <Button style={styles.saveButton} onPress={saveProgress}>
              Save Progress
            </Button>
            <Button
              style={styles.deleteButton}
              onPress={() =>
                Alert.alert("Delete", "Remove?", [
                  { text: "No" },
                  {
                    text: "Delete",
                    onPress: deleteManga,
                    style: "destructive",
                  },
                ])
              }
            >
              <Octicons name="trash" size={24} color="#ff4444" />
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.actionContainer}>
          <Button
            style={styles.primaryBtn}
            onPress={addToLibrary}
            disabled={isAdding}
          >
            {isAdding ? <ActivityIndicator color="#fff" /> : "Add to Library"}
          </Button>
        </View>
      )}
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
  linkLargeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "#222",
  },
  linkText: { flex: 1, color: "#fff", fontSize: 14 },

  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.dark.primary,
  },
  deleteButton: {
    width: 60,
    height: 50,
    borderRadius: 15,
    backgroundColor: "rgba(255,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionContainer: { width: "90%", gap: 10, marginTop: 20, paddingBottom: 40 },
  outlineBtn: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  outlineBtnText: {
    color: Colors.dark.primary,
    marginLeft: 8,
    fontWeight: "700",
  },
  primaryBtn: {
    height: 50,
    borderRadius: 15,
    backgroundColor: Colors.dark.primary,
  },
  floatingActionColumn: {
    position: "absolute",
    right: -15,
    top: 10,
    zIndex: 10,
    gap: 10,
  },
  floatingActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
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
    backgroundColor: "rgba(255,255,255,0.03)", // Subtle depth
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
    backgroundColor: "rgba(255,255,255,0.02)", // Very slight contrast for the text box
    padding: 15,
    borderRadius: 20,
  },
  // Update your existing sectionTitle for better hierarchy
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 20,
    textAlign: "center",
  },
  // Clean up the bottom button row so it's strictly for local actions
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    gap: 12,
    marginTop: 30,
    marginBottom: 50,
  },
});
