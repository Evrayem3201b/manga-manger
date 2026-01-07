import { useFilterStore } from "@/stores/category-store";
import { SearchDisplay, SimpleDisplay } from "@/utils/types";
import { router } from "expo-router";
import React from "react";
import { Dimensions, FlatList, Pressable, View, ViewStyle } from "react-native";
import Card from "./card";

const { width } = Dimensions.get("window");
const cardWidth = 170; // adjust this value according to your card width
const numColumns = Math.floor(width / cardWidth);

interface Props {
  search?: boolean;
  mangaSimple: SearchDisplay[] | SimpleDisplay[];
  style?: ViewStyle;
}

export default function CardContainer({ mangaSimple, style, search }: Props) {
  const filterKeyword = useFilterStore((state) => state.filter);
  return (
    <FlatList
      contentContainerStyle={{ paddingBottom: 80 }}
      key={`index-${numColumns}`}
      data={
        search
          ? (mangaSimple as SearchDisplay[])
          : (mangaSimple as SimpleDisplay[])
      }
      renderItem={({ item }) => {
        const activeFilter =
          filterKeyword === "all"
            ? "flex"
            : item.status === filterKeyword
              ? "flex"
              : "none";
        return (
          <Pressable
            key={item.id + "_" + item.name}
            onPress={() => {
              router.push(`/home/${item.id}`);
            }}
          >
            <View
              style={{
                width: width / numColumns,
                paddingBlock: 10,
                display: activeFilter,
              }}
            >
              <Card
                id={item.id}
                name={item.name}
                totalChap={item.totalChap}
                status={item.status}
                coverUrl={item.coverUrl}
                currentChap={item.currentChap}
              />
            </View>
          </Pressable>
        );
      }}
      numColumns={numColumns}
    />
  );
}
