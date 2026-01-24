export const filters: Filter[] = [
  {
    name: "all",
    title: "All",
  },
  {
    name: "ongoing",
    title: "Ongoing",
  },
  {
    name: "completed",
    title: "Completed",
  },
  {
    name: "hiatus",
    title: "On Hold",
  },
  {
    name: "cancelled",
    title: "Cancelled",
  },
  {
    title: "Plan to read",
    name: "plan-to-read",
  },
  {
    name: "favorites",
    title: "Favorites",
  },
];

export type Filter = {
  name: UserFilter;
  title: string;
};

export const data: SimpleDisplay[] = [
  {
    id: "b1461071-bfbb-43e7-a5b6-a7ba5904649f",
    name: "Martial Peak",

    status: "plan-to-read",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "b1461071-bfbb-43e7-a5b6-a7ba5904649f",
    name: "Martial Peak",

    status: "plan-to-read",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "b1461071-bfbb-43e7-a5b6-a7ba5904649f",
    name: "Martial Peak",

    status: "plan-to-read",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "favorites",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "favorites",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "favorites",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },

  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "hiatus",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "ongoing",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "cancelled",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
  {
    id: "a1c7c817-4e59-43b7-9365-09675a149a6f",
    name: "One Piece",
    totalChap: 982,
    status: "cancelled",
    coverUrl: { uri: "@/assets/images/example-cover.webp" },
    currentChap: 567,
  },
];

export type LanguageMap = Record<string, string>;

export type SimpleDisplay = {
  id: string;
  name: string;
  totalChap?: number;
  status: MangaCategory;
  coverUrl: { uri: string };
  currentChap?: number;
  description?: string;
  year?: number;
  rating?: string;
  readingLink?: string;
  isFavourite?: boolean;
  isPlanToRead?: boolean;
};

export type MangaDB = {
  cover_url: string;
  created_at: number;
  current_chap: number;
  description: string;
  id: string;
  name: string;
  rating: null;
  status: MangaCategory;
  total_chap: number;
  reading_link: string;
  updated_at: number;
  year: number;
};

export type MangaCategory =
  | "ongoing"
  | "completed"
  | "hiatus"
  | "cancelled"
  | "plan-to-read"
  | "favorites";

export type UserFilter =
  | "all"
  | "ongoing"
  | "completed"
  | "hiatus"
  | "cancelled"
  | "plan-to-read"
  | "favorites";

export type UserMangaProgress = {
  mangaId: string;
  currentChapter: string;
  category: MangaCategory;
  lastUpdated: string;
};

export type LastChapter = {
  id: string;
  chapter: string; // string on purpose (1098, 1098.5, extra)
  publishedAt: string;
  language: string;
};

export interface Tag {
  id: string;
  type: "tag";
  attributes: {
    name: LanguageMap;
    description: LanguageMap;
    group: string;
    version: number;
  };
  relationships: any[]; // Can be refined if tag relationships are defined
}

export interface MangaLinks {
  al?: string;
  bw?: string;
  mu?: string;
  mal?: string;
  engtl?: string;
  [key: string]: string | undefined; // For other possible links
}

export type CoverType = {
  id: string;
  type: "cover_art";
  attributes: {
    fileName: string;
    description: string;
    volume: string;
    locale: string;
    createdAt: Date;
    updatedAt: Date;
    version: 1;
  };
  relationships: {
    id: string;
    type: string;
  }[];
};

export interface CoverRelationship {
  id: string;
  type: "cover_art";
  attributes: {
    fileName: string;
    description: string;
    volume: string | null;
    locale: string | null;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

export type MangaStatus = "ongoing" | "completed" | "hiatus" | "cancelled";
export type ContentRating = "safe" | "suggestive" | "erotica" | "pornographic";

export interface MangaAttributes {
  title: LanguageMap;
  altTitles: LanguageMap[];
  description: LanguageMap;
  isLocked: boolean;
  links: MangaLinks;
  officialLinks: MangaLinks | null;
  originalLanguage: string;
  lastVolume: string;
  lastChapter: string;

  publicationDemographic: string;
  status: MangaStatus;
  year: number;
  contentRating: ContentRating;
  tags: Tag[];
  state: "published" | "unpublished";
  chapterNumbersResetOnNewVolume: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  availableTranslatedLanguages: string[];
  latestUploadedChapter: string;
}

export type MangaRelationshipType = "author" | "artist" | "cover_art" | "manga";

export type MangaRelationship =
  | {
      id: string;
      type: "author" | "artist" | "manga";
      related?: string;
    }
  | CoverRelationship;

export interface Manga {
  id: string;
  type: "manga";
  attributes: MangaAttributes;
  relationships: MangaRelationship[];
}

export interface MangaWithCover {
  id: string;
  type: "manga";
  attributes: MangaAttributes;
  relationships: MangaRelationship[];
}

export interface MangaApiResponse {
  data: Manga[];
}
