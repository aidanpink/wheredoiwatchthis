"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MediaType } from "@/types";

interface DetailsProps {
  type: MediaType;
  releaseDate: string | null;
  runtime: number | null;
  seasons: number | null;
  genres: string[];
  directors: string[];
  creators: string[];
  cast: Array<{
    name: string;
    character: string;
  }>;
}

export function Details({
  type,
  releaseDate,
  runtime,
  seasons,
  genres,
  directors,
  creators,
  cast,
}: DetailsProps) {
  const formatDate = (date: string | null) => {
    if (!date) return "Unknown";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatRuntime = (minutes: number | null) => {
    if (!minutes) return "Unknown";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-sm text-zinc-400">Release Date</span>
          <p className="text-sm text-zinc-300 mt-1">{formatDate(releaseDate)}</p>
        </div>

        <Separator />

        <div>
          <span className="text-sm text-zinc-400">
            {type === "movie" ? "Runtime" : "Seasons"}
          </span>
          <p className="text-sm text-zinc-300 mt-1">
            {type === "movie"
              ? formatRuntime(runtime)
              : seasons
              ? `${seasons} ${seasons === 1 ? "season" : "seasons"}`
              : "Unknown"}
          </p>
        </div>

        <Separator />

        <div>
          <span className="text-sm text-zinc-400">Genres</span>
          <p className="text-sm text-zinc-300 mt-1">{genres.join(", ") || "Unknown"}</p>
        </div>

        <Separator />

        {type === "movie" && directors.length > 0 && (
          <>
            <div>
              <span className="text-sm text-zinc-400">Director{directors.length > 1 ? "s" : ""}</span>
              <p className="text-sm text-zinc-300 mt-1">{directors.join(", ")}</p>
            </div>
            <Separator />
          </>
        )}

        {type === "tv" && creators.length > 0 && (
          <>
            <div>
              <span className="text-sm text-zinc-400">Creator{creators.length > 1 ? "s" : ""}</span>
              <p className="text-sm text-zinc-300 mt-1">{creators.join(", ")}</p>
            </div>
            <Separator />
          </>
        )}

        {cast.length > 0 && (
          <div>
            <span className="text-sm text-zinc-400">Cast</span>
            <div className="mt-2 space-y-1">
              {cast.slice(0, 10).map((actor, index) => (
                <p key={index} className="text-sm text-zinc-300">
                  <span className="font-medium">{actor.name}</span>{" "}
                  <span className="text-zinc-400">as {actor.character}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
