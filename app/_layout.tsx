import { Stack } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { AlertProvider } from "@/context/AlertContext";
import { useDoubleBackExit } from "@/hooks/useDoubleBackExit"; // Import the hook
import { useImmersiveNavBar } from "@/hooks/useImmersiveNavBar";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { SQLiteProvider } from "expo-sqlite";

export default function RootLayout() {
  const queryClient = React.useMemo(() => new QueryClient(), []);

  const insets = useSafeAreaInsets();
  useImmersiveNavBar();
  useDoubleBackExit(); // <--- Add this here

  return (
    <ThemeProvider value={DefaultTheme}>
      <AlertProvider>
        <SQLiteProvider
          databaseName="manga.db"
          onInit={async (db) => {
            await db.execAsync(`PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS "user" (
              id INTEGER PRIMARY KEY,
              username TEXT,
              avatar_path TEXT
            );

            CREATE TABLE IF NOT EXISTS manga (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              cover_url TEXT,
              cover_online_link TEXT,
              status TEXT,
              year INTEGER,
              rating REAL,
              total_chap INTEGER DEFAULT 0,
              current_chap INTEGER DEFAULT 0,
              reading_link TEXT,
              created_at INTEGER,
              updated_at INTEGER,
              is_adult BOOLEAN DEFAULT FALSE,
              is_pinned INTEGER DEFAULT 0,
              queue_order INTEGER DEFAULT 0
            );

            -- BLOCKED MANGA TABLE
            CREATE TABLE IF NOT EXISTS blocked_manga (
              manga_id TEXT PRIMARY KEY,
              manga_image TEXT,
              name TEXT,
              reason TEXT,
              blocked_at INTEGER DEFAULT (strftime('%s','now') * 1000)
            );

            -- NEW: Table to track every chapter increase for streaks/stats
            CREATE TABLE IF NOT EXISTS reading_history (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              manga_id TEXT NOT NULL,
              chapters_read INTEGER DEFAULT 1,
              logged_at INTEGER DEFAULT (strftime('%s','now')),
              FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE CASCADE
            );

            -- NEW: Trigger to automatically log when current_chap increases
            CREATE TRIGGER IF NOT EXISTS log_reading_progress
            AFTER UPDATE OF current_chap ON manga
            WHEN NEW.current_chap > OLD.current_chap
            BEGIN
              INSERT INTO reading_history (manga_id, chapters_read, logged_at)
              VALUES (NEW.id, NEW.current_chap - OLD.current_chap, strftime('%s','now') * 1000);
            END;

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

            CREATE TABLE IF NOT EXISTS plan_to_read (
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
              query TEXT,
              result_ids TEXT PRIMARY KEY,
              created_at INTEGER
            );

            CREATE TABLE IF NOT EXISTS app_meta (
              prop TEXT PRIMARY KEY,
              value TEXT DEFAULT '0',
              latest_sync TEXT DEFAULT '0'
            );

            -- Ensure core meta properties exist
            INSERT OR IGNORE INTO app_meta (prop, value, latest_sync) VALUES ('needs_cover_sync', '0', '0');
            
            CREATE INDEX IF NOT EXISTS idx_manga_title ON manga(name);
            CREATE INDEX IF NOT EXISTS idx_chapters_manga ON chapters(manga_id);
            CREATE INDEX IF NOT EXISTS idx_genres_manga ON manga_genres(manga_id);
            CREATE INDEX IF NOT EXISTS idx_blocked_manga_id ON blocked_manga(manga_id);
          `);
          }}
          options={{ useNewConnection: false }}
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
      </AlertProvider>
    </ThemeProvider>
  );
}
