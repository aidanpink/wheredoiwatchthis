"use client";

import { WhereToWatch } from "@/components/title/WhereToWatch";
import { Ratings } from "@/components/title/Ratings";
import { Details } from "@/components/title/Details";
import { Trailer } from "@/components/title/Trailer";
import { MediaType, TitleDetailResponse } from "@/types";

interface TitleTilesProps {
  titleData: TitleDetailResponse;
  type: MediaType;
  id: number;
}

export function TitleTiles({ titleData, type, id }: TitleTilesProps) {

  return (
    <div className="w-full space-y-3">
      {/* Bento Box Grid - 1 column on mobile, 2 columns on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
        {/* Left column */}
        <div className="space-y-3">
          <WhereToWatch watchAvailability={titleData.watchAvailability} />
          <Details
            type={type}
            releaseDate={titleData.releaseDate}
            runtime={titleData.runtime}
            seasons={titleData.seasons}
            genres={titleData.genres}
            directors={titleData.directors}
            creators={titleData.creators}
            cast={titleData.cast}
          />
        </div>
        {/* Right column */}
        <div className="space-y-3">
          <Ratings
            tmdb={titleData.voteAverage}
            imdb={titleData.imdbRating}
            metacritic={titleData.metascore}
            rottenTomatoes={titleData.rottenTomatoes}
          />
          <Trailer trailerKey={titleData.trailerKey} />
        </div>
      </div>
    </div>
  );
}
