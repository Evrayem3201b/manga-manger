import { Manga, SearchDisplay } from "@/utils/types";
import { ImageSourcePropType } from "react-native";
import { useSearchData } from "./useSearchQuery";

const FALLBACK_COVER = require("@/assets/images/example-cover.webp");

function buildCoverUrl(manga: Manga): ImageSourcePropType {
  const cover = manga.relationships.find(
    (rel): rel is any => rel.type === "cover_art"
  );

  if (!cover || !("attributes" in cover)) {
    return FALLBACK_COVER;
  }

  return {
    uri: `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`,
  };
}

export function useSearchManga(query: string) {
  const { data = [], isLoading, isFetching } = useSearchData(query);

  const results: SearchDisplay[] = data.map((manga) => ({
    id: manga.id,
    name:
      manga.attributes.title.en ??
      Object.values(manga.attributes.title)[0] ??
      "Unknown",
    status: manga.attributes.status,
    coverUrl: buildCoverUrl(manga),
    totalChap: Number(manga.attributes.lastChapter) || 0,
    currentChap: 0,
  }));

  return {
    results,
    isLoading,
    isFetching,
  };
}
