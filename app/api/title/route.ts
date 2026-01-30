import { NextRequest, NextResponse } from "next/server";
import { tmdb } from "@/lib/api/tmdb";
import { watchmode, WatchmodeSource } from "@/lib/api/watchmode";
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

    console.log(`[API] /api/title called with type=${type}, id=${idParam}`);

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

    console.log(`[API] Fetching ${type} with ID ${id}`);

    // Fetch TMDB data
    let tmdbData: Awaited<ReturnType<typeof tmdb.getMovie>> | Awaited<ReturnType<typeof tmdb.getTV>>;
    if (type === "movie") {
      tmdbData = await tmdb.getMovie(id);
    } else {
      tmdbData = await tmdb.getTV(id);
    }

    // Get IMDb ID for OMDb and Watchmode
    const imdbId = tmdbData.external_ids?.imdb_id || null;
    console.log(`IMDb ID for ${type} ${id}:`, imdbId);

    // Fetch ratings from OMDb (if IMDb ID available)
    let imdbRating: string | null = null;
    let metascore: string | null = null;
    let rottenTomatoes: string | null = null;

    if (imdbId) {
      try {
        console.log(`Fetching ratings from OMDb for IMDb ID: ${imdbId}`);
        const ratings = await omdb.getRatings(imdbId);
        console.log("OMDb ratings response:", ratings);
        imdbRating = ratings.imdb;
        metascore = ratings.metacritic;
        rottenTomatoes = ratings.rottenTomatoes;
      } catch (error) {
        console.error("OMDb API error in route:", error);
      }
    } else {
      console.log("No IMDb ID found, skipping OMDb ratings fetch");
    }

    // Fetch watch availability from Watchmode and TMDB
    let watchAvailability: WatchAvailability = {
      streaming: [],
      rent: [],
      buy: [],
    };

    // Use TMDB as the primary source of truth for US availability
    // TMDB is more reliable for regional availability than Watchmode
    const tmdbProviderMap = new Map<string, {
      name: string;
      logoUrl: string | null;
      type: "streaming" | "rent" | "buy";
    }>();
    
    try {
      const tmdbProviders = type === "movie" 
        ? await tmdb.getMovieWatchProviders(id)
        : await tmdb.getTVWatchProviders(id);
      
      // Get US providers only - this is our source of truth
      // Strictly use only "US" region, no fallbacks
      const usProviders = tmdbProviders.results["US"];
      if (!usProviders) {
        console.log(`[API] No US providers found in TMDB. Available regions: ${Object.keys(tmdbProviders.results).join(", ")}`);
      } else {
        console.log(`[API] TMDB US providers found. Available regions: ${Object.keys(tmdbProviders.results).join(", ")}`);
        
        // Map streaming providers from TMDB - ONLY from US region
        if (usProviders.flatrate && Array.isArray(usProviders.flatrate)) {
          const providerNames = usProviders.flatrate.map(p => p.provider_name);
          console.log(`[API] TMDB US streaming providers (${providerNames.length}): ${providerNames.join(", ")}`);
          
          usProviders.flatrate.forEach((provider) => {
            const providerNameLower = provider.provider_name.toLowerCase();
            // Double-check: only add if we're in the US region block
            tmdbProviderMap.set(providerNameLower, {
              name: provider.provider_name,
              logoUrl: provider.logo_path 
                ? tmdb.getProviderLogoUrl(provider.logo_path, "w45")
                : null,
              type: "streaming"
            });
          });
        } else {
          console.log(`[API] No streaming providers in TMDB US region`);
        }
        // Map rent providers from TMDB
        if (usProviders.rent) {
          usProviders.rent.forEach((provider) => {
            const providerNameLower = provider.provider_name.toLowerCase();
            tmdbProviderMap.set(providerNameLower, {
              name: provider.provider_name,
              logoUrl: provider.logo_path 
                ? tmdb.getProviderLogoUrl(provider.logo_path, "w45")
                : null,
              type: "rent"
            });
          });
        }
        // Map buy providers from TMDB
        if (usProviders.buy) {
          usProviders.buy.forEach((provider) => {
            const providerNameLower = provider.provider_name.toLowerCase();
            tmdbProviderMap.set(providerNameLower, {
              name: provider.provider_name,
              logoUrl: provider.logo_path 
                ? tmdb.getProviderLogoUrl(provider.logo_path, "w45")
                : null,
              type: "buy"
            });
          });
        }
        console.log(`Found ${tmdbProviderMap.size} US providers from TMDB`);
      }
    } catch (error) {
      console.error("TMDB watch providers error:", error);
      // Continue without provider data
    }

    // Use Watchmode only to supplement with prices and deep links
    // But only for providers that TMDB confirms are available in US
    if (imdbId && tmdbProviderMap.size > 0) {
      try {
        console.log(`Fetching watch availability for IMDb ID: ${imdbId}`);
        const watchmodeData = await watchmode.getTitleByImdbId(imdbId);
        
        if (watchmodeData && watchmodeData.sources && Array.isArray(watchmodeData.sources)) {
          console.log(`Found ${watchmodeData.sources.length} total sources from Watchmode`);
          
          // Create a map of Watchmode sources by provider name (normalized)
          const watchmodeSourceMap = new Map<string, WatchmodeSource>();
          watchmodeData.sources.forEach((source) => {
            const sourceNameLower = source.name.toLowerCase();
            // Only include US region sources
            const region = source.region?.toUpperCase() || "";
            if (region === "US" || region === "USA") {
              // Store the first occurrence or prefer streaming over rent/buy
              if (!watchmodeSourceMap.has(sourceNameLower)) {
                watchmodeSourceMap.set(sourceNameLower, source);
              } else {
                const existing = watchmodeSourceMap.get(sourceNameLower)!;
                // Prefer streaming over rent/buy
                if (source.type === "sub" && existing.type !== "sub") {
                  watchmodeSourceMap.set(sourceNameLower, source);
                }
              }
            }
          });
          
          console.log(`Found ${watchmodeSourceMap.size} US sources from Watchmode`);
          
          // Build watch availability from TMDB providers, supplementing with Watchmode data
          tmdbProviderMap.forEach((tmdbProvider, providerNameLower) => {
            const watchmodeSource = watchmodeSourceMap.get(providerNameLower);
            
            // Try fuzzy matching if exact match not found
            let matchedWatchmodeSource = watchmodeSource;
            if (!matchedWatchmodeSource) {
              // Special handling for Apple TV variations
              if (providerNameLower.includes('apple tv')) {
                for (const [watchmodeName, source] of watchmodeSourceMap.entries()) {
                  const watchmodeLower = watchmodeName.toLowerCase();
                  if (watchmodeLower.includes('apple tv') || 
                      watchmodeLower === 'apple tv' ||
                      watchmodeLower === 'apple tv+' ||
                      watchmodeLower === 'apple tv plus') {
                    matchedWatchmodeSource = source;
                    break;
                  }
                }
              } else {
                // For other services, try fuzzy matching
                for (const [watchmodeName, source] of watchmodeSourceMap.entries()) {
                  if (providerNameLower.includes(watchmodeName) || watchmodeName.includes(providerNameLower)) {
                    matchedWatchmodeSource = source;
                    break;
                  }
                }
              }
            }
            
            // Construct deepLink if not provided by Watchmode
            let deepLink = matchedWatchmodeSource?.web_url || null;
            
            // Fallback: construct Apple TV+ link if available but no deepLink
            if (!deepLink && providerNameLower.includes('apple tv') && tmdbProvider.type === "streaming") {
              // Get title from tmdbData
              const title = type === "movie" 
                ? (tmdbData as Awaited<ReturnType<typeof tmdb.getMovie>>).title
                : (tmdbData as Awaited<ReturnType<typeof tmdb.getTV>>).name;
              // Apple TV+ search URL format
              const searchQuery = encodeURIComponent(title || "");
              deepLink = `https://tv.apple.com/search?q=${searchQuery}`;
              console.log(`[API] Constructed Apple TV+ fallback link for "${title}": ${deepLink}`);
            }
            
            const option = {
              provider: tmdbProvider.name,
              type: tmdbProvider.type,
              price: matchedWatchmodeSource?.price || null,
              deepLink: deepLink,
              logoUrl: tmdbProvider.logoUrl,
            };
            
            console.log(`[API] Adding provider: ${tmdbProvider.name} (type: ${tmdbProvider.type}), deepLink: ${deepLink ? 'YES' : 'NO'}`);

            if (option.type === "streaming") {
              watchAvailability.streaming.push(option);
            } else if (option.type === "rent") {
              watchAvailability.rent.push(option);
            } else if (option.type === "buy") {
              watchAvailability.buy.push(option);
            }
          });
          
          console.log(`Parsed availability: streaming=${watchAvailability.streaming.length}, rent=${watchAvailability.rent.length}, buy=${watchAvailability.buy.length}`);
        } else {
          console.log("No sources found in watchmode response");
        }
      } catch (error) {
        console.error("Watchmode API error:", error);
        // If Watchmode fails, still use TMDB data but construct fallback links for Apple TV
        tmdbProviderMap.forEach((tmdbProvider, providerNameLower) => {
          let deepLink: string | null = null;
          
          // Fallback: construct Apple TV+ link if available
          const providerLower = providerNameLower.toLowerCase();
          if (providerLower.includes('apple tv') && tmdbProvider.type === "streaming") {
            const title = type === "movie" 
              ? (tmdbData as Awaited<ReturnType<typeof tmdb.getMovie>>).title
              : (tmdbData as Awaited<ReturnType<typeof tmdb.getTV>>).name;
            const searchQuery = encodeURIComponent(title || "");
            deepLink = `https://tv.apple.com/search?q=${searchQuery}`;
            console.log(`[API] Watchmode failed, constructed Apple TV+ fallback link for "${title}": ${deepLink}`);
          }
          
          const option = {
            provider: tmdbProvider.name,
            type: tmdbProvider.type,
            price: null,
            deepLink: deepLink,
            logoUrl: tmdbProvider.logoUrl,
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
    } else if (tmdbProviderMap.size > 0) {
      // No IMDb ID but we have TMDB data - use it directly with fallback links for Apple TV
      tmdbProviderMap.forEach((tmdbProvider, providerNameLower) => {
        let deepLink: string | null = null;
        
        // Fallback: construct Apple TV+ link if available
        const providerLower = providerNameLower.toLowerCase();
        if (providerLower.includes('apple tv') && tmdbProvider.type === "streaming") {
          const title = type === "movie" 
            ? (tmdbData as Awaited<ReturnType<typeof tmdb.getMovie>>).title
            : (tmdbData as Awaited<ReturnType<typeof tmdb.getTV>>).name;
          const searchQuery = encodeURIComponent(title || "");
          deepLink = `https://tv.apple.com/search?q=${searchQuery}`;
          console.log(`[API] No IMDb ID, constructed Apple TV+ fallback link for "${title}": ${deepLink}`);
        }
        
        const option = {
          provider: tmdbProvider.name,
          type: tmdbProvider.type,
          price: null,
          deepLink: deepLink,
          logoUrl: tmdbProvider.logoUrl,
        };

        if (option.type === "streaming") {
          watchAvailability.streaming.push(option);
        } else if (option.type === "rent") {
          watchAvailability.rent.push(option);
        } else if (option.type === "buy") {
          watchAvailability.buy.push(option);
        }
      });
    } else {
      console.log("No US providers found from TMDB");
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
