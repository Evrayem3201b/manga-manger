import { Colors } from "@/constants/theme";
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import { getStatusFromName } from "@/utils/getStatus";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Badge from "./badge";
import ScreenHug from "./ScreenHug";
import Tag from "./tag";
import { ThemedText } from "./themed-text";
import { Button } from "./ui/button";

const INITIAL_VISIBLE_TAGS = 5;

export default function MangaTemplate({
  id,
  addBtn,
}: {
  id: string;
  addBtn: boolean;
}) {
  const { result, isLoading, genres } = useMangaDetails(id);
  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
  const [query, setQuery] = useState(String(result?.currentChap || ""));

  if (isLoading) {
    return <ActivityIndicator size="large" color={Colors.dark.text} />;
  }

  const visibleGenres = expanded
    ? genres
    : genres?.slice(0, INITIAL_VISIBLE_TAGS);

  const hiddenCount =
    genres && genres.length > INITIAL_VISIBLE_TAGS
      ? genres.length - INITIAL_VISIBLE_TAGS
      : 0;

  return (
    <ScreenHug
      title={""}
      style={{
        paddingTop: 30,
        alignItems: "center",
        marginTop: -10,
      }}
    >
      <View style={{ position: "relative" }}>
        <Badge status={getStatusFromName(result?.status || "ongoing")} />
        <Image
          source={result?.coverUrl}
          style={{ width: 250, height: 350, borderRadius: 25 }}
        />
        <LinearGradient
          colors={[
            "rgba(0,0,0,0.75)", // bottom (black)
            "rgba(0,0,0,0.0)", // top (transparent)
          ]}
          start={{ x: 0.5, y: 1 }}
          end={{ x: 0.5, y: 0.8 }}
          style={{ ...StyleSheet.absoluteFillObject }}
        />
      </View>

      <Text
        style={{
          marginTop: 20,
          fontSize: 40,
          textAlign: "center",
          fontFamily: "ni",
          color: Colors.dark.text,
        }}
      >
        {result?.name}
      </Text>

      <View
        style={{
          flexWrap: "wrap",
          flexDirection: "row",
          gap: 6,
          marginTop: 20,
          width: "80%",
          justifyContent: "center",
        }}
      >
        {visibleGenres?.map((tag: any) => {
          const genre = tag.attributes.name.en;
          return <Tag title={genre} key={tag.id} />;
        })}

        {/* 🔥 SHOW MORE / LESS BUTTON */}
        {!expanded && hiddenCount > 0 && (
          <Pressable onPress={() => setExpanded(true)}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text
                style={{
                  color: Colors.dark.text,
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                +{hiddenCount} more
              </Text>
            </View>
          </Pressable>
        )}

        {expanded && (
          <Pressable onPress={() => setExpanded(false)}>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.25)",
              }}
            >
              <Text
                style={{
                  color: Colors.dark.text,
                  fontSize: 13,
                  opacity: 0.85,
                }}
              >
                Show less
              </Text>
            </View>
          </Pressable>
        )}
      </View>

      <Pressable
        onPress={() => setExpandedText(!expandedText)}
        style={{ marginTop: 20, width: "90%" }}
      >
        <Text
          numberOfLines={expandedText ? undefined : 2}
          style={{
            color: Colors.dark.mutedForeground,
            fontSize: 14,
            lineHeight: 20,
          }}
        >
          {result?.description}
        </Text>
      </Pressable>
      <View style={{ marginTop: 70, width: "90%" }}>
        <ThemedText
          lightColor={"#999"}
          style={{ fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}
        >
          Current chapter
        </ThemedText>
        <View style={styles.searchBox}>
          <TextInput
            keyboardType="numeric"
            placeholder="Enter chapter..."
            placeholderTextColor="#999"
            style={styles.input}
            value={query}
            onChangeText={(text) => setQuery(text)}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </Pressable>
          )}
        </View>
      </View>
      {/* <View style={{ marginTop: 0, width: "90%" }}>
        <ThemedText
          lightColor={"#999"}
          style={{ fontSize: 14, marginBottom: 8, textTransform: "uppercase" }}
        >
          Current chapter
        </ThemedText>
        <View style={styles.searchBox}>
          <TextInput
            keyboardType="numeric"
            placeholder="Enter chapter..."
            placeholderTextColor="#999"
            style={styles.input}
            value={query}
            onChangeText={(text) => setQuery(text)}
          />

          <Ionicons name="chevron-down" size={18} color="#999" />
        </View>
      </View> */}
      <Button
        style={{
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
          marginBlock: 10,
          borderRadius: 20,
          backgroundColor: Colors.dark.primary,
        }}
        textStyle={{
          textAlign: "center",
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
        }}
      >
        Save progress
      </Button>
    </ScreenHug>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 16,

    backgroundColor: "#1a1a1e", // elevated dark surface
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",

    marginBottom: 24,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#f5f5f7", // primary text
  },
});
