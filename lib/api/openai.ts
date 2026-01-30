/**
 * OpenAI API client
 * Generates AI overviews for titles
 */

import OpenAI from "openai";

class OpenAIApiClient {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.client = new OpenAI({ apiKey });
    }
  }

  /**
   * Generate AI overview for a title
   */
  async generateOverview(
    title: string,
    type: "movie" | "tv",
    overview: string,
    genres: string[],
    runtime: number | null,
    year: string | null,
    keywords?: string[]
  ): Promise<{ overviewText: string; similarTitles: string[] } | null> {
    if (!this.client) {
      console.error("OpenAI client not initialized. OPENAI_API_KEY is not set.");
      return null;
    }

    try {
      const runtimeText = runtime ? `${runtime} minutes` : type === "tv" ? "TV series" : "";
      const yearText = year ? year.split("-")[0] : "";
      const keywordsText = keywords && keywords.length > 0 ? keywords.slice(0, 5).join(", ") : "";
      
      const prompt = `You are a helpful assistant that provides concise, spoiler-free overviews of movies and TV shows.

Title: ${title}
Type: ${type === "movie" ? "Movie" : "TV Show"}
Year: ${yearText}
Runtime: ${runtimeText}
Genres: ${genres.join(", ")}
${keywordsText ? `Keywords: ${keywordsText}` : ""}

Original Overview:
${overview}

Provide a 2-4 sentence overview that:
1. Is engaging and captures the essence of the title
2. Contains NO spoilers
3. Only uses information from the provided context (do not invent facts)
4. Is written in a natural, conversational tone
5. Is approximately 80-120 words

Then, suggest 3 similar titles that fans of this would enjoy, separated by commas.

Format your response as:
OVERVIEW: [your overview text]
SIMILAR: [title1, title2, title3]`;

      const completion = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that provides concise, spoiler-free overviews of movies and TV shows. Never include spoilers and only use information provided in the context.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }).catch((error) => {
        console.error("OpenAI API call failed:", error);
        throw error;
      });

      const content = completion.choices[0]?.message?.content || "";
      
      const overviewMatch = content.match(/OVERVIEW:\s*([\s\S]+?)(?=SIMILAR:|$)/);
      const similarMatch = content.match(/SIMILAR:\s*(.+)$/);

      const overviewText = overviewMatch?.[1]?.trim() || content.split("SIMILAR:")[0]?.trim() || overview;
      const similarText = similarMatch?.[1]?.trim() || "";
      const similarTitles = similarText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 3);

      return {
        overviewText,
        similarTitles,
      };
    } catch (error: any) {
      console.error("OpenAI API error:", error);
      console.error("OpenAI error details:", {
        message: error?.message,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        code: error?.code,
      });
      throw error; // Re-throw to let the route handler handle it
    }
  }
}

export const openai = new OpenAIApiClient();
