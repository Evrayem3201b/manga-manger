import { MangaWithCover } from "@/utils/types";
import { useQuery } from "@tanstack/react-query";

export function useMangaQuery(id: string) {
  return useQuery({
    queryKey: ["mangaData", id],
    enabled: id.trim().length > 0,

    queryFn: async () => {
      const res = await fetch(
        `https://api.mangadex.org/manga/${id}?includes[]=cover_art`
      );
      if (!res.ok) throw new Error("Failed to fetch manga");

      const json = await res.json();
      return json.data as MangaWithCover; // ✅ SINGLE OBJECT
    },
  });
}
