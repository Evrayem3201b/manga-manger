import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { useAlert } from "@/context/AlertContext"; // Import Alert Hook
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { openBrowserAsync } from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Settings() {
  const db = useSQLiteContext();
  const { showAlert } = useAlert(); // Initialize
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({ reading: 0, favorites: 0, plan: 0 });
  const [insights, setInsights] = useState({
    topGenre: "Loading...",
    streak: 0,
    weeklyChapters: 0,
    longestManga: "N/A",
  });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [db]);

  async function loadData() {
    try {
      const userRes = await db.getFirstAsync<{
        username: string;
        avatar_path: string;
      }>(`SELECT username, avatar_path FROM "user" LIMIT 1`);
      if (userRes) {
        setUsername(userRes.username || "");
        setAvatarPath(userRes.avatar_path || null);
      }

      const reading = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM manga`,
      );
      const favs = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM favorites`,
      );
      const plan = await db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count FROM plan_to_read`,
      );

      setStats({
        reading: reading?.count || 0,
        favorites: favs?.count || 0,
        plan: plan?.count || 0,
      });

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const weekly = await db.getFirstAsync<{ total: number }>(
        `SELECT SUM(chapters_read) as total FROM reading_history WHERE logged_at > ?`,
        [sevenDaysAgo],
      );
      const genre = await db.getFirstAsync<{ genre: string }>(
        `SELECT genre FROM manga_genres GROUP BY genre ORDER BY COUNT(*) DESC LIMIT 1`,
      );
      const longest = await db.getFirstAsync<{ name: string }>(
        `SELECT name FROM manga ORDER BY current_chap DESC LIMIT 1`,
      );

      setInsights((prev) => ({
        ...prev,
        topGenre: genre?.genre || "None",
        weeklyChapters: weekly?.total || 0,
        longestManga: longest?.name || "N/A",
      }));

      setHasLoaded(true);
    } catch (e) {
      // Simple Info Alert (One button)
      showAlert({
        title: "Load Error",
        message: "Failed to load user statistics.",
        type: "danger",
      });
    }
  }

  // Auto-save username
  useEffect(() => {
    if (!hasLoaded) return;
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await db.runAsync(`UPDATE "user" SET username = ? WHERE id = 1`, [
          username,
        ]);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [username, hasLoaded]);

  async function pickUserAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled) return;
    try {
      const asset = result.assets[0];
      const userDir = new Directory(Paths.document.uri, "user");
      if (!userDir.exists) await userDir.create();
      const avatarFile = new File(userDir.uri, "avatar.jpg");
      if (avatarFile.exists) await avatarFile.delete();
      await new File(asset.uri).copy(avatarFile);
      await db.runAsync(`UPDATE "user" SET avatar_path = ? WHERE id = 1`, [
        avatarFile.uri,
      ]);
      setAvatarPath(avatarFile.uri);
    } catch (e) {
      showAlert({
        title: "Error",
        message: "Failed to save avatar image.",
        type: "danger",
      });
    }
  }

  async function databaseExport() {
    const tempFileName = "export_sync_temp.db";
    const cleanDocUri = Paths.document.uri.endsWith("/")
      ? Paths.document.uri.slice(0, -1)
      : Paths.document.uri;
    const dbFolderPath = `${cleanDocUri}/SQLite`;
    const tempBackupUri = `${dbFolderPath}/${tempFileName}`;
    let isAttached = false;

    try {
      await db.runAsync(`PRAGMA wal_checkpoint(FULL)`);
      const originalDbFile = new File(dbFolderPath, "manga.db");
      if (!originalDbFile.exists) throw new Error("Source DB not found.");

      const tempFile = new File(dbFolderPath, tempFileName);
      if (tempFile.exists) await tempFile.delete();
      await originalDbFile.copy(tempFile);

      const rawSqlPath = tempBackupUri.replace("file://", "");
      await db.runAsync(`ATTACH DATABASE '${rawSqlPath}' AS backup`);
      isAttached = true;

      try {
        await db.runAsync(`UPDATE backup.manga SET cover_url = ''`);
        await db.runAsync(
          `INSERT OR REPLACE INTO backup.app_meta (prop, value, latest_sync) VALUES ('needs_cover_sync', '1', ?)`,
          [Date.now().toString()],
        );
      } finally {
        await db.runAsync(`DETACH DATABASE backup`);
        isAttached = false;
      }

      const destinationFolder = await Directory.pickDirectoryAsync();
      if (!destinationFolder) {
        await tempFile.delete();
        return;
      }

      const backupFile = destinationFolder.createFile(
        `manga_backup_${Date.now()}.db`,
        "application/x-sqlite3",
      );
      const modifiedBytes = await tempFile.bytes();
      await backupFile.write(modifiedBytes);
      await tempFile.delete();

      showAlert({
        title: "Success",
        message: "Database exported successfully!",
        type: "success",
      });
    } catch (e: any) {
      if (isAttached) {
        try {
          await db.runAsync(`DETACH DATABASE backup`);
        } catch {}
      }
      showAlert({
        title: "Export Error",
        message: "Database sync failed.",
        type: "danger",
      });
    }
  }

  async function databaseImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["*/*"] });
      if (result.canceled) return;

      const pickedFile = result.assets[0];
      const dbPath = `${Paths.document.uri}SQLite/manga.db`;

      showAlert({
        title: "Import Library",
        message:
          "Existing data will be overwritten. The app must restart to finalize.",
        type: "info",
        confirmText: "Import & Exit",
        onConfirm: async () => {
          try {
            const targetFile = new File(dbPath);
            if (targetFile.exists) await targetFile.delete();
            await new File(pickedFile.uri).copy(targetFile);
            showAlert({
              title: "Success",
              message: "Data imported. Please restart the app manually.",
              type: "success",
            });
          } catch (err) {
            showAlert({
              title: "Error",
              message: "File is locked or invalid.",
              type: "danger",
            });
          }
        },
      });
    } catch (e) {
      showAlert({ title: "Error", message: "Import failed.", type: "danger" });
    }
  }

  async function resetDatabase() {
    const dbDir = `${Paths.document.uri}SQLite`;
    const dbPath = `${dbDir}/manga.db`;
    const trashPath = `${dbDir}/manga.db.trash`;

    showAlert({
      title: "DANGER",
      message:
        "This will wipe all your library, history, and favorites. This cannot be undone.",
      type: "danger",
      confirmText: "Wipe Data",
      onConfirm: async () => {
        try {
          const dbFile = new File(dbPath);
          if (dbFile.exists) {
            const trashFile = new File(trashPath);
            if (trashFile.exists) await trashFile.delete();
            await dbFile.move(trashFile);
          }
          showAlert({
            title: "Done",
            message: "Database reset. Please restart the app.",
            type: "success",
          });
        } catch (e) {
          showAlert({
            title: "Error",
            message: "Database is currently busy.",
            type: "danger",
          });
        }
      },
    });
  }

  return (
    <ScreenHug title="Settings" scroll={true}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={pickUserAvatar} style={styles.avatarWrapper}>
            <Image
              source={
                avatarPath
                  ? { uri: avatarPath }
                  : require("@/assets/images/example-cover.webp")
              }
              style={styles.avatar}
            />
            <View style={styles.cameraIconContainer}>
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
          </Pressable>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Set Username"
            placeholderTextColor="#666"
            style={styles.usernameInput}
          />
          <Text style={[styles.savingText, { opacity: isSaving ? 1 : 0 }]}>
            Saving...
          </Text>
        </View>

        <View style={styles.insightsContainer}>
          <View style={styles.insightsHeader}>
            <Ionicons name="analytics" size={16} color={Colors.dark.primary} />
            <Text style={styles.insightsTitle}>Reading Insights</Text>
          </View>
          <View style={styles.insightsGrid}>
            <InsightItem
              icon="trophy"
              label="Longest Read"
              value={insights.longestManga}
              color="#4CAF50"
              isFull
            />
            <View style={[styles.insightsGrid]}>
              <InsightItem
                icon="flame"
                label="Streak"
                value={`${insights.streak} Days`}
                color="#FF5F6D"
              />
              <InsightItem
                icon="library"
                label="Top Genre"
                value={insights.topGenre}
                color="#FFC371"
              />
              <InsightItem
                icon="calendar"
                label="This Week"
                value={`${insights.weeklyChapters} Ch.`}
                color="#2196F3"
              />
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatBox label="Library" count={stats.reading} icon="book" />
          <StatBox label="Favorites" count={stats.favorites} icon="heart" />
          <StatBox label="Planning" count={stats.plan} icon="bookmark" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Library & Data</Text>
          <SettingItem
            icon="trash-outline"
            label="Clear History"
            color="#ff4444"
            onPress={() =>
              showAlert({
                title: "Clear Cache",
                message: "Do you want to clear your search history and cache?",
                type: "danger",
                confirmText: "Clear All",
                onConfirm: async () =>
                  await db.runAsync(`DELETE FROM search_cache`),
              })
            }
          />
          <SettingItem
            icon="cloud-upload-outline"
            label="Backup"
            color={Colors.dark.primary}
            onPress={databaseExport}
          />
          <SettingItem
            icon="cloud-download-outline"
            label="Import"
            color="#f5ae15"
            onPress={databaseImport}
          />
          <SettingItem
            icon="refresh-outline"
            label="Reset"
            color="#666"
            onPress={resetDatabase}
          />
          <SettingItem
            icon="ban"
            label="Blacklist"
            color="#ab4eb1"
            onPress={() => router.push("/blocked")}
          />
        </View>

        <View style={[styles.section, { marginBottom: 40 }]}>
          <Text style={styles.sectionLabel}>About</Text>
          <SettingItem
            icon="information-circle-outline"
            label="App Version"
            subLabel="v1.7.0"
            color="#333"
            showChevron={false}
          />
          <SettingItem
            icon="logo-github"
            label="Source Code"
            color="#333"
            onPress={() =>
              openBrowserAsync("https://github.com/Evrayem3201b/manga-manger")
            }
          />
        </View>
      </ScrollView>
    </ScreenHug>
  );
}

// ... Sub-components and styles remain identical to your previous code ...
const StatBox = ({ label, count, icon }: any) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={20} color={Colors.dark.primary} />
    <Text style={styles.statCount}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InsightItem = ({ icon, label, value, color, isFull }: any) => (
  <View style={[styles.insightItem, isFull && { width: "100%" }]}>
    <View style={[styles.insightIconCircle, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={16} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.insightLabel}>{label}</Text>
      <Text style={styles.insightValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  </View>
);

const SettingItem = ({
  icon,
  label,
  subLabel,
  color,
  onPress,
  showChevron = true,
}: any) => (
  <Pressable style={styles.settingItem} onPress={onPress}>
    <View style={[styles.iconContainer, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemLabel}>{label}</Text>
      {subLabel && <Text style={styles.itemSubLabel}>{subLabel}</Text>}
    </View>
    {showChevron && <Ionicons name="chevron-forward" size={18} color="#444" />}
  </Pressable>
);

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 60 },
  header: { alignItems: "center", marginTop: 40, marginBottom: 30 },
  avatarWrapper: { position: "relative", marginBottom: 15 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 5,
    backgroundColor: Colors.dark.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#000",
  },
  usernameInput: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    minWidth: 200,
  },
  savingText: {
    color: Colors.dark.primary,
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },
  insightsContainer: {
    width: "90%",
    alignSelf: "center",
    backgroundColor: "#111114",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#222",
    marginBottom: 25,
  },
  insightsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },
  insightsTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  insightsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  insightItem: {
    flex: 0,
    width: "47.9%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1a1a1e",
    padding: 12,
    borderRadius: 16,
  },
  insightIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  insightLabel: { color: "#666", fontSize: 10, fontWeight: "600" },
  insightValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    alignSelf: "center",
    marginBottom: 30,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#111114",
    padding: 15,
    borderRadius: 20,
    width: "31%",
    borderWidth: 1,
    borderColor: "#222",
  },
  statCount: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 5 },
  statLabel: { color: "#666", fontSize: 10, textTransform: "uppercase" },
  section: { width: "90%", alignSelf: "center", marginBottom: 25 },
  sectionLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 12,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111114",
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    gap: 15,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  itemLabel: { color: "#eee", fontSize: 15, fontWeight: "500" },
  itemSubLabel: { color: "#555", fontSize: 12 },
});
