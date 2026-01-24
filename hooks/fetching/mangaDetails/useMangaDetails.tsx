import { MangaWithCover, SimpleDisplay } from "@/utils/types";
import { useMangaQuery } from "./useMangaQuery";

const FALLBACK_COVER = require("@/assets/images/example-cover.webp");

function buildCoverUrl(manga: MangaWithCover): string {
  const cover = manga.relationships.find(
    (rel): rel is any => rel.type === "cover_art"
  );

  if (!cover || !("attributes" in cover)) {
    return FALLBACK_COVER;
  }

  return `https://uploads.mangadex.org/covers/${manga.id}/${cover.attributes.fileName}.512.jpg`;
}

export function useMangaDetails(id: string) {
  const { data, isLoading, isFetching } = useMangaQuery(id);

  const result:
    | (SimpleDisplay & {
        description: string;
        year: number | null;
        rating: string | null;
      })
    | null = data
    ? {
        id: data.id,
        name:
          data.attributes.title.en ??
          Object.values(data.attributes.title)[0] ??
          "Unknown",
        status: data.attributes.status,
        coverUrl: { uri: buildCoverUrl(data) },
        totalChap: Number(data.attributes.lastChapter) || 0,
        description:
          data.attributes.description.en ||
          Object.values(data.attributes.description)[0] ||
          "No description available.",
        currentChap: 0,
        year: data.attributes.year || null,
        rating: data.attributes.contentRating || null,
      }
    : null;
  const genres = data ? data?.attributes.tags : null;

  return {
    result,
    isLoading,
    isFetching,
    genres,
  };
}
