import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/api/tmdb";
import { watchmode } from "@/lib/api/watchmode";
import { omdb } from "@/lib/api/omdb";
import { TitleDetailResponse, WatchAvailability, MediaType } from "@/types";

/**
 * GET /api/title?type={movie|tv}&id={tmdbId}
 * 
 * Get comprehensive title details including:
 * - TMDB metadata
 * - Watchmode streaming availability
 * - OMDb ratings (IMDb, Metacritic, Rotten Tomatoes)
 * 
 * Cache: 24 hours for title details, 6-24 hours for watch availability
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") as MediaType;
    const idParam = searchParams.get("id");

    if (!type || (type !== "movie" && type !== "tv")) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'movie' or 'tv'" },
        { status: 400 }
      );
    }

    if (!idParam) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    const id = parseInt(idParam, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    // Fetch TMDB data
    let tmdbData: Awaited<ReturnType<typeof tmdb.getMovie>> | Awaited<ReturnType<typeof tmdb.getTV>>;
    if (type === "movie") {
      tmdbData = await tmdb.getMovie(id);
    } else {
      tmdbData = await tmdb.getTV(id);
    }

    // Get IMDb ID for OMDb and Watchmode
    const imdbId = tmdbData.external_ids?.imdb_id || null;

    // Fetch ratings from OMDb (if IMDb ID available)
    let imdbRating: string | null = null;
    let metascore: string | null = null;
    let rottenTomatoes: string | null = null;

    if (imdbId) {
      const ratings = await omdb.getRatings(imdbId);
      imdbRating = ratings.imdb;
      metascore = ratings.metacritic;
      rottenTomatoes = ratings.rottenTomatoes;
    }

    // Fetch watch availability from Watchmode
    let watchAvailability: WatchAvailability = {
      streaming: [],
      rent: [],
      buy: [],
    };

    if (imdbId) {
      try {
        const watchmodeData = await watchmode.getTitleByImdbId(imdbId);
        if (watchmodeData && watchmodeData.sources) {
          watchmodeData.sources.forEach((source) => {
            const option = {
              provider: source.name,
              type:
                source.type === "sub"
                  ? ("streaming" as const)
                  : (source.type as "rent" | "buy"),
              price: source.price || null,
              deepLink: source.web_url || null,
              logoUrl: null, // Watchmode doesn't provide logos
            };

            if (option.type === "streaming") {
              watchAvailability.streaming.push(option);
            } else if (option.type === "rent") {
              watchAvailability.rent.push(option);
            } else if (option.type === "buy") {
              watchAvailability.buy.push(option);
            }
          });
        }
      } catch (error) {
        console.error("Watchmode API error:", error);
        // Continue without watch availability
      }
    }

    // Extract cast and crew
    const cast =
      tmdbData.credits?.cast
        .slice(0, 10)
        .map((actor) => ({
          name: actor.name,
          character: actor.character,
          profileUrl: tmdb.getProfileUrl(actor.profile_path),
        })) || [];

    const directors =
      type === "movie"
        ? tmdbData.credits?.crew
            .filter((person) => person.job === "Director")
            .map((person) => person.name) || []
        : [];

    const creators =
      type === "tv"
        ? ((tmdbData as Awaited<ReturnType<typeof tmdb.getTV>>).created_by?.map((creator) => creator.name) ||
          [])
        : [];

    // Extract trailer
    const trailer =
      tmdbData.videos?.results.find(
        (video) => video.type === "Trailer" && video.site === "YouTube"
      )?.key || null;

    // Build response
    let title: string;
    let releaseDate: string | null;
    let runtime: number | null;
    let seasons: number | null;

    if (type === "movie") {
      const movieData = tmdbData as Awaited<ReturnType<typeof tmdb.getMovie>>;
      title = movieData.title;
      releaseDate = movieData.release_date;
      runtime = movieData.runtime;
      seasons = null;
    } else {
      const tvData = tmdbData as Awaited<ReturnType<typeof tmdb.getTV>>;
      title = tvData.name;
      releaseDate = tvData.first_air_date;
      runtime = tvData.episode_run_time?.[0] || null;
      seasons = tvData.number_of_seasons;
    }

    const response: TitleDetailResponse = {
      id: tmdbData.id,
      type,
      title,
      overview: tmdbData.overview,
      releaseDate,
      posterUrl: tmdb.getPosterUrl(tmdbData.poster_path, "w500"),
      backdropUrl: tmdb.getBackdropUrl(tmdbData.backdrop_path),
      genres: tmdbData.genres.map((g) => g.name),
      runtime,
      seasons,
      voteAverage: tmdbData.vote_average,
      imdbRating,
      metascore,
      rottenTomatoes,
      directors,
      creators,
      cast,
      trailerKey: trailer,
      watchAvailability,
      aiOverview: null, // Will be fetched separately
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=43200",
      },
    });
  } catch (error) {
    console.error("Title API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch title details" },
      { status: 500 }
    );
  }
}
