import { Colors } from "@/constants/theme";
import React from "react";
import { View, ViewStyle } from "react-native";
import { ThemedText } from "./themed-text";

export default function Tag({
  title,
  style,
}: {
  title: string;
  style?: ViewStyle;
}) {
  if (!title) return;
  return (
    <>
      <View
        style={{
          ...style,
          backgroundColor: "#191919AA",
          width: "auto",
          borderRadius: 1000,
          justifyContent: "center",
          alignItems: "center",
          display: "flex",
        }}
      >
        <View
          style={{
            paddingBlock: 1,
            paddingInline: 7,
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
            flexDirection: "row",
            gap: 2,
          }}
        >
          <ThemedText
            style={{
              color: Colors.dark.text,
              fontSize: 12,
              fontFamily: "ls",
              textTransform: "capitalize",
            }}
            lightColor={Colors.dark.text}
          >
            {title}
          </ThemedText>
        </View>
      </View>
    </>
  );
}
