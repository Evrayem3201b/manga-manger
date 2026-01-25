import { useQuery } from "@tanstack/react-query";
import { Manga } from "../../utils/types";

export function useSearchData(title: string, limit: number, offset: number) {
  return useQuery({
    queryKey: ["searchData", title, offset],
    enabled: title.trim().length > 0,

    queryFn: async () => {
      const res = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&includes[]=cover_art&limit=${limit}&offset=${offset}`,
      );
      if (!res.ok) throw new Error("Failed to fetch manga");

      const json = await res.json();
      return { results: json.data as Manga[], total: json.total };
    },
  });
}
