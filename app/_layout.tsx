import UserContextProvider from "@/context/UserContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { useImmersiveNavBar } from "@/hooks/useImmersiveNavBar";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SQLiteProvider } from "expo-sqlite";

export default function RootLayout() {
  const queryClient = React.useMemo(() => new QueryClient(), []);

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
        <SQLiteProvider
          databaseName="manga.db"
          onInit={async (db) => {
            db.execAsync(`PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS manga (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  status TEXT,
  year INTEGER,
  rating REAL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS manga_genres (
  manga_id TEXT NOT NULL,
  genre TEXT NOT NULL,
  PRIMARY KEY (manga_id, genre),
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  manga_id TEXT NOT NULL,
  title TEXT,
  chapter_number REAL,
  volume TEXT,
  pages INTEGER,
  language TEXT,
  published_at INTEGER,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS favorites (
  manga_id TEXT PRIMARY KEY,
  added_at INTEGER,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS reading_progress (
  manga_id TEXT PRIMARY KEY,
  chapter_id TEXT,
  page INTEGER,
  updated_at INTEGER,
  FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_cache (
  query TEXT PRIMARY KEY,
  result_ids TEXT,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_manga_title ON manga(title);
CREATE INDEX IF NOT EXISTS idx_chapters_manga ON chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_genres_manga ON manga_genres(manga_id);
`);
          }}
        >
          <QueryClientProvider client={queryClient}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  paddingTop: insets.top,
                  backgroundColor: Colors.dark.background,
                },
              }}
            >
              <Stack.Screen
                name="(tabs)"
                options={{
                  contentStyle: {
                    backgroundColor: Colors.dark.background,
                  },
                }}
              />
            </Stack>
          </QueryClientProvider>
        </SQLiteProvider>
      </UserContextProvider>
    </ThemeProvider>
  );
}
