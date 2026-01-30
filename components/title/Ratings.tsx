"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface RatingsProps {
  tmdb: number;
  imdb: string | null;
  metacritic: string | null;
  rottenTomatoes: string | null;
}

export function Ratings({
  tmdb,
  imdb,
  metacritic,
  rottenTomatoes,
}: RatingsProps) {
  const tmdbPercentage = (tmdb / 10) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ratings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-zinc-400">TMDB</span>
            <span className="text-sm font-medium text-zinc-300">
              {tmdb.toFixed(1)}/10
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div
              className="bg-zinc-50 h-2 rounded-full transition-all"
              style={{ width: `${tmdbPercentage}%` }}
            />
          </div>
        </div>

        {imdb && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">IMDb</span>
                <span className="text-sm font-medium text-zinc-300">
                  {imdb}/10
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-zinc-50 h-2 rounded-full transition-all"
                  style={{ width: `${(parseFloat(imdb) / 10) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}

        {metacritic && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">Metacritic</span>
                <span className="text-sm font-medium text-zinc-300">
                  {metacritic}/100
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-zinc-50 h-2 rounded-full transition-all"
                  style={{ width: `${parseFloat(metacritic)}%` }}
                />
              </div>
            </div>
          </>
        )}

        {rottenTomatoes && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-zinc-400">Rotten Tomatoes</span>
                <span className="text-sm font-medium text-zinc-300">
                  {rottenTomatoes}%
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-zinc-50 h-2 rounded-full transition-all"
                  style={{ width: `${parseFloat(rottenTomatoes)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
