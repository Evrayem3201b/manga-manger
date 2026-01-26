import { Manga, SimpleDisplay } from "@/utils/types";
import { useSearchData } from "./useSearchQuery";

function buildCoverUrl(manga: Manga): { uri: string } {
  const cover = manga.relationships?.find(
    (rel): rel is any => rel.type === "cover_art",
  );

  // Fallback if cover art is missing from relationships
  if (!cover?.attributes?.fileName) {
    return require("@/assets/images/example-cover.webp");
  }

  return {
    uri: `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`,
  };
}

export function useSearchManga(query: string, limit = 20, offset = 0) {
  // Use the destructuring to match your useSearchData return structure
  const { data, isLoading, isFetching } = useSearchData(query, limit, offset);

  // Since data is { results: Manga[], total: number } or undefined
  const results: SimpleDisplay[] = (data?.results ?? []).map(
    (manga: Manga) => ({
      id: manga.id,
      name:
        manga.attributes.title.en ??
        Object.values(manga.attributes.title)[0] ??
        "Unknown",
      status: manga.attributes.status,
      coverUrl: buildCoverUrl(manga),
      // MangaDex uses strings for chapter numbers; handle properly
      totalChap: parseInt(manga.attributes.lastChapter || "0", 10),
      currentChap: 0,
      isAdult:
        manga.attributes.tags?.some(
          (tag) =>
            tag.attributes?.name?.en?.toLowerCase() === "adult" ||
            tag.attributes?.name?.en?.toLowerCase() === "hentai" ||
            tag.attributes?.name?.en?.toLowerCase() === "erotica" ||
            tag.attributes?.name?.en?.toLowerCase() === "sexual violence" ||
            tag.attributes?.name?.en?.toLowerCase() === "nsfw",
        ) || false,
    }),
  );

  return {
    results,
    isLoading,
    isFetching,
    total: data?.total ?? 0,
  };
}
