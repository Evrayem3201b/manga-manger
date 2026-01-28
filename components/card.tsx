import { Colors } from "@/constants/theme";
import { getStatusFromName } from "@/utils/getStatus";
import { SimpleDisplay } from "@/utils/types";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import Badge from "./badge";
import { ThemedText } from "./themed-text";

export default function Card({
  name,
  totalChap,
  status,
  coverUrl,
  currentChap,
  search,
  isAdult,
  isPinned,
  inQueue,
  isDownloading,
  coverOnlineLink,
}: SimpleDisplay & {
  search?: boolean;
  isAdult?: boolean | number;
  isPinned?: boolean;
  inQueue?: boolean;
  isDownloading?: boolean;
}) {
  const shouldHideImage = !!isAdult;

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageWrapper}>
        <Badge status={getStatusFromName(status)} />

        {/* --- LIBRARY SPECIFIC BADGES (Hidden in Search) --- */}
        {!search && (
          <View style={styles.libraryBadges}>
            {isPinned && (
              <View
                style={[
                  styles.miniBadge,
                  { backgroundColor: Colors.dark.primary },
                ]}
              >
                <MaterialCommunityIcons name="pin" size={12} color="#000" />
              </View>
            )}
            {inQueue && (
              <View style={[styles.miniBadge, { backgroundColor: "#50fa7b" }]}>
                <MaterialCommunityIcons
                  name="layers-triple"
                  size={12}
                  color="#000"
                />
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

            {/* Indicator overlay for active download process */}
            {isDownloading && (
              <View style={styles.downloadOverlay}>
                <ActivityIndicator size="small" color={Colors.dark.primary} />
                <Text style={styles.loadingText}>
                  {isDownloading ? "Downloading..." : "Syncing..."}
                </Text>
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
  },
  libraryBadges: {
    position: "absolute",
    top: 35,
    right: 8,
    gap: 5,
    zIndex: 10,
  },
  miniBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
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
