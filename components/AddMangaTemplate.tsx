import { Colors } from "@/constants/theme";
import { getBadgeColor as BadgeData } from "@/utils/BadgeData";
import { getStatusFromName } from "@/utils/getStatus";
import { MangaCategory } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Badge from "./badge";
import ScreenHug from "./ScreenHug";
import Tag from "./tag";
import { ThemedText } from "./themed-text";
import { Button } from "./ui/button";

const INITIAL_VISIBLE_TAGS = 5;

export default function AddMangaTemplate() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentChap, setCurrentChap] = useState<number>(0);
  const [totalChap, setTotalChap] = useState<number | null>(0);
  const [readingLink, setReadingLink] = useState<string>("");
  const [mangaName, setMangaName] = useState<string>("");
  const [description, setDescription] = useState<string>(
    "No description provided.",
  );
  const [isAdult, setIsAdult] = useState<boolean>(false);
  const [newGenre, setNewGenre] = useState<string>("");
  const [genreModalVisible, setGenreModalVisible] = useState<boolean>(false);
  const [mangaImagePath, setMangaImagePath] = useState<string | null>(null);
  const [genres, setGenres] = useState<{ genre: string }[]>([]);
  const [status, setStatus] = useState<MangaCategory>("ongoing");

  const db = useSQLiteContext();
  const router = useRouter();

  // Generate a clean ID
  const mangaId = `${mangaName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`;

  async function pickMangaImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const imageDir = new Directory(Paths.document, "covers");
      if (!imageDir.exists) {
        await imageDir.create();
      }
      const mangaImageFile = new File(imageDir.uri, `${mangaId}.jpg`);
      if (mangaImageFile.exists) {
        mangaImageFile.delete();
      }
      await new File(asset.uri).copy(mangaImageFile);
      setMangaImagePath(mangaImageFile.uri);
      Alert.alert("Success", "mangaImage updated!");
    } catch (e) {
      Alert.alert("Error", "Failed to save image." + e);
    }
  }

  async function handleSubmitManga() {
    if (!mangaName.trim()) {
      Alert.alert("Missing Name", "Please enter a manga title.");
      return;
    }

    try {
      setIsLoading(true);
      await db.withTransactionAsync(async () => {
        // SQLite doesn't have Boolean; we use 1 for true, 0 for false
        const adultVal = isAdult ? 1 : 0;

        await db.runAsync(
          `INSERT OR REPLACE INTO manga (id, name, description, cover_url, cover_online_link, status, total_chap, current_chap, is_adult, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            mangaId,
            mangaName,
            description,
            mangaImagePath ?? "",
            readingLink,
            status,
            totalChap ?? 0,
            currentChap,
            adultVal,
            Date.now(),
            Date.now(),
          ],
        );

        // Clear and Insert genres
        await db.runAsync(`DELETE FROM manga_genres WHERE manga_id = ?`, [
          mangaId,
        ]);
        for (const item of genres) {
          await db.runAsync(
            `INSERT INTO manga_genres (manga_id, genre) VALUES (?, ?)`,
            [mangaId, item.genre],
          );
        }
      });

      Alert.alert("Success", "Manga added to library", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Database Error", "Check console for logs.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleGenreAdd = () => {
    if (newGenre.trim()) {
      setGenres([...genres, { genre: newGenre.trim() }]);
      setNewGenre("");
      setGenreModalVisible(false);
    }
  };

  const removeGenre = (index: number) => {
    setGenres(genres.filter((_, i) => i !== index));
  };

  const handleLinkOpen = async () => {
    if (!readingLink) return;
    try {
      await Linking.openURL(readingLink);
    } catch (e) {
      Alert.alert("Invalid URL", "Please provide a valid web link.");
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <ThemedText style={{ marginTop: 10 }}>Saving to Library...</ThemedText>
      </View>
    );
  }

  const statusOptions: MangaCategory[] = [
    "ongoing",
    "completed",
    "hiatus",
    "cancelled",
  ];

  return (
    <ScreenHug title="" style={styles.container} scroll={true}>
      {/* --- COVER SECTION --- */}
      <View style={styles.imageContainer}>
        <Badge status={getStatusFromName(status)} />
        <View style={styles.mangaImageWrapper}>
          {mangaImagePath ? (
            <Image source={{ uri: mangaImagePath }} style={styles.mangaImage} />
          ) : (
            /* --- BEAUTIFUL PLACEHOLDER --- */
            <View style={[styles.mangaImage, styles.placeholderContainer]}>
              <LinearGradient
                colors={["#232526", "#414345"]} // Deep slate gradient
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.placeholderContent}>
                <Ionicons
                  name="book-outline"
                  size={60}
                  color="rgba(255,255,255,0.15)"
                  style={{ marginBottom: 10 }}
                />
                <Text style={styles.placeholderText} numberOfLines={3}>
                  {mangaName || "Manga Title"}
                </Text>
              </View>
              {/* Subtle decorative edge */}
              <View style={styles.placeholderEdge} />
            </View>
          )}

          {/* Subtle Overlay Gradient for all covers */}
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent"]}
            start={{ x: 0.5, y: 1 }}
            end={{ x: 0.5, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />

          <Pressable style={styles.imageEditBtn} onPress={pickMangaImage}>
            <Ionicons name="camera" size={22} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* --- STATUS SELECTION SECTION --- */}
      <View style={styles.contentBlock}>
        <ThemedText style={styles.sectionLabel}>Manga Status</ThemedText>
        <View style={styles.statusGrid}>
          {statusOptions.map((option) => {
            const isSelected = status === option;
            const config = BadgeData(option);
            return (
              <Pressable
                key={option}
                onPress={() => setStatus(option)}
                style={[
                  styles.statusChip,
                  isSelected && {
                    backgroundColor: config?.badgeBackgroundColor,
                    borderColor: config?.badgeTextColor,
                  },
                ]}
              >
                {/* Dynamically render the icon from your BadgeData util */}
                {React.cloneElement(
                  config?.badgeIcon as React.ReactElement<{
                    size?: number;
                    color?: string;
                  }>,
                  {
                    size: 14,
                    color: isSelected ? config?.badgeTextColor : "#444",
                  },
                )}
                <Text
                  style={[
                    styles.statusChipText,
                    isSelected && {
                      color: config?.badgeTextColor,
                      fontWeight: "700",
                    },
                  ]}
                >
                  {option.replace("-", " ")}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- NAME & GENRES --- */}
      <View style={styles.contentBlock}>
        <ThemedText style={styles.sectionLabel}>Title & Genres</ThemedText>
        <View style={styles.inputField}>
          <TextInput
            placeholder="Manga Name"
            placeholderTextColor="#666"
            style={styles.textInputMain}
            value={mangaName}
            onChangeText={setMangaName}
          />
        </View>

        <View style={styles.genreRow}>
          {genres.map((item, index) => (
            <Pressable key={index} onPress={() => removeGenre(index)}>
              <Tag title={item.genre} />
            </Pressable>
          ))}
          <Pressable
            style={styles.addGenreBtn}
            onPress={() => setGenreModalVisible(true)}
          >
            <Ionicons name="add" size={16} color={Colors.dark.text} />
            <Text style={styles.addGenreText}>Add genre</Text>
          </Pressable>
        </View>
      </View>

      {/* --- DESCRIPTION --- */}
      <View style={styles.contentBlock}>
        <ThemedText style={styles.sectionLabel}>Synopsis</ThemedText>
        <TextInput
          style={styles.descriptionInput}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Brief description..."
          placeholderTextColor="#444"
        />
      </View>

      {/* --- PROGRESS STEPPER --- */}
      <View style={styles.progressSection}>
        <ThemedText style={styles.sectionLabel}>
          Current Reading Progress
        </ThemedText>
        <View style={styles.stepperRow}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => setCurrentChap(Math.max(0, currentChap - 1))}
          >
            <Ionicons name="remove" size={24} color="#fff" />
          </Pressable>

          <View style={styles.numberDisplay}>
            <TextInput
              keyboardType="numeric"
              style={styles.mainNumber}
              value={String(currentChap)}
              onChangeText={(t) => setCurrentChap(Number(t) || 0)}
            />
            <View style={styles.totalRow}>
              <Text style={styles.ofText}>OF</Text>
              <TextInput
                style={styles.totalNumber}
                placeholder="?"
                placeholderTextColor={Colors.dark.primary}
                keyboardType="numeric"
                value={totalChap === 0 ? "" : String(totalChap)}
                onChangeText={(t) => setTotalChap(Number(t) || 0)}
              />
            </View>
          </View>

          <Pressable
            style={styles.stepBtn}
            onPress={() => setCurrentChap(currentChap + 1)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* --- ADULT CONTENT TOGGLE --- */}
      <Pressable style={styles.nsfwToggle} onPress={() => setIsAdult(!isAdult)}>
        <Ionicons
          name={isAdult ? "checkbox" : "square-outline"}
          size={24}
          color={isAdult ? "#FF4444" : "#444"}
        />
        <Text style={[styles.nsfwText, isAdult && { color: "#FF4444" }]}>
          Mature Content (18+)
        </Text>
      </Pressable>

      {/* --- LINK SECTION --- */}
      <View style={styles.contentBlock}>
        <ThemedText style={styles.sectionLabel}>Source Link</ThemedText>
        <View style={styles.inputField}>
          <Ionicons
            name="link"
            size={18}
            color={Colors.dark.primary}
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="https://..."
            placeholderTextColor="#444"
            style={styles.textInputMain}
            value={readingLink}
            onChangeText={setReadingLink}
          />
          <Pressable onPress={handleLinkOpen}>
            <Ionicons
              name="open-outline"
              size={20}
              color={Colors.dark.primary}
            />
          </Pressable>
        </View>
      </View>

      {/* --- ACTIONS --- */}
      <View style={styles.footer}>
        <Button style={styles.mainSaveBtn} onPress={handleSubmitManga}>
          <Text style={styles.mainSaveText}>Save Manga</Text>
        </Button>
        <Button style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={{ color: "#ff4444" }}>Cancel</Text>
        </Button>
      </View>

      {/* --- MODAL --- */}
      <Modal visible={genreModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContent}
          >
            <ThemedText style={styles.modalTitle}>Add New Genre</ThemedText>
            <TextInput
              style={styles.modalInput}
              autoFocus
              value={newGenre}
              onChangeText={setNewGenre}
              placeholder="Action, Fantasy, etc."
              placeholderTextColor="#555"
            />
            <View style={styles.modalButtons}>
              <Button
                style={styles.modalCancel}
                onPress={() => setGenreModalVisible(false)}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </Button>
              <Button style={styles.modalAdd} onPress={handleGenreAdd}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>Add</Text>
              </Button>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#222",
  },
  statusChipText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 6,
    textTransform: "capitalize",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
  },
  container: { paddingTop: 20, alignItems: "center" },
  imageContainer: { alignItems: "center", marginBottom: 30 },
  mangaImageWrapper: {
    width: 200,
    height: 280,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#1a1a1e",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  mangaImage: { width: "100%", height: "100%", borderRadius: 25 },
  imageEditBtn: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: Colors.dark.primary,
    padding: 12,
    borderRadius: 15,
  },
  contentBlock: { width: "90%", marginBottom: 25 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: "#555",
    marginBottom: 10,
  },
  inputField: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#222",
  },
  textInputMain: { flex: 1, color: "#fff", fontSize: 16 },
  genreRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  addGenreBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#333",
  },
  addGenreText: { color: "#888", fontSize: 12, marginLeft: 4 },
  descriptionInput: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 15,
    color: "#aaa",
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: "top",
  },
  progressSection: { width: "90%", alignItems: "center", marginBottom: 30 },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 40 },
  stepBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1a1a1e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  numberDisplay: { alignItems: "center" },
  mainNumber: { fontSize: 54, color: "#fff", fontWeight: "bold", padding: 0 },
  totalRow: { flexDirection: "row", alignItems: "center", marginTop: -5 },
  ofText: { color: "#444", fontSize: 12, fontWeight: "bold", marginRight: 5 },
  totalNumber: { fontSize: 18, color: Colors.dark.primary, fontWeight: "bold" },
  nsfwToggle: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    marginBottom: 25,
    backgroundColor: "#1a1212",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#3a2222",
  },
  nsfwText: { marginLeft: 10, color: "#888", fontWeight: "600" },
  footer: { flexDirection: "row", width: "100%", gap: 10, marginBottom: 24 },
  mainSaveBtn: {
    flex: 1, // takes remaining space
    height: 50,
    borderRadius: 18,
    backgroundColor: Colors.dark.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  mainSaveText: {
    color: Colors.dark.background,
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelBtn: {
    borderRadius: 18,
    backgroundColor: "rgba(255, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 68, 68, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    marginLeft: "auto",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a1a1e",
    width: "80%",
    padding: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#333",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "#000",
    color: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
  modalCancel: { backgroundColor: "#333", paddingHorizontal: 20 },
  modalAdd: { backgroundColor: Colors.dark.primary, paddingHorizontal: 25 },
  placeholderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1e",
  },
  placeholderContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  placeholderText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    fontFamily: Platform.OS === "ios" ? "Georgia" : "serif", // Classic book font
    fontStyle: "italic",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  placeholderEdge: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 15,
    backgroundColor: "rgba(255,255,255,0.03)", // Simulates a book spine highlight
    borderRightWidth: 1,
    borderRightColor: "rgba(0,0,0,0.2)",
  },
});
