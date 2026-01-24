import { Manga, SimpleDisplay } from "@/utils/types";
import { useSearchData } from "./useSearchQuery";

function buildCoverUrl(manga: Manga): { uri: string } {
  const cover = manga.relationships.find(
    (rel): rel is any => rel.type === "cover_art",
  );

  return {
    uri: `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`,
  };
}

export function useSearchManga(query: string) {
  const { data = [], isLoading, isFetching } = useSearchData(query);

  const results: SimpleDisplay[] = data.map((manga) => ({
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
