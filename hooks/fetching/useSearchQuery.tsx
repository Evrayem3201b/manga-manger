import { useQuery } from "@tanstack/react-query";
import { Manga } from "../../utils/types";

export function useSearchData(title: string) {
  return useQuery({
    queryKey: ["searchData", title],
    enabled: title.trim().length > 0,

    queryFn: async () => {
      const res = await fetch(
        `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&includes[]=cover_art`
      );
      if (!res.ok) throw new Error("Failed to fetch manga");

      const json = await res.json();
      return json.data as Manga[];
    },
  });
}
