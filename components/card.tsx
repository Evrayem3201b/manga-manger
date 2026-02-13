import { Colors } from "@/constants/theme";
import { getStatusFromName } from "@/utils/getStatus";
import { SimpleDisplay } from "@/utils/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Badge from "./badge";
import { ThemedText } from "./themed-text";

function Card({
  name,
  totalChap,
  status,
  coverUrl,
  currentChap,
  search,
  isAdult,
  isFavorite,
  isPlanToRead,
  isDownloading,
}: SimpleDisplay & {
  search?: boolean;
  isAdult?: boolean | number;
  isFavorite?: boolean;
  isPlanToRead?: boolean;
  isDownloading?: boolean;
}) {
  const shouldHideImage = !!isAdult;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageWrapper}>
        <Badge status={getStatusFromName(status)} />

        {/* --- REFACTORED BADGE CONTAINER --- */}
        {!search && (
          <View style={styles.libraryBadgesContainer}>
            {isPlanToRead && (
              <View
                style={[
                  styles.miniBadge,
                  { backgroundColor: Colors.dark.primary },
                ]}
              >
                <Ionicons name="bookmark" size={11} color="#000" />
              </View>
            )}
            {isFavorite && (
              <View style={[styles.miniBadge, { backgroundColor: "#ff5555" }]}>
                <Ionicons name="heart" size={12} color="#fff" />
              </View>
            )}
          </View>
        )}

        {/* --- IMAGE / PLACEHOLDER LOGIC --- */}
        {shouldHideImage ? (
          <View style={[styles.image, styles.adultPlaceholder]}>
            <LinearGradient
              colors={["#2c1a1a", "#1a1a1e"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.warningCircle}>
              <ThemedText style={styles.warningText}>18+</ThemedText>
            </View>
          </View>
        ) : (
          <>
            {coverUrl?.uri ? (
              <Image
                source={{ uri: coverUrl.uri }}
                style={[styles.image, StyleSheet.absoluteFill]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.image, styles.placeholderContainer]}>
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
                  <Text style={styles.placeholderText} numberOfLines={2}>
                    {name}
                  </Text>
                </View>
              </View>
            )}

            {isDownloading && (
              <View style={styles.downloadOverlay}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>Downloading...</Text>
              </View>
            )}

            {!shouldHideImage && coverUrl?.uri && !isDownloading && (
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.gradient}
              />
            )}
          </>
        )}

        <View style={styles.innerBorder} />
      </View>

      <View style={styles.textContainer}>
        <ThemedText
          lightColor={Colors.dark.text}
          style={styles.title}
          numberOfLines={1}
        >
          {name}
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.chapterText}>
            {search ? (
              <ThemedText style={styles.totalLabel}>
                Total {totalChap || "?"} Ch.
              </ThemedText>
            ) : (
              <>
                <ThemedText style={styles.currentLabel}>
                  Ch. {currentChap || 0}
                </ThemedText>
                <ThemedText style={styles.divider}> / </ThemedText>
                <ThemedText style={styles.totalLabel}>
                  {totalChap || "?"}
                </ThemedText>
              </>
            )}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

export default memo(Card);

const styles = StyleSheet.create({
  cardContainer: { width: 165, marginBottom: 15 },
  imageWrapper: {
    width: 165,
    height: 235,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#1a1a1e",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    position: "relative",
  },
  // Simplified this container to handle the layout
  libraryBadgesContainer: {
    position: "absolute",
    top: 15, // Below the status badge
    right: 8,
    gap: 6, // Vertical spacing between heart and bookmark
    zIndex: 30,
    alignItems: "center",
  },
  miniBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.3)",
    // Added a slight shadow to make them pop against busy covers
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
  },
  image: { width: "100%", height: "100%" },
  adultPlaceholder: { justifyContent: "center", alignItems: "center" },
  warningCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  warningText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 18,
    fontWeight: "800",
  },
  placeholderContainer: { justifyContent: "center", alignItems: "center" },
  placeholderContent: { alignItems: "center", paddingHorizontal: 10 },
  placeholderText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    fontStyle: "italic",
    textTransform: "uppercase",
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    zIndex: 20,
  },
  loadingText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    zIndex: 25,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
    marginBottom: -1,
  },
  textContainer: { paddingTop: 8, paddingHorizontal: 4 },
  title: { fontSize: 15, lineHeight: 18, fontWeight: "600", color: "#FFFFFF" },
  infoRow: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  chapterText: { fontSize: 13 },
  currentLabel: { color: Colors.dark.primary, fontWeight: "700" },
  divider: { color: "#444" },
  totalLabel: { color: "#888", fontWeight: "500" },
});
