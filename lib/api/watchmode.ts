/**
 * Watchmode API client
 * Handles streaming availability data
 */

const WATCHMODE_BASE_URL = "https://api.watchmode.com/v1";

export interface WatchmodeSource {
  name: string;
  type: "sub" | "rent" | "buy";
  price: string | null;
  web_url: string | null;
  format: string | null;
  region: string;
}

export interface WatchmodeTitle {
  title: string;
  sources: WatchmodeSource[];
}

class WatchmodeApiClient {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.WATCHMODE_API_KEY || null;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      console.error("WATCHMODE_API_KEY is not set in environment variables");
      throw new Error("WATCHMODE_API_KEY is not set");
    }
    console.log("WATCHMODE_API_KEY is set (length:", this.apiKey.length, ")");
    return this.apiKey;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const apiKey = this.getApiKey();
    const url = `${WATCHMODE_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}apiKey=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Watchmode API error (${response.status}):`, errorText);
        throw new Error(`Watchmode API error: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Watchmode fetch error:", error);
      throw error;
    }
  }

  /**
   * Search for title by name and year
   */
  async searchByTitle(title: string, year?: number): Promise<WatchmodeTitle | null> {
    try {
      const query = year ? `${title} ${year}` : title;
      const data = await this.fetch<{ title_results: Array<{ id: number; name: string; year: number }> }>(
        `/autocomplete-search/?search_value=${encodeURIComponent(query)}&search_type=2`
      );
      
      if (!data.title_results || data.title_results.length === 0) {
        return null;
      }

      // Get the first result's details
      const titleId = data.title_results[0].id;
      return this.getTitleDetails(titleId);
    } catch (error) {
      console.error("Watchmode search error:", error);
      return null;
    }
  }

  /**
   * Get title details by Watchmode ID
   */
  async getTitleDetails(titleId: number): Promise<WatchmodeTitle | null> {
    try {
      const data = await this.fetch<{ title: WatchmodeTitle }>(
        `/title/${titleId}/sources/`
      );
      return data.title || null;
    } catch (error) {
      console.error("Watchmode getTitleDetails error:", error);
      return null;
    }
  }

  /**
   * Get title by IMDb ID
   * Watchmode API: /title/{imdb_id}/sources/ returns an array of sources directly
   */
  async getTitleByImdbId(imdbId: string): Promise<WatchmodeTitle | null> {
    try {
      // Watchmode API expects IMDb ID with 'tt' prefix
      // First try to find the title by searching, then get sources
      const searchData = await this.fetch<{ title_results: Array<{ id: number; name: string; imdb_id: string }> }>(
        `/autocomplete-search/?search_value=${imdbId}&search_type=2`
      );
      
      if (searchData.title_results && searchData.title_results.length > 0) {
        // Found a match, get sources by Watchmode title ID
        const titleId = searchData.title_results[0].id;
        const sources = await this.fetch<WatchmodeSource[]>(
          `/title/${titleId}/sources/?source_types=sub,rent,buy`
        );
        
        if (Array.isArray(sources) && sources.length > 0) {
          return {
            title: searchData.title_results[0].name,
            sources: sources,
          };
        }
      }
      
      // If search didn't work, try direct IMDb ID lookup (some titles might work this way)
      try {
        const sources = await this.fetch<WatchmodeSource[]>(
          `/title/${imdbId}/sources/?source_types=sub,rent,buy`
        );
        
        if (Array.isArray(sources) && sources.length > 0) {
          return {
            title: "",
            sources: sources,
          };
        }
      } catch (directError) {
        // Direct lookup failed, that's okay
        console.log("Direct IMDb ID lookup failed, tried search method");
      }
      
      return null;
    } catch (error) {
      console.error("Watchmode getTitleByImdbId error:", error);
      return null;
    }
  }
}

export const watchmode = new WatchmodeApiClient();
