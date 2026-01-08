import MangaTemplate from "@/components/MangaTemplate";
import { useLocalSearchParams } from "expo-router";

import React from "react";

export default function MangaDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MangaTemplate id={id} />;
}
