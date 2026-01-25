import { Colors } from "@/constants/theme";
import { styles as GlobalStyles } from "@/styles/globalStyles";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import React, { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Signup() {
  const insets = useSafeAreaInsets();

  const router = useRouter();
  const db = useSQLiteContext();

  const [usernameInput, setUsernameInput] = useState<string | null>("");

  async function handleSignUpPress() {
    try {
      await db.runAsync(`INSERT OR REPLACE INTO "user" (username) VALUES (?)`, [
        usernameInput,
      ]);
      router.push("/(tabs)/home");
    } catch (e) {
      alert("Error");
    }
  }
  /* useEffect(() => {
    const username = AsyncStorage.getItem("username")
    if (username !== null){
      setUsernameInput(username)
    }
    
  }, []) */

  async function loadUsername() {
    const name: string | null = await db.getFirstAsync(
      `SELECT username FROM "user"`,
    );

    if (name) {
      setUsernameInput(name);
      router.push("/(tabs)/home");
    }
  }
  useEffect(() => {
    loadUsername();
  }, []);

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: Colors.dark.background,
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Image
        source={require("@/assets/images/M.png")}
        style={{ width: 90, height: 90 }}
        resizeMode="contain"
      />
      <View
        style={{
          marginTop: 80,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
        className="justify-center items-center"
      >
        {/* <View className="flex w-[70%] items-start flex-row justify-start text-left">
          <Text style={{ ...GlobalStyles.text, textAlign: "left" }}>
            Username
          </Text>
        </View> */}
        <TextInput
          style={{ ...GlobalStyles.input, width: "70%" }}
          placeholder="Username"
          placeholderTextColor={GlobalStyles.mutedText.color}
          value={usernameInput}
          onChangeText={(text) => {
            setUsernameInput(text);
          }}
        />
        <View style={{ width: "70%", paddingTop: 10 }}>
          <TouchableOpacity
            disabled={usernameInput === ""}
            style={{ ...GlobalStyles.buttonPrimary }}
            onPress={handleSignUpPress}
          >
            <Text>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
