import { Colors } from "@/constants/theme";
import { getBadgeColor as BadgeData } from "@/utils/BadgeData";
import { getStatusFromName } from "@/utils/getStatus";
import { MangaDB, SimpleDisplay, Tag as TagType } from "@/utils/types";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [genres, setGenres] = useState<TagType[] | null>(null);
  const [data, setData] = useState<
    | (SimpleDisplay & {
        description: string;
        year: number | null;
        rating: string | null;
        isAdult?: number | boolean | null;
      })
    | null
  >(null);

  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [query, setQuery] = useState(String(data?.currentChap || ""));
  const [readingLink, setReadingLink] = useState(data?.readingLink || "");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlanToRead, setIsPlanToRead] = useState(false);
  const [downloadedImageUri, setDownloadedImageUri] = useState<string | null>(
    null,
  );
  const [isPinned, setIsPinned] = useState(false);
  const [inQueue, setInQueue] = useState(false);

  const db = useSQLiteContext();
  const router = useRouter();

  useEffect(() => {
    async function fetchManga() {
      try {
        // 1. Get Manga Details
        const mangaRecord: MangaDB = await db.getFirstAsync<any>(
          "SELECT * FROM manga WHERE id = ?",
          [id],
        );
        // console.log("Manga Record:", mangaRecord);
        // 2. Get Genres
        const genresRecords = await db.getAllAsync<any>(
          "SELECT * FROM manga_genres WHERE manga_id = ?",
          [id],
        );
        const favouriteRecord = await db.getFirstAsync<any>(
          "SELECT * FROM favorites WHERE manga_id = ?",
          [id],
        );
        const planToReadRecord = await db.getFirstAsync<any>(
          "SELECT * FROM plan_to_read WHERE manga_id = ?",
          [id],
        );

        setIsFavorite(!!favouriteRecord);
        setIsPlanToRead(!!planToReadRecord);

        if (mangaRecord) {
          setIsPinned(mangaRecord.is_pinned === 1);
          setInQueue((mangaRecord.queue_order ?? 0) > 0);
          setData({
            name: mangaRecord.name,
            id: mangaRecord.id,
            coverUrl: { uri: mangaRecord.cover_url },
            totalChap: mangaRecord.total_chap,
            status: mangaRecord.status,
            description: mangaRecord.description,
            year: mangaRecord.year,
            rating: String(mangaRecord.rating),
            currentChap: mangaRecord.current_chap,
            readingLink: mangaRecord.reading_link,
            isAdult: mangaRecord.is_adult === 1 ? true : false,
            coverOnlineLink: mangaRecord.cover_online_link,
          });

          setQuery(String(mangaRecord.current_chap || "0"));

          // Map database genres to match the API structure used in the Tag loop
          setGenres(genresRecords);
          setReadingLink(mangaRecord.reading_link || "");
          // console.log("Genres Records:", genresRecords);
          // console.log(
          //   "Manga details loaded successfully. " +
          //     favouriteRecord +
          //     " " +
          //     planToReadRecord,
          // );
        }
      } catch (error) {
        // Alert.alert("Error loading manga from DB:", error);
        Alert.alert("Error", "Failed to load manga details.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchManga();
  }, [id]);

  // useEffect(() => {
  //   async function handleImageDownload() {
  //     console.log(
  //       await db.getFirstAsync(`SELECT * FROM manga WHERE id = ?`, [id]),
  //     );
  //   }
  //   handleImageDownload();
  // }, []);

  if (isLoading) {
    return <ActivityIndicator size="large" color={Colors.dark.text} />;
  }

  const visibleGenres = expanded
    ? genres
    : genres?.slice(0, INITIAL_VISIBLE_TAGS);

  const hiddenCount =
    genres && genres.length > INITIAL_VISIBLE_TAGS
      ? genres.length - INITIAL_VISIBLE_TAGS
      : 0;

  async function saveProgress() {
    if (!data) return;

    try {
      const newChap = parseInt(query) || 0;
      await db.runAsync(
        `
      UPDATE manga
      SET
        current_chap = ?,
        updated_at = ?,
        reading_link = ?
      WHERE id = ?
      `,
        [newChap, Date.now(), readingLink, id],
      );
      Alert.alert("Success", "Progress saved!");
    } catch (e) {
      // Alert.alert(e);
      Alert.alert("Error", `Failed to save progress: ${e}`);
    }
  }

  if (isLoading) {
    return (
      <ActivityIndicator
        size="large"
        color={Colors.dark.text}
        style={{ marginTop: 50 }}
      />
    );
  }

  async function deleteManga() {
    try {
      await db.runAsync(`DELETE FROM manga WHERE id = ?`, [id]);
      // Alert.alert("Deleted", "Manga removed from your library.");
      // Optionally, navigate back or refresh the list
      router.replace("/(tabs)/homeNew");
    } catch (e) {
      Alert.alert("Error", "Failed to delete manga.");
    }
  }

  const handleLinkOpen = async () => {
    // Check if the device can open the URL (optional but good practice)
    const supported = await Linking.canOpenURL(readingLink);

    if (supported) {
      // Open the URL in the device's default browser
      await Linking.openURL(readingLink);
    } else {
      Alert.alert(`Don't know how to open this URL: ${readingLink}`);
    }
  };

  const toggleFavorite = async () => {
    const newValue = !isFavorite;
    setIsFavorite(newValue); // Update UI immediately

    try {
      if (newValue) {
        await db.runAsync(
          "INSERT OR REPLACE INTO favorites (manga_id, added_at) VALUES (?, ?)",
          [id, Date.now()],
        );
      } else {
        await db.runAsync("DELETE FROM favorites WHERE manga_id = ?", [id]);
      }
    } catch (e) {
      // Alert.alert("Failed to update favorites"+ e);
      Alert.alert("Error", "Failed to update favorites.");
      // Rollback UI if DB fails
      setIsFavorite(!newValue);
    }
  };

  const togglePlanToRead = async () => {
    const newValue = !isPlanToRead;
    setIsPlanToRead(newValue); // Update UI immediately

    try {
      if (newValue) {
        await db.runAsync(
          "INSERT OR REPLACE INTO plan_to_read (manga_id, added_at) VALUES (?, ?)",
          [id, Date.now()],
        );
      } else {
        await db.runAsync("DELETE FROM plan_to_read WHERE manga_id = ?", [id]);
      }
    } catch (e) {
      // Alert.alert("Failed to update plan to read"+ e);
      Alert.alert("Error", "Failed to update plan to read list.");
      // Rollback UI if DB fails
      setIsPlanToRead(!newValue);
    }
  };

  const toggleQueue = async () => {
    try {
      if (inQueue) {
        await db.runAsync("UPDATE manga SET queue_order = 0 WHERE id = ?", [
          id,
        ]);
        setInQueue(false);
      } else {
        const maxOrder: any = await db.getFirstAsync(
          "SELECT MAX(queue_order) as maxO FROM manga",
        );
        const nextOrder = (maxOrder?.maxO || 0) + 1;
        await db.runAsync("UPDATE manga SET queue_order = ? WHERE id = ?", [
          nextOrder,
          id,
        ]);
        setInQueue(true);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to update queue.");
    }
  };
  const togglePin = async () => {
    try {
      const pinnedCount: any = await db.getFirstAsync(
        "SELECT COUNT(*) as count FROM manga WHERE is_pinned = 1",
      );
      if (!isPinned && pinnedCount.count >= 5) {
        Alert.alert("Limit Reached", "You can only pin up to 5 manga.");
        return;
      }
      const newValue = !isPinned;
      await db.runAsync("UPDATE manga SET is_pinned = ? WHERE id = ?", [
        newValue ? 1 : 0,
        id,
      ]);
      setIsPinned(newValue);
    } catch (e) {
      Alert.alert("Error", "Failed to update pin.");
    }
  };

  return (
    <ScreenHug
      title={""}
      style={{
        paddingTop: 30,
        alignItems: "center",
        marginTop: -10,
      }}
      scroll={true}
    >
      <View style={{ position: "relative" }}>
        <Badge status={getStatusFromName(data?.status || "ongoing")} />
        {/* REPLACED: NEW CONTROL HUB */}
        <View style={styles.floatingActionColumn}>
          <Pressable
            style={[
              styles.floatingActionBtn,
              {
                backgroundColor: `${BadgeData("favorites")?.badgeBackgroundColor}`,
              },
            ]}
            onPress={() => toggleFavorite()}
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
                backgroundColor: `${BadgeData("plan-to-read")?.badgeBackgroundColor}`,
              },
            ]}
            onPress={() => togglePlanToRead()}
          >
            <Ionicons
              name={isPlanToRead ? "bookmark" : "bookmark-outline"}
              size={22}
              color={isPlanToRead ? Colors.dark.primary : "#fff"}
            />
          </Pressable>
        </View>

        <View style={styles.mangaImageWrapper}>
          {data?.coverUrl?.uri || downloadedImageUri ? (
            <Image
              source={
                data?.coverUrl?.uri
                  ? data.coverUrl
                  : { uri: downloadedImageUri! }
              }
              style={styles.mangaImage}
            />
          ) : (
            /* --- BEAUTIFUL PLACEHOLDER --- */
            <View style={[styles.mangaImage, styles.placeholderContainer]}>
              <LinearGradient
                colors={["#232526", "#414345"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.placeholderContent}>
                <Ionicons
                  name="book-outline"
                  size={60}
                  color="rgba(255,255,255,0.15)"
                />
                <Text style={styles.placeholderText} numberOfLines={3}>
                  {data?.name || "Manga Title"}
                </Text>
              </View>
              <View style={styles.placeholderEdge} />
            </View>
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.75)", "rgba(0,0,0,0.0)"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0.8 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>
      </View>

      <Text
        style={{
          marginTop: 20,
          fontSize: 40,
          textAlign: "center",
          fontFamily: "ni",
          color: Colors.dark.text,
        }}
        selectable
      >
        {data?.name}
      </Text>

      <View
        style={{
          flexWrap: "wrap",
          flexDirection: "row",
          gap: 6,
          marginTop: 20,
          width: "80%",
          justifyContent: "center",
        }}
      >
        {visibleGenres?.map((tag: any, index: number) => {
          const genre = tag.genre;
          return <Tag title={genre} key={index} />;
        })}

        {/* 🔥 SHOW MORE / LESS BUTTON */}
        {!expanded && hiddenCount > 0 && (
          <Pressable onPress={() => setExpanded(true)}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text
                style={{
                  color: Colors.dark.text,
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                +{hiddenCount} more
              </Text>
            </View>
          </Pressable>
        )}

        {expanded && (
          <Pressable onPress={() => setExpanded(false)}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text
                style={{
                  color: Colors.dark.text,
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                Show less
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 20, width: "90%" }}>
        <View
          style={{
            maxHeight: expandedText ? undefined : 60,
            overflow: "hidden",
          }}
        >
          <Markdown
            style={styles.markdown}
            onLinkPress={(url) => {
              // We handle the promise internally using .catch
              Linking.openURL(url).catch((err) =>
                Alert.alert("Error", "Could not open link"),
              );

              // Return true to indicate the link was handled,
              // or false to let the default handler run.
              // Most users prefer returning false here.
              return false;
            }}
          >
            {data?.description || "No description available."}
          </Markdown>
        </View>

        <Pressable
          onPress={() => setExpandedText(!expandedText)}
          style={{ paddingVertical: 8 }}
        >
          <ThemedText style={{ color: Colors.dark.primary, fontWeight: "700" }}>
            {expandedText ? "SHOW LESS ↑" : "SHOW MORE ↓"}
          </ThemedText>
        </Pressable>
      </View>
      {/* --- CHAPTER SECTION --- */}
      <View style={{ marginTop: 40, width: "90%", alignItems: "center" }}>
        <ThemedText style={styles.sectionTitle}>Current Progress</ThemedText>

        <View style={styles.largeStepperRow}>
          <Pressable
            style={styles.circleStepBtn}
            onPress={() =>
              setQuery(String(Math.max(0, parseInt(query || "0") - 1)))
            }
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
            onPress={() => setQuery(String(parseInt(query || "0") + 1))}
          >
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* --- READING LINK SECTION --- */}
      <ThemedText style={[styles.sectionTitle, { marginTop: 50 }]}>
        Reading Source
      </ThemedText>
      <View style={styles.linkLargeButton}>
        {/* Left Icon - Static */}

        <Ionicons name="link" size={20} color={Colors.dark.primary} />

        {/* Middle - Editable Text Area */}
        <TextInput
          placeholder="Paste reading link..."
          placeholderTextColor="#444"
          style={styles.linkText}
          value={readingLink}
          onChangeText={setReadingLink}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Right Icon - The Action Button */}
        <Pressable
          onPress={handleLinkOpen}
          style={({ pressed }) => [
            styles.openIconWrapper,
            { opacity: pressed ? 0.5 : 1 },
          ]}
        >
          <Ionicons name="open-outline" size={22} color={Colors.dark.primary} />
        </Pressable>
      </View>
      {/* Button Container */}

      <View style={styles.buttonRow}>
        <Button
          style={styles.saveButton}
          textStyle={styles.saveButtonText}
          onPress={() => saveProgress()}
        >
          Save Progress
        </Button>

        <Button
          style={styles.deleteButton}
          onPress={() =>
            Alert.alert("Delete", "Remove from library?", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: deleteManga },
            ])
          }
        >
          <Octicons name="trash" size={24} color="rgba(255, 68, 68, 0.85)" />
        </Button>
      </View>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
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
  readingLinkContainer: {
    width: "100%", // Increased from 80% to give the text more room
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 6, // Slightly less padding on the right to tuck the button in
  },
  input: {
    flex: 1, // 🚀 This pushes the button to the right
    fontSize: 14,
    color: "#f5f5f7",
    marginRight: 8,
  },
  readNowButton: {
    height: 34, // Sized to fit inside the 46px searchBox
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    minWidth: 90,
  },
  readNowText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%", // ❗️important
    // paddingHorizontal: 20, // instead of 90% width
    gap: 12,
    marginTop: 20,
    marginBottom: 24,
  },

  saveButton: {
    flex: 1, // takes remaining space
    height: 50,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.dark.background,
  },
  deleteButton: {
    // width: 50, // 🔒 fixed size (no flex)
    // height: 50,
    borderRadius: 18,
    backgroundColor: "rgba(255, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginLeft: "auto",
  },
  floatingActionColumn: {
    position: "absolute",
    right: 12,
    top: 12,
    zIndex: 10,
    gap: 10,
  },
  floatingActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#191919AA", // semi-transparent dark circle
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(10px)", // Works in some RN environments, otherwise just use opacity
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#222",
  },
  btnPinned: {
    backgroundColor: Colors.dark.primary,
    borderColor: Colors.dark.primary,
  },
  btnQueue: { backgroundColor: "#50fa7b", borderColor: "#50fa7b" },
  actionDivider: { height: 1, backgroundColor: "#222", marginVertical: 4 },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  // sectionTitle: {
  //   fontSize: 12,
  //   fontWeight: "700",
  //   textTransform: "uppercase",
  //   letterSpacing: 1,
  //   color: "#888",
  // },
  progressCount: {
    fontSize: 16,
    fontFamily: "lm", // Using your custom font
    color: Colors.dark.text,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#555",
    marginBottom: 20,
    textAlign: "center",
  },
  largeStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 30,
  },
  circleStepBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1a1a1e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  hugeNumberContainer: {
    alignItems: "center",
    minWidth: 100,
  },
  hugeNumberInput: {
    fontSize: 48,
    fontFamily: "ni", // Your custom heading font
    color: "#fff",
    textAlign: "center",
    padding: 0,
    margin: 0,
  },
  totalLabel: {
    fontSize: 12,
    color: Colors.dark.primary,
    fontWeight: "700",
    marginTop: -5,
  },

  hiddenLinkInput: {
    marginTop: 10,
    fontSize: 12,
    color: "#444",
    paddingHorizontal: 10,
  },
  linkLargeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1e",
    // Remove vertical padding, use height for consistency
    height: 60,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  linkText: {
    flex: 1,
    color: "#eee",
    fontSize: 15,
    height: "100%", // Let it fill the bar vertically
    marginHorizontal: 10,
    paddingVertical: 0, // Reset default Android padding
  },
  openIconWrapper: {
    padding: 10, // Increase the hit-box of the open icon
    marginRight: -10, // Pull it back to alignment
  },

  mangaImageWrapper: {
    width: 250,
    height: 350,
    borderRadius: 25,
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
    backgroundColor: "#1a1a1e",
  },
  mangaImage: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  placeholderText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif",
    fontStyle: "italic",
    textTransform: "uppercase",
    marginTop: 10,
  },
  placeholderEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 15,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.2)",
  },
  markdown: {
    // Standard text
    body: {
      color: Colors.dark.mutedForeground,
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "poppins", // Matches your card font
    },
    // Headers (# Header)
    heading1: {
      color: "#ffffff",
      fontSize: 24,
      fontWeight: "800",
      marginVertical: 10,
    },
    heading2: {
      color: "#ffffff",
      fontSize: 20,
      fontWeight: "700",
      marginVertical: 8,
    },
    // Bold (**text**)
    strong: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    // Italics (*text*)
    em: {
      fontStyle: "italic",
    },
    // Links ([text](url))
    link: {
      color: Colors.dark.primary,
      textDecorationLine: "underline",
    },
    // List items
    bullet_list: {
      marginVertical: 10,
    },
    list_item: {
      flexDirection: "row",
      justifyContent: "flex-start",
    },
    // Horizontal rule (---)
    hr: {
      backgroundColor: "rgba(255,255,255,0.1)",
      height: 1,
      marginVertical: 15,
    },

    // Code blocks (backticks)
    code_inline: {
      backgroundColor: "#2c2c2e",
      color: Colors.dark.primary,
      padding: 4,
      borderRadius: 4,
    },
  } as any,
});
