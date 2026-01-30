/**
 * TMDB API client
 * Handles search and metadata retrieval
 */

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMovie {
  id: number;
  title: string;
  release_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast: Array<{
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      name: string;
      job: string;
    }>;
  };
  videos?: {
    results: Array<{
      key: string;
      type: string;
      site: string;
    }>;
  };
  external_ids?: {
    imdb_id: string | null;
  };
}

export interface TMDBSeries {
  id: number;
  name: string;
  first_air_date: string | null;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  episode_run_time: number[];
  number_of_seasons: number;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast: Array<{
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      name: string;
      job: string;
    }>;
  };
  videos?: {
    results: Array<{
      key: string;
      type: string;
      site: string;
    }>;
  };
  external_ids?: {
    imdb_id: string | null;
  };
  created_by?: Array<{
    name: string;
  }>;
}

export interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  release_date?: string | null;
  first_air_date?: string | null;
  poster_path: string | null;
}

class TMDBApiClient {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY || null;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error("TMDB_API_KEY is not set");
    }
    return this.apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const apiKey = this.getApiKey();
    const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Search for movies and TV shows
   */
  async search(query: string): Promise<TMDBSearchResult[]> {
    const data = await this.fetch<{ results: TMDBSearchResult[] }>(
      `/search/multi?query=${encodeURIComponent(query)}&include_adult=false`
    );
    return data.results.slice(0, 10);
  }

  /**
   * Get movie details
   */
  async getMovie(id: number): Promise<TMDBMovie> {
    return this.fetch<TMDBMovie>(
      `/movie/${id}?append_to_response=credits,videos,external_ids`
    );
  }

  /**
   * Get TV show details
   */
  async getTV(id: number): Promise<TMDBSeries> {
    return this.fetch<TMDBSeries>(
      `/tv/${id}?append_to_response=credits,videos,external_ids`
    );
  }

  /**
   * Get poster URL
   */
  getPosterUrl(path: string | null, size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w500"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  /**
   * Get backdrop URL
   */
  getBackdropUrl(path: string | null, size: "w300" | "w780" | "w1280" | "original" = "w1280"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }

  /**
   * Get profile URL
   */
  getProfileUrl(path: string | null, size: "w45" | "w185" | "h632" | "original" = "w185"): string | null {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  }
}

export const tmdb = new TMDBApiClient();
