import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/api/tmdb";
import { SearchResult } from "@/types";

/**
 * GET /api/search?q={query}
 * 
 * Search for movies and TV shows using TMDB multi-search
 * Returns top 7-10 mixed results
 * 
 * Cache: 5-15 minutes (edge/server cache)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const results = await tmdb.search(query);

    // Filter out person results and only keep movie/tv
    const filteredResults = results.filter(
      (result) => result.media_type === "movie" || result.media_type === "tv"
    );

    const searchResults: SearchResult[] = filteredResults.map((result) => {
      const title = result.media_type === "movie" ? result.title : result.name;
      const releaseDate =
        result.media_type === "movie"
          ? result.release_date
          : result.first_air_date;

      return {
        id: result.id,
        type: result.media_type,
        title: title || "Unknown",
        releaseDate: releaseDate || null,
        posterUrl: tmdb.getPosterUrl(result.poster_path, "w185"),
      };
    });

    return NextResponse.json(searchResults, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // Check if it's an API key error
    if (errorMessage.includes("TMDB_API_KEY")) {
      return NextResponse.json(
        { error: "TMDB API key is not configured. Please set TMDB_API_KEY in your .env.local file." },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to search titles: ${errorMessage}` },
      { status: 500 }
    );
  }
}
