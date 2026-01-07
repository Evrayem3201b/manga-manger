import { Colors } from "@/constants/theme";
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

export default function Layout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { result, isLoading } = useMangaDetails(id);
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShadowVisible: true,
          headerTitleAlign: "left",
          headerTitle: ``,

          headerTitleStyle: {
            fontFamily: "poppins",
          },
          headerLeft: () => (
            <Pressable
              style={{
                justifyContent: "center",
                flexDirection: "row",
                alignItems: "center",
              }}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={21}
                style={{ paddingRight: 8 }}
                color={Colors.dark.text}
              />
              <Text
                style={{
                  color: Colors.dark.text,
                  fontSize: 20,
                  marginTop: 4,
                  fontFamily: "poppins",
                }}
              >
                {isLoading ? <ActivityIndicator /> : result?.name}
              </Text>
            </Pressable>
          ),

          animation: "slide_from_right",
          headerStyle: {
            backgroundColor: Colors.dark.background,
          },
        }}
      />
    </Stack>
  );
}
