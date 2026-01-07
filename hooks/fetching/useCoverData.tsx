import { useQuery } from "@tanstack/react-query";
import { CoverType } from "../../utils/types";

export function useCoverData(id: string) {
  return useQuery({
    queryKey: ["coverData", id],
    enabled: id.trim().length > 0,

    queryFn: async () => {
      const res = await fetch(`https://api.mangadex.org/cover/${id}`);
      if (!res.ok) throw new Error("Failed to fetch manga");

      const json = await res.json();
      return json.data as CoverType;
    },
  });
}
