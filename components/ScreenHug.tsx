import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { styles as GlobalStyles } from "@/styles/globalStyles";
import React from "react";
import { View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScreenHug({
  children,
  count,
  title,
  style,
}: {
  children: React.ReactNode;
  count?: number;
  title: string;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        {
          paddingInline: 20,
          paddingTop: insets.top + 20,
          backgroundColor: Colors.dark.background,
          height: "100%",
          ...GlobalStyles.text,
        },
        style,
      ]}
    >
      <ThemedText type="title" lightColor={Colors.dark.text}>
        {title}
      </ThemedText>
      {count ? (
        <ThemedText
          type="defaultSemiBold"
          style={{ paddingTop: 10 }}
          lightColor={Colors.dark.mutedForeground}
        >
          {count} manga
        </ThemedText>
      ) : (
        ""
      )}
      {children}
    </View>
  );
}
