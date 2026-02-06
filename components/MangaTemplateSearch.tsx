import { Colors } from "@/constants/theme";
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import { getStatusFromName } from "@/utils/getStatus";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";

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
  const { result: data, isLoading, genres } = useMangaDetails(id);

  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [query, setQuery] = useState(String(data?.currentChap || "0"));
  const [downloadedImageUri, setDownloadedImageUri] = useState<string | null>(
    null,
  );
  const db = useSQLiteContext();

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

  async function openMangaSite() {
    const url = `https://mangadex.org/title/${id}/${data?.name}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Don't know how to open this URL");
    }
  }

  async function addToLibrary() {
    if (!data) return;

    try {
      const localUri = await handleImageDownload();

      if (!localUri) {
        Alert.alert("Error", "Could not download cover image.");
        return;
      }

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `INSERT OR REPLACE INTO manga (id, name, description, cover_url, cover_online_link, status, year, rating, total_chap, current_chap, is_adult, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            data.id,
            data.name,
            data.description,
            localUri,
            data.coverUrl?.uri || null,
            data.status,
            data.year,
            data.rating ? parseFloat(data.rating) : null,
            data.totalChap ?? null,
            parseInt(query) || 0,
            data.isAdult,
            Date.now(),
            Date.now(),
          ],
        );

        if (genres) {
          for (const genre of genres) {
            await db.runAsync(
              `INSERT OR REPLACE INTO manga_genres (manga_id, genre) VALUES (?, ?)`,
              [data.id, genre.attributes.name.en],
            );
          }
        }
      });

      Alert.alert("Success", "Manga added to your library!");
    } catch (e) {
      Alert.alert("Error", "Failed to add manga to library." + e);
    }
  }

  async function handleImageDownload() {
    if (!data?.coverUrl.uri) return null;

    try {
      const coversDir = new FileSystem.Directory(
        FileSystem.Paths.document,
        "covers",
      );

      if (!coversDir.exists) {
        await coversDir.create();
      }

      const destinationFile = new FileSystem.File(coversDir, `${data.id}.jpg`);

      const output = await FileSystem.File.downloadFileAsync(
        data.coverUrl.uri,
        destinationFile,
        { idempotent: true },
      );

      setDownloadedImageUri(output.uri);
      return output.uri;
    } catch (error) {
      Alert.alert("New API Download Error:" + error);
      return null;
    }
  }

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
        <View style={styles.mangaImageWrapper}>
          {data?.coverUrl?.uri ? (
            <Image source={data.coverUrl} style={styles.mangaImage} />
          ) : (
            <View style={[styles.mangaImage, styles.placeholderContainer]}>
              <LinearGradient
                colors={["#1e1e24", "#44318d"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.placeholderContent}>
                <Ionicons
                  name="library-outline"
                  size={60}
                  color="rgba(255,255,255,0.15)"
                />
                <Text style={styles.placeholderText}>
                  {data?.name || "Loading..."}
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

      <View style={styles.genreContainer}>
        {visibleGenres?.map((tag: any) => {
          const genre = tag.attributes.name.en;
          return <Tag title={genre} key={tag.id} />;
        })}

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
              Linking.openURL(url).catch(() =>
                Alert.alert("Error", "Could not open link"),
              );
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

      <View style={styles.stepperSection}>
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

      <View style={styles.actionContainer}>
        {/* Elegant Read from Site Button */}
        <Pressable onPress={openMangaSite} style={styles.outlineBtn}>
          <MaterialCommunityIcons
            name="web"
            size={20}
            color={Colors.dark.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.outlineBtnText}>Read from Site</Text>
        </Pressable>

        <Button
          style={styles.primaryBtn}
          textStyle={{ flexGrow: 1, textAlign: "center" }}
          onPress={() => addToLibrary()}
        >
          {"Add to Library"}
        </Button>
      </View>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
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
    borderColor: "rgba(255,255,255,0.25)",
  },
  moreTagText: {
    color: Colors.dark.text,
    fontSize: 13,
    opacity: 0.85,
  },
  stepperSection: {
    marginTop: 40,
    marginBottom: 20,
    width: "90%",
    alignItems: "center",
  },
  actionContainer: {
    width: "100%",
    gap: 12,
    marginTop: 10,
    paddingBottom: 40,
  },
  outlineBtn: {
    width: "100%",
    height: 54,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.dark.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  outlineBtnText: {
    color: Colors.dark.primary,
    fontSize: 16,
    fontWeight: "800",
  },
  primaryBtn: {
    width: "100%",
    height: 54,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    borderRadius: 20,
    backgroundColor: Colors.dark.primary,
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
    fontFamily: "ni",
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
    body: {
      color: Colors.dark.mutedForeground,
      fontSize: 14,
      lineHeight: 22,
    },
    strong: {
      color: "#ffffff",
      fontWeight: "bold",
    },
    link: {
      color: Colors.dark.primary,
      textDecorationLine: "underline",
    },
  } as any,
});
