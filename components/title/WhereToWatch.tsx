"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WatchAvailability } from "@/types";

interface WhereToWatchProps {
  watchAvailability: WatchAvailability;
}

export function WhereToWatch({ watchAvailability }: WhereToWatchProps) {
  const { streaming, rent, buy } = watchAvailability;

  // Deduplicate streaming services by provider name (keep first occurrence)
  // Use a case-insensitive comparison and normalize the names
  // Also handle variations like "Peacock" vs "Peacock Premium" by extracting base service name
  const seen = new Set<string>();
  const uniqueStreaming = streaming.filter((option) => {
    const normalized = option.provider.toLowerCase().trim();
    
    // Extract base service name (remove common suffixes like "premium", "plus", "tv", etc.)
    const baseName = normalized
      .replace(/\s+(premium|plus|tv|streaming|subscription)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Check both the full normalized name and the base name
    if (seen.has(normalized) || seen.has(baseName)) {
      return false;
    }
    seen.add(normalized);
    seen.add(baseName);
    return true;
  });

  // Exclude international/non-US services
  const excludedServices = [
    'skyshowtime',
    'sky showtime',
    'sky go',
    'sky',
    'now tv',
    'nowtv',
    'stan',
    'binge',
    'foxtel',
    'hotstar',
    'movistar',
    'bbc iplayer',
    'bbc',
    'all 4',
    'itv',
    'channel 4',
    'rtl',
    'zdf',
    'ard',
    'arte',
    'canal+',
    'tf1',
    'm6',
    'rai',
    'mediaset',
    'crave',
    'hbo nordic',
    'hbo espana',
    'hbo max latino',
    'hbo max brazil'
  ];

  // Only show common US streaming services (strictly US-available services)
  const commonUSStreamingServices = [
    'netflix',
    'hulu',
    'disney plus',
    'disney+',
    'max',
    'hbo max',
    'paramount+',
    'peacock',
    'apple tv+',
    'apple tv plus',
    'apple tv',
    'prime video',
    'amazon prime video',
    'showtime',
    'starz',
    'crunchyroll',
    'funimation',
    'espn+',
    'youtube premium',
    'youtube tv',
    'sling tv',
    'fubo',
    'philo',
    'directv stream',
    'amc+',
    'shudder',
    'tubi',
    'pluto tv',
    'crackle',
    'imdb tv',
    'the roku channel',
    'vudu',
    'plex',
    'redbox',
    'hbo',
    'hbo go'
  ];

  const filteredStreaming = uniqueStreaming.filter((option) => {
    const providerLower = option.provider.toLowerCase().trim();
    
    // First, exclude any international/non-US services
    if (excludedServices.some(excluded => providerLower.includes(excluded))) {
      return false;
    }
    
    // Then check if provider name matches any common US streaming service
    return commonUSStreamingServices.some(service => {
      // For Apple TV, be more strict - must start with "apple" or be exactly "apple tv"
      if (service.includes('apple tv')) {
        return providerLower === 'apple tv' || 
               providerLower === 'apple tv+' || 
               providerLower === 'apple tv plus' ||
               providerLower.startsWith('apple tv');
      }
      // For other services, exact match or provider contains service name
      return providerLower === service || providerLower.includes(service);
    });
  });

  // Final deduplication: group by base service name to avoid duplicates like "Peacock" and "Peacock Premium"
  // Also normalize Apple TV variations
  const finalSeen = new Set<string>();
  const displayStreaming = filteredStreaming.filter((option) => {
    const providerLower = option.provider.toLowerCase().trim();
    
    // For Apple TV specifically, require exact match or starts with "apple tv"
    if (providerLower.includes('apple')) {
      const isAppleTV = providerLower === 'apple tv' || 
                        providerLower === 'apple tv+' || 
                        providerLower === 'apple tv plus' ||
                        providerLower.startsWith('apple tv');
      if (!isAppleTV) {
        // If it contains "apple" but isn't Apple TV, exclude it
        return false;
      }
      // It's Apple TV, normalize it
      const dedupKey = 'apple tv';
      if (finalSeen.has(dedupKey)) {
        return false;
      }
      finalSeen.add(dedupKey);
      return true;
    }
    
    // Extract base service name (remove common suffixes, but be careful with "tv")
    // Don't remove "tv" if it's part of the service name like "Apple TV"
    let baseName = providerLower
      .replace(/\s+(premium|plus|streaming|subscription|ad-free|ad free)$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // For each known service, check if this matches its base name
    for (const service of commonUSStreamingServices) {
      // Skip Apple TV in this loop since we handled it above
      if (service.includes('apple tv')) {
        continue;
      }
      
      let serviceBase = service.replace(/\s+(premium|plus|streaming|subscription)$/i, '').trim();
      
      // Strict matching - exact match or provider contains the full service name
      const matches = baseName === serviceBase || 
                     providerLower === service ||
                     providerLower === serviceBase ||
                     (providerLower.includes(serviceBase) && serviceBase.length > 4);
      
      if (matches) {
        // Use the normalized base name for deduplication
        const dedupKey = serviceBase;
        if (finalSeen.has(dedupKey)) {
          return false; // Already seen this service
        }
        finalSeen.add(dedupKey);
        return true;
      }
    }
    
    // If no match found, don't include it
    return false;
  });

  // Only show rent/buy options if there are no streaming options available
  const showRentBuy = displayStreaming.length === 0;
  
  const hasAnyOption = displayStreaming.length > 0 || (showRentBuy && (rent.length > 0 || buy.length > 0));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Watch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayStreaming.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-zinc-300 mb-3">
              Streaming
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {displayStreaming.map((option, index) => (
                <button
                  key={index}
                  onClick={() => option.deepLink && window.open(option.deepLink, "_blank")}
                  disabled={!option.deepLink}
                  className={`
                    rounded-2xl border border-zinc-800 bg-zinc-900 
                    flex items-center justify-between gap-3 px-4 py-3
                    transition-all duration-200
                    ${option.deepLink 
                      ? 'hover:bg-zinc-800 hover:border-zinc-700 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-medium text-zinc-300 truncate">
                      {option.provider
                        .replace(/\s+premium$/i, '')
                        .replace(/\s+plus$/i, '')
                        .trim()}
                    </span>
                  </div>
                  {option.deepLink && (
                    <ExternalLink className="h-3 w-3 text-zinc-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {showRentBuy && rent.length > 0 && (
          <>
            {displayStreaming.length > 0 && <Separator />}
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">
                Rent
              </h4>
              <div className="space-y-2">
                {rent.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-zinc-400">
                      {option.provider}
                    </span>
                    <div className="flex items-center gap-2">
                      {option.price && (
                        <span className="text-sm text-zinc-300">
                          {option.price}
                        </span>
                      )}
                      {option.deepLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() =>
                            window.open(option.deepLink!, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {showRentBuy && buy.length > 0 && (
          <>
            {(displayStreaming.length > 0 || rent.length > 0) && <Separator />}
            <div>
              <h4 className="text-sm font-medium text-zinc-300 mb-2">
                Buy
              </h4>
              <div className="space-y-2">
                {buy.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-zinc-400">
                      {option.provider}
                    </span>
                    <div className="flex items-center gap-2">
                      {option.price && (
                        <span className="text-sm text-zinc-300">
                          {option.price}
                        </span>
                      )}
                      {option.deepLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() =>
                            window.open(option.deepLink!, "_blank")
                          }
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!hasAnyOption && (
          <p className="text-sm text-zinc-400">
            No streaming, rental, or purchase options available
          </p>
        )}
      </CardContent>
    </Card>
  );
}
