"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrailerProps {
  trailerKey: string | null;
}

export function Trailer({ trailerKey }: TrailerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!trailerKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Trailer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">Trailer not available</p>
        </CardContent>
      </Card>
    );
  }

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trailer</CardTitle>
      </CardHeader>
      <CardContent>
        {isPlaying ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              title="Trailer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="border-0"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-zinc-800">
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                onClick={handlePlay}
                size="lg"
                className="rounded-full h-16 w-16"
              >
                <Play className="h-8 w-8 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
