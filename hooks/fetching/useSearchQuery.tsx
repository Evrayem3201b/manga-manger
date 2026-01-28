import { useQuery } from "@tanstack/react-query";
import { Manga } from "../../utils/types";

export function useSearchData(
  title: string,
  limit: number,
  offset: number,
  includedTags: string[] = [],
  status: string | null = null,
) {
  return useQuery({
    queryKey: ["searchData", title, offset, includedTags, status],
    enabled: title.trim().length > 0,

    queryFn: async () => {
      // Build the URL with tags and status
      let url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&includes[]=cover_art&limit=${limit}&offset=${offset}`;

      if (includedTags.length > 0) {
        includedTags.forEach((tagId) => {
          url += `&includedTags[]=${tagId}`;
        });
      }

      if (status) {
        url += `&status[]=${status}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch manga");

      const json = await res.json();
      return { results: json.data as Manga[], total: json.total };
    },
  });
}
