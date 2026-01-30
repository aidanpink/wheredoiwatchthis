/**
 * OMDb API client
 * Handles IMDb, Metacritic, and Rotten Tomatoes ratings
 */

const OMDB_BASE_URL = "http://www.omdbapi.com";

export interface OMDbResponse {
  imdbRating?: string;
  Metascore?: string;
  Ratings?: Array<{
    Source: string;
    Value: string;
  }>;
}

class OMDbApiClient {
  private apiKey: string | null;

  constructor() {
    this.apiKey = process.env.OMDB_API_KEY || null;
  }

  private getApiKey(): string {
    if (!this.apiKey) {
      throw new Error("OMDB_API_KEY is not set");
    }
    return this.apiKey;
  }

  /**
   * Get ratings by IMDb ID
   */
  async getRatings(imdbId: string): Promise<{
    imdb: string | null;
    metacritic: string | null;
    rottenTomatoes: string | null;
  }> {
    try {
      const apiKey = this.getApiKey();
      const url = `${OMDB_BASE_URL}/?i=${imdbId}&apikey=${apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`OMDb API error: ${response.statusText}`);
      }
      
      const data: OMDbResponse = await response.json();
      
      let rottenTomatoes: string | null = null;
      if (data.Ratings) {
        const rtRating = data.Ratings.find((r) => r.Source === "Rotten Tomatoes");
        if (rtRating) {
          rottenTomatoes = rtRating.Value.replace("%", "");
        }
      }

      return {
        imdb: data.imdbRating || null,
        metacritic: data.Metascore || null,
        rottenTomatoes,
      };
    } catch (error) {
      console.error("OMDb API error:", error);
      return {
        imdb: null,
        metacritic: null,
        rottenTomatoes: null,
      };
    }
  }
}

export const omdb = new OMDbApiClient();
