import ScreenHug from "@/components/ScreenHug";
import { Colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useSQLiteContext } from "expo-sqlite";
import { openBrowserAsync } from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

export default function Settings() {
  const db = useSQLiteContext();
  const [username, setUsername] = useState("");
  const [stats, setStats] = useState({ reading: 0, favorites: 0, plan: 0 });
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
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
        setHasLoaded(true);
      } catch (e) {
        Alert.alert("Load Error:" + e);
      }
    }
    loadData();
  }, [db]);

  useEffect(() => {
    if (!hasLoaded) return;
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await db.runAsync(`UPDATE "user" SET username = ? WHERE id = 1`, [
          username,
        ]);
      } catch (e) {
        Alert.alert("Username Save Error:" + e);
      } finally {
        setIsSaving(false);
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [username, hasLoaded]);

  async function deleteSearchHistory() {
    try {
      await db.runAsync(`DELETE FROM search_cache`);
      Alert.alert("Success", "Search history cleared!");
    } catch (e) {
      Alert.alert("Error", "Couldn't clear history");
    }
  }

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
      const userDir = new Directory(Paths.document, "user");

      if (!userDir.exists) {
        await userDir.create();
      }

      const avatarFile = new File(userDir.uri, "avatar.jpg");

      // FIX: Delete the old file if it exists before copying the new one
      if (avatarFile.exists) {
        avatarFile.delete();
      }

      await new File(asset.uri).copy(avatarFile);

      await db.runAsync(`UPDATE "user" SET avatar_path = ? WHERE id = 1`, [
        avatarFile.uri,
      ]);

      setAvatarPath(avatarFile.uri);
      Alert.alert("Success", "Avatar updated!");
    } catch (e) {
      Alert.alert("Error", "Failed to save image." + e);
    }
  }

  async function databaseExport() {
    try {
      // 1. Reference the source database
      const dbFile = new File(Paths.document, "SQLite", "manga.db");

      if (!dbFile.exists) {
        Alert.alert("Error", "Database file not found.");
        return;
      }

      // 2. Open the system folder picker
      const destinationFolder = await Directory.pickDirectoryAsync();
      if (!destinationFolder) return;

      // 3. Create the file entry in the selected directory
      const backupFile = destinationFolder.createFile(
        "manga_backup.db",
        "application/x-sqlite3",
      );

      // 4. FIX: Use bytes() and write() instead of copy()
      // This bypasses the Content URI limitation by streaming the data
      const dbBytes = await dbFile.bytes();
      await backupFile.write(dbBytes);

      Alert.alert("Success", "Backup saved to your device!");
    } catch (e) {
      console.error(e);
      Alert.alert(
        "Export Error",
        "The system blocked the file copy. Please try a different folder.",
      );
    }
  }
  async function databaseImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        // Fix: Use a broader type or wildcard to prevent files from being greyed out
        type: ["application/x-sqlite3", "application/octet-stream", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFile = result.assets[0];
      const dbFile = new File(Paths.document, "SQLite", "manga.db");

      if (!dbFile.parentDirectory.exists) {
        await dbFile.parentDirectory.create();
      }

      Alert.alert(
        "Replace Database",
        "This will overwrite your library. Please restart the app after.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: async () => {
              try {
                // Ensure target is clear to avoid "file already exists" error
                if (dbFile.exists) {
                  dbFile.delete();
                }

                await new File(pickedFile.uri).copy(dbFile);
                Alert.alert("Success", "Imported. Please restart the app.");
              } catch (err) {
                Alert.alert(`${err}`);
                Alert.alert("Error", "Import failed.");
              }
            },
          },
        ],
      );
    } catch (e) {
      Alert.alert("Import Error", "File picker failed.");
    }
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
                  : require("@/assets/images/example-cover.webp") // Your default placeholder
              }
              style={styles.avatar}
              // If the file exists in DB but is missing from disk, reset to placeholder
              onError={() => {
                console.warn(
                  "Avatar file not found on disk, reverting to placeholder.",
                );
                setAvatarPath(null);
              }}
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

        <View style={styles.statsRow}>
          <StatBox label="Reading" count={stats.reading} icon="book" />
          <StatBox label="Favorites" count={stats.favorites} icon="heart" />
          <StatBox label="Planning" count={stats.plan} icon="bookmark" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Library Management</Text>
          <SettingItem
            icon="trash-outline"
            label="Clear Search History"
            color="#ff4444"
            onPress={() =>
              Alert.alert("Clear", "Clear search history?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear All",
                  style: "destructive",
                  onPress: deleteSearchHistory,
                },
              ])
            }
          />
          <SettingItem
            icon="download-outline"
            label="Import Database"
            color="#f5ae15"
            styleIcon={{ transform: [{ rotate: "180deg" }] }}
            onPress={databaseImport}
          />
          <SettingItem
            icon="download-outline"
            label="Backup Database"
            color={Colors.dark.primary}
            onPress={databaseExport}
          />
        </View>

        <View style={[styles.section, { marginBottom: 42 }]}>
          <Text style={styles.sectionLabel}>About</Text>
          <SettingItem
            icon="information-circle-outline"
            label="App Version"
            subLabel="v1.0.0"
            showChevron={false}
            color="#333"
          />
          <SettingItem
            icon="logo-github"
            onPress={() =>
              openBrowserAsync("https://github.com/Evrayem3201b/manga-manger")
            }
            label="Source Code"
            color="#333"
          />
        </View>
      </ScrollView>
    </ScreenHug>
  );
}

const StatBox = ({ label, count, icon }: any) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={20} color={Colors.dark.primary} />
    <Text style={styles.statCount}>{count}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingItem = ({
  icon,
  label,
  subLabel,
  color,
  onPress,
  style,
  styleIcon,
  showChevron = true,
}: {
  icon: any;
  label: string;
  subLabel?: string;
  color: string;
  onPress?: () => void;
  style?: ViewStyle;
  styleIcon?: TextStyle;
  showChevron?: boolean;
}) => (
  <Pressable
    style={({ pressed }) => [
      styles.settingItem,
      style,
      { opacity: pressed ? 0.7 : 1 },
    ]}
    onPress={onPress}
  >
    <View
      style={[styles.iconContainer, { backgroundColor: color || "#1a1a1e" }]}
    >
      <Ionicons style={styleIcon} name={icon} size={20} color="#fff" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemLabel}>{label}</Text>
      {subLabel && <Text style={styles.itemSubLabel}>{subLabel}</Text>}
    </View>
    {showChevron && <Ionicons name="chevron-forward" size={18} color="#444" />}
  </Pressable>
);

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 40 },
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
    elevation: 5,
  },
  usernameInput: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    width: "80%",
  },
  savingText: {
    color: Colors.dark.primary,
    fontSize: 10,
    marginTop: 5,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginBottom: 30,
  },
  statBox: {
    alignItems: "center",
    backgroundColor: "#151518",
    padding: 15,
    borderRadius: 20,
    width: "28%",
    borderWidth: 1,
    borderColor: "#222",
  },
  statCount: { color: "#fff", fontSize: 18, fontWeight: "bold", marginTop: 5 },
  statLabel: {
    color: "#666",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  section: { width: "90%", alignSelf: "center", marginBottom: 25 },
  sectionLabel: {
    color: "#555",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151518",
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
