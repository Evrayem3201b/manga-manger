import { CoverType, Manga } from "@/utils/types";
import { useQueries } from "@tanstack/react-query";

type CoverApiResponse = {
  result: string;
  response: string;
  data: CoverType;
};
export function useMangaCovers(mangaList: Manga[]) {
  return useQueries({
    queries: mangaList.map((manga) => {
      const coverRel = manga.relationships.find(
        (rel) => rel.type === "cover_art"
      );

      return {
        queryKey: ["cover", coverRel?.id],
        enabled: !!coverRel?.id,
        queryFn: async (): Promise<CoverType | null> => {
          if (!coverRel) return null;

          const res = await fetch(
            `https://api.mangadex.org/cover/${coverRel.id}`
          );
          console.log(
            "Fetching cover for manga:",
            manga.id,
            "cover id:",
            coverRel.id
          );

          if (!res.ok) {
            throw new Error("Failed to fetch cover");
          }

          const json: CoverApiResponse = await res.json();
          return json.data;
        },
      };
    }),
  });
}
