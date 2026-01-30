import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search/SearchBar";
import { AIOverview } from "@/components/title/AIOverview";
import { WhereToWatch } from "@/components/title/WhereToWatch";
import { Ratings } from "@/components/title/Ratings";
import { Details } from "@/components/title/Details";
import { Trailer } from "@/components/title/Trailer";
import { MediaType } from "@/types";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{
    type: string;
    id: string;
  }>;
}

async function getTitleDetails(type: string, id: string) {
  try {
    // Use absolute URL for server-side fetch
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    
    const response = await fetch(
      `${baseUrl}/api/title?type=${type}&id=${id}`,
      {
        next: { revalidate: 86400 }, // Cache for 24 hours
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("Failed to fetch title details:", error);
    return null;
  }
}

export default async function TitleDetailPage({ params }: PageProps) {
  const { type, id } = await params;

  if (type !== "movie" && type !== "tv") {
    notFound();
  }

  const titleData = await getTitleDetails(type, id);

  if (!titleData) {
    notFound();
  }

  const formatYear = (date: string | null) => {
    if (!date) return null;
    return new Date(date).getFullYear().toString();
  };

  const formatRuntime = (runtime: number | null, seasons: number | null) => {
    if (type === "movie") {
      if (!runtime) return null;
      const hours = Math.floor(runtime / 60);
      const mins = runtime % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    } else {
      return seasons ? `${seasons} ${seasons === 1 ? "season" : "seasons"}` : null;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Top Bar */}
      <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-zinc-50 truncate">
                {titleData.title} ({formatYear(titleData.releaseDate) || "Unknown"})
              </h1>
              <p className="text-sm text-zinc-400">
                {type === "movie" ? "Movie" : "TV"} •{" "}
                {formatRuntime(titleData.runtime, titleData.seasons) || "Unknown"} •{" "}
                {titleData.genres.join(", ")}
              </p>
            </div>
          </div>
          <SearchBar className="max-w-none" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* AI Overview */}
          <AIOverview
            type={type as MediaType}
            id={parseInt(id, 10)}
            fallbackOverview={titleData.overview}
          />

          {/* Grid of Tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <WhereToWatch watchAvailability={titleData.watchAvailability} />
            <Ratings
              tmdb={titleData.voteAverage}
              imdb={titleData.imdbRating}
              metacritic={titleData.metascore}
              rottenTomatoes={titleData.rottenTomatoes}
            />
            <Details
              type={type as MediaType}
              releaseDate={titleData.releaseDate}
              runtime={titleData.runtime}
              seasons={titleData.seasons}
              genres={titleData.genres}
              directors={titleData.directors}
              creators={titleData.creators}
              cast={titleData.cast}
            />
            <Trailer trailerKey={titleData.trailerKey} />
          </div>
        </div>
      </div>
    </div>
  );
}
