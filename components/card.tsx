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
}: SimpleDisplay & { search?: boolean }) {
  return (
    <View style={{ width: 170, height: 291 }}>
      {/* IMAGE CONTAINER */}
      <View style={styles.imageWrapper}>
        <Badge status={getStatusFromName(status)} />
        <Image
          source={coverUrl ?? require("@/assets/images/example-cover.webp")}
          style={{ width: 170, height: 220 }}
        />
        ;{/* GRADIENT OVERLAY */}
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.75)", // bottom (black)
            "rgba(0,0,0,0.0)", // top (transparent)
          ]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.gradient}
        />
      </View>

      {/* TEXT */}
      <View>
        <ThemedText
          lightColor={Colors.dark.text}
          style={{ fontFamily: "lm", paddingTop: 5, fontSize: 16 }}
          numberOfLines={1}
        >
          {name}
        </ThemedText>

        <ThemedText
          type="defaultSemiBold"
          lightColor={Colors.dark.mutedForeground}
          style={{ fontSize: 14, marginTop: -2 }}
        >
          {search ? <></> : `Ch. ${currentChap} / `}
          {totalChap ? `${totalChap}` : ""}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageWrapper: {
    position: "relative",
    width: 170,
    height: 220,
    borderRadius: 14,
    overflow: "hidden", // 🔥 REQUIRED
  },

  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
});
