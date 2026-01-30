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
   * Uses separate movie and TV search endpoints for better relevance
   */
  async search(query: string): Promise<TMDBSearchResult[]> {
    // Normalize query - trim and handle special characters
    const normalizedQuery = query.trim();
    
    // Search both movies and TV shows separately for better results
    const [movieData, tvData] = await Promise.all([
      this.fetch<{ results: TMDBSearchResult[] }>(
        `/search/movie?query=${encodeURIComponent(normalizedQuery)}&include_adult=false`
      ),
      this.fetch<{ results: TMDBSearchResult[] }>(
        `/search/tv?query=${encodeURIComponent(normalizedQuery)}&include_adult=false`
      )
    ]);

    // Combine results, marking media type
    const movieResults: TMDBSearchResult[] = movieData.results.map(result => ({
      ...result,
      media_type: "movie" as const,
      title: result.title,
    }));

    const tvResults: TMDBSearchResult[] = tvData.results.map(result => ({
      ...result,
      media_type: "tv" as const,
      name: result.name,
    }));

    // Combine results and prioritize exact/partial matches
    const allResults = [...movieResults, ...tvResults];
    
    // Sort by relevance: exact title matches first, then partial matches
    const queryLower = normalizedQuery.toLowerCase();
    const sorted = allResults.sort((a, b) => {
      const aTitle = (a.title || a.name || "").toLowerCase();
      const bTitle = (b.title || b.name || "").toLowerCase();
      
      const aStarts = aTitle.startsWith(queryLower);
      const bStarts = bTitle.startsWith(queryLower);
      const aContains = aTitle.includes(queryLower);
      const bContains = bTitle.includes(queryLower);
      
      // Prioritize titles that start with the query
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Then prioritize titles that contain the query
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;
      
      // Otherwise maintain TMDB's original order
      return 0;
    });
    
    // Return top 10 results
    return sorted.slice(0, 10);
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
   * Get watch providers for a movie
   */
  async getMovieWatchProviders(id: number): Promise<{
    results: Record<string, {
      link: string;
      flatrate?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
      rent?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
      buy?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
    }>;
  }> {
    return this.fetch(`/movie/${id}/watch/providers`);
  }

  /**
   * Get watch providers for a TV show
   */
  async getTVWatchProviders(id: number): Promise<{
    results: Record<string, {
      link: string;
      flatrate?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
      rent?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
      buy?: Array<{ logo_path: string; provider_id: number; provider_name: string }>;
    }>;
  }> {
    return this.fetch(`/tv/${id}/watch/providers`);
  }

  /**
   * Get provider logo URL
   */
  getProviderLogoUrl(logoPath: string | null, size: "w45" | "w92" | "w154" | "w185" | "w342" | "w500" = "w45"): string | null {
    if (!logoPath) return null;
    return `${TMDB_IMAGE_BASE}/${size}${logoPath}`;
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
