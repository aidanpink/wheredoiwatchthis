/**
 * Core type definitions for the application
 */

export type MediaType = "movie" | "tv";

export interface SearchResult {
  id: number;
  type: MediaType;
  title: string;
  releaseDate: string | null;
  posterUrl: string | null;
}

export interface TitleDetail {
  id: number;
  type: MediaType;
  title: string;
  overview: string;
  releaseDate: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: string[];
  runtime: number | null; // minutes for movies
  seasons: number | null; // for TV shows
  voteAverage: number; // TMDB rating
  imdbRating: string | null;
  metascore: string | null;
  rottenTomatoes: string | null;
  directors: string[];
  creators: string[]; // for TV shows
  cast: Array<{
    name: string;
    character: string;
    profileUrl: string | null;
  }>;
  trailerKey: string | null; // YouTube key
}

export interface WatchOption {
  provider: string;
  type: "streaming" | "rent" | "buy";
  price: string | null;
  deepLink: string | null;
  logoUrl: string | null;
}

export interface WatchAvailability {
  streaming: WatchOption[];
  rent: WatchOption[];
  buy: WatchOption[];
}

export interface AIOverview {
  overviewText: string;
  similarTitles: string[];
}

export interface TitleDetailResponse extends TitleDetail {
  watchAvailability: WatchAvailability;
  aiOverview: AIOverview | null;
}
