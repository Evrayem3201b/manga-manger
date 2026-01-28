import { Manga, SimpleDisplay } from "@/utils/types";
import { useSearchData } from "./useSearchQuery";

function buildCoverUrl(manga: Manga): { uri: string } {
  const cover = manga.relationships?.find(
    (rel): rel is any => rel.type === "cover_art",
  );

  if (!cover?.attributes?.fileName) {
    return require("@/assets/images/example-cover.webp");
  }

  return {
    uri: `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`,
  };
}

export function useSearchManga(
  query: string,
  limit = 40, // Increased limit for better local filtering
  offset = 0,
) {
  const { data, isLoading, isFetching } = useSearchData(query, limit, offset);

  const results: (SimpleDisplay & { genres: string[] })[] = (
    data?.results ?? []
  ).map((manga: Manga) => ({
    id: manga.id,
    name:
      manga.attributes.title.en ??
      Object.values(manga.attributes.title)[0] ??
      "Unknown",
    status: manga.attributes.status,
    coverUrl: buildCoverUrl(manga),
    totalChap: parseInt(manga.attributes.lastChapter || "0", 10),
    currentChap: 0,
    isAdult:
      manga.attributes.tags?.some((tag) =>
        ["adult", "hentai", "erotica", "sexual violence", "sexual"].includes(
          tag.attributes?.name?.en?.toLowerCase() || "",
        ),
      ) || false,
    // Map MangaDex tags to simple strings for local filtering
    genres: manga.attributes.tags.map((t) => t.attributes.name.en),
  }));

  return {
    results,
    isLoading,
    isFetching,
    total: data?.total ?? 0,
  };
}
