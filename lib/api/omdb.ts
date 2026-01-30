/**
 * OMDb API client
 * Handles IMDb, Metacritic, and Rotten Tomatoes ratings
 */

const OMDB_BASE_URL = "http://www.omdbapi.com";

export interface OMDbResponse {
  Response?: "True" | "False";
  Error?: string;
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
      console.error("OMDB_API_KEY is not set in environment variables");
      throw new Error("OMDB_API_KEY is not set");
    }
    console.log("OMDB_API_KEY is set (length:", this.apiKey.length, ")");
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
      console.log(`OMDb API request URL: ${url.replace(apiKey, '***')}`);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OMDb API error (${response.status}):`, errorText);
        // Don't throw, just return null values
        return {
          imdb: null,
          metacritic: null,
          rottenTomatoes: null,
        };
      }
      
      const data: OMDbResponse = await response.json();
      console.log("OMDb API response data:", JSON.stringify(data, null, 2));
      
      // Check for OMDb error response
      if (data.Response === "False") {
        console.error("OMDb API returned error:", data.Error);
        return {
          imdb: null,
          metacritic: null,
          rottenTomatoes: null,
        };
      }
      
      let rottenTomatoes: string | null = null;
      if (data.Ratings) {
        const rtRating = data.Ratings.find((r) => r.Source === "Rotten Tomatoes");
        if (rtRating && rtRating.Value && rtRating.Value !== "N/A") {
          rottenTomatoes = rtRating.Value.replace("%", "").trim();
        }
      }

      // Handle Metacritic - filter out "N/A" values
      let metacritic: string | null = null;
      if (data.Metascore && data.Metascore !== "N/A" && data.Metascore.trim() !== "") {
        metacritic = data.Metascore.trim();
      }

      // Handle IMDb rating - filter out "N/A" values
      let imdb: string | null = null;
      if (data.imdbRating && data.imdbRating !== "N/A" && data.imdbRating.trim() !== "") {
        imdb = data.imdbRating.trim();
      }

      return {
        imdb,
        metacritic,
        rottenTomatoes,
      };
    } catch (error: any) {
      console.error("OMDb API error:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
      });
      return {
        imdb: null,
        metacritic: null,
        rottenTomatoes: null,
      };
    }
  }
}

export const omdb = new OMDbApiClient();
