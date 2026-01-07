import MangaTemplate from "@/components/MangaTemplate";
import ScreenHug from "@/components/ScreenHug";
import { useLocalSearchParams } from "expo-router";

import React from "react";

export default function MangaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <>
      <ScreenHug
        title={""}
        style={{
          paddingTop: 30,
          alignItems: "center",
          marginTop: -10,
          flexGrow: 1,
        }}
      >
        <MangaTemplate id={id} />
      </ScreenHug>
    </>
  );
}
