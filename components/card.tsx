import { Colors } from "@/constants/theme";
import { getStatusFromName } from "@/utils/getStatus";
import { SimpleDisplay } from "@/utils/types";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Image, StyleSheet, View } from "react-native";
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
}: SimpleDisplay & { search?: boolean; isAdult?: boolean | number }) {
  const shouldHideImage = !!isAdult;

  return (
    <View style={styles.cardContainer}>
      {/* IMAGE CONTAINER */}
      <View style={styles.imageWrapper}>
        <Badge status={getStatusFromName(status)} />

        {!shouldHideImage ? (
          <Image
            source={
              coverUrl?.uri
                ? { uri: coverUrl.uri }
                : require("@/assets/images/example-cover.webp")
            }
            style={[styles.image, StyleSheet.absoluteFill]}
            resizeMode="cover"
          />
        ) : (
          /* 2. CPU-Friendly Adult Placeholder */
          <View style={[styles.adultPlaceholder, StyleSheet.absoluteFill]}>
            <LinearGradient
              colors={["#2c2c2e", "#1a1a1e"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.warningCircle}>
              <ThemedText style={styles.warningText}>18+</ThemedText>
            </View>
          </View>
        )}

        {/* SUBTLE INNER BORDER (Makes the image pop) */}
        <View style={styles.innerBorder} />

        {/* Only show gradient on non-adult to keep the placeholder clean */}
        {!shouldHideImage && (
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          />
        )}
      </View>

      {/* TEXT AREA */}
      <View style={styles.textContainer}>
        <ThemedText
          lightColor={Colors.dark.text}
          style={styles.title}
          numberOfLines={2} // Better for long manga titles
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
  cardContainer: {
    width: 165, // Slightly narrower for better gutter spacing
    marginBottom: 15,
  },
  imageWrapper: {
    width: 165,
    height: 235,
    borderRadius: 18, // More rounded = more modern/elegant
    overflow: "hidden",
    backgroundColor: "#1a1a1e", // Skeleton color while loading
    // Shadow for Android/iOS
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)", // Very faint highlight on top
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  textContainer: {
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: "lm", // Keep your custom font
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  chapterText: {
    fontSize: 13,
  },
  currentLabel: {
    color: Colors.dark.primary, // Highlight the user's progress
    fontWeight: "700",
  },
  divider: {
    color: "#444",
  },
  totalLabel: {
    color: "#888",
    fontWeight: "500",
  },

  adultPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1e",
  },
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
});
