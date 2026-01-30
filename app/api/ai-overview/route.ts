import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/api/tmdb";
import { openai } from "@/lib/api/openai";
import { MediaType } from "@/types";

/**
 * POST /api/ai-overview
 * Body: { type: "movie" | "tv", id: number }
 * 
 * Generate AI overview for a title using OpenAI
 * 
 * Cache: 7 days (regenerate only if user requests)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id } = body;

    if (!type || (type !== "movie" && type !== "tv")) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    if (!id || typeof id !== "number") {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Fetch TMDB data for context
    let title: string;
    let releaseDate: string | null;
    let runtime: number | null;
    let overview: string;
    let genres: string[];

    if (type === "movie") {
      const movieData = await tmdb.getMovie(id);
      title = movieData.title;
      releaseDate = movieData.release_date;
      runtime = movieData.runtime;
      overview = movieData.overview;
      genres = movieData.genres.map((g) => g.name);
    } else {
      const tvData = await tmdb.getTV(id);
      title = tvData.name;
      releaseDate = tvData.first_air_date;
      runtime = tvData.episode_run_time?.[0] || null;
      overview = tvData.overview;
      genres = tvData.genres.map((g) => g.name);
    }

    // Generate AI overview
    const aiOverview = await openai.generateOverview(
      title,
      type as MediaType,
      overview,
      genres,
      runtime,
      releaseDate
    );

    if (!aiOverview) {
      return NextResponse.json(
        { error: "Failed to generate AI overview" },
        { status: 500 }
      );
    }

    return NextResponse.json(aiOverview, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("AI Overview API error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI overview" },
      { status: 500 }
    );
  }
}
