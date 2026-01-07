import { Colors } from "@/constants/theme";
import { useMangaDetails } from "@/hooks/fetching/mangaDetails/useMangaDetails";
import React, { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import Tag from "./tag";

const INITIAL_VISIBLE_TAGS = 5;

export default function MangaTemplate({ id }: { id: string }) {
  const { result, isLoading, genres } = useMangaDetails(id);
  const [expanded, setExpanded] = useState(false);
  const [expandedText, setExpandedText] = useState(false);
 
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
    <>
      <Image
        source={result?.coverUrl}
        style={{ width: 250, height: 350, borderRadius: 25 }}
      />

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
      <View></View>
    </>
  );
}
