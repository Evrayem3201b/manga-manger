import UserContextProvider from "@/context/UserContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useImmersiveNavBar } from "@/hooks/useImmersiveNavBar";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function RootLayout() {
  const queryClient = new QueryClient();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const insets = useSafeAreaInsets();
  /* async function loadUsername() {
    let name = await AsyncStorage.getItem("username");
    if (name !== null) {
      router.push("/(tabs)/home");
    }
  }
  useEffect(() => {
    loadUsername();
  }, []); */
  useImmersiveNavBar();

  return (
    <ThemeProvider value={DefaultTheme}>
      <UserContextProvider>
        <QueryClientProvider client={queryClient}>
          <Stack screenOptions={{ headerShown: false }}>
            <View
              style={{
                paddingTop: insets.top,
                backgroundColor: Colors.dark.background,
              }}
              className=""
            >
              {/* Only include the tabs layout */}
              <Stack.Screen
                name="(tabs)"
                options={{
                  contentStyle: {
                    flex: 1,
                  },
                }}
              />
            </View>
          </Stack>
        </QueryClientProvider>
      </UserContextProvider>
    </ThemeProvider>
  );
}
