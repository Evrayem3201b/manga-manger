import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import React from "react";
import { ScrollView, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScreenHug({
  children,
  count,
  title,
  style,
  scroll = true,
}: {
  children: React.ReactNode;
  count?: number;
  title: string;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();

  const sharedStyles: ViewStyle = {
    paddingHorizontal: 20,
    paddingTop: insets.top + 20,
    backgroundColor: Colors.dark.background,
  };

  if (scroll) {
    return (
      <ScrollView
        // style covers the outer bounds
        style={{ flex: 1, backgroundColor: Colors.dark.background }}
        // contentContainerStyle covers the internal list
        contentContainerStyle={[{ flexGrow: 1, ...sharedStyles }, style]}
      >
        <Header title={title} count={count} />
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[{ flex: 1, ...sharedStyles }, style]}>
      <Header title={title} count={count} />
      {children}
    </View>
  );
}

// Helper to keep the JSX dry and avoid recreation issues
function Header({ title, count }: { title: string; count?: number }) {
  return (
    <>
      <ThemedText type="title" lightColor={Colors.dark.text}>
        {title}
      </ThemedText>
      {count !== undefined && (
        <ThemedText
          type="defaultSemiBold"
          style={{ paddingTop: 10 }}
          lightColor={Colors.dark.mutedForeground}
        >
          {count} manga
        </ThemedText>
      )}
    </>
  );
}
