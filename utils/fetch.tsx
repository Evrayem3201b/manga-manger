import { Manga } from "./types";

export default function GetMangaData() {
  const dummyManga: Manga[] = [
    {
      id: "a96676e5-8ae2-425e-b549-7f15dd34a6d8",
      title: "One Piece",
      coverUrl:
        "https://uploads.mangadex.org/covers/a96676e5-8ae2-425e-b549-7f15dd34a6d8/onepiece.jpg",
      status: "ongoing",
      genres: ["Action", "Adventure", "Fantasy"],
    },
    {
      id: "b6a08b2f-41d9-4f6b-a25b-5f5a74e5db45",
      title: "Attack on Titan",
      coverUrl:
        "https://uploads.mangadex.org/covers/b6a08b2f-41d9-4f6b-a25b-5f5a74e5db45/aot.jpg",
      status: "completed",
      genres: ["Action", "Drama", "Dark Fantasy"],
    },
    {
      id: "eaa7a00b-5a06-4fd0-bf46-7e33b5b25f9e",
      title: "Jujutsu Kaisen",
      coverUrl:
        "https://uploads.mangadex.org/covers/eaa7a00b-5a06-4fd0-bf46-7e33b5b25f9e/jjk.jpg",
      status: "ongoing",
      genres: ["Action", "Supernatural"],
    },
  ];

  return dummyManga;
}
