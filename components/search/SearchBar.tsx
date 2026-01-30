"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResult, TitleDetailResponse, MediaType } from "@/types";
import { cn } from "@/lib/utils";
import { TitleTiles } from "@/components/title/TitleTiles";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<TitleDetailResponse | null>(null);
  const [isLoadingTitle, setIsLoadingTitle] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent scrolling when no title is selected
  useEffect(() => {
    if (selectedTitle || isLoadingTitle) {
      // Allow scrolling when content is present
      document.documentElement.style.position = "";
      document.body.style.position = "";
      document.documentElement.style.width = "";
      document.body.style.width = "";
      document.documentElement.style.height = "";
      document.body.style.height = "";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.style.touchAction = "";
      document.body.style.touchAction = "";
    } else {
      // Prevent scrolling on both html and body, including when keyboard appears
      // Use position: fixed to prevent mobile keyboard from enabling scroll
      const scrollY = window.scrollY;
      document.documentElement.style.position = "fixed";
      document.body.style.position = "fixed";
      document.documentElement.style.width = "100%";
      document.body.style.width = "100%";
      document.documentElement.style.height = "100%";
      document.body.style.height = "100%";
      document.documentElement.style.top = `-${scrollY}px`;
      document.body.style.top = `-${scrollY}px`;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      // Prevent touch scrolling on mobile
      document.documentElement.style.touchAction = "none";
      document.body.style.touchAction = "none";
    }
    
    // Cleanup on unmount
    return () => {
      const scrollY = document.body.style.top;
      document.documentElement.style.position = "";
      document.body.style.position = "";
      document.documentElement.style.width = "";
      document.body.style.width = "";
      document.documentElement.style.height = "";
      document.body.style.height = "";
      document.documentElement.style.top = "";
      document.body.style.top = "";
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.style.touchAction = "";
      document.body.style.touchAction = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [selectedTitle, isLoadingTitle]);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    // Don't clear results while loading - keep last results visible
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
        setError(null);
      } else {
        // Only clear results if there's an actual error, not just empty results
        if (data.error) {
          setError(data.error || "Failed to search");
        } else {
          setResults([]);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Network error. Please try again.");
      // Keep last results on network error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (query.length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        search(query);
      }, 200);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, search]);

  const handleSelect = async (result: SearchResult) => {
    setIsOpen(false);
    setIsLoadingTitle(true);
    setSelectedTitle(null);
    
    try {
      console.log(`Fetching title details for ${result.type} ${result.id}`);
      const response = await fetch(`/api/title?type=${result.type}&id=${result.id}`);
      console.log(`Title API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Title data received:", {
          id: data.id,
          title: data.title,
          imdbRating: data.imdbRating,
          metascore: data.metascore,
          rottenTomatoes: data.rottenTomatoes,
          watchAvailability: {
            streaming: data.watchAvailability?.streaming?.length || 0,
            rent: data.watchAvailability?.rent?.length || 0,
            buy: data.watchAvailability?.buy?.length || 0,
          }
        });
        setSelectedTitle(data);
      } else {
        const errorData = await response.json();
        console.error("Title API error:", errorData);
        setError(errorData.error || "Failed to fetch title details");
      }
    } catch (error) {
      console.error("Failed to fetch title details:", error);
      setError("Network error. Failed to load title details.");
    } finally {
      setIsLoadingTitle(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        handleSelect(results[0]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).getFullYear().toString();
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="font-bold">{part}</span>
      ) : (
        part
      )
    );
  };

  const shouldShowPopover = isOpen && (results.length > 0 || isLoading || query.length >= 2 || !!error);

  return (
    <div className="w-full">
      <Popover 
        open={shouldShowPopover} 
        onOpenChange={setIsOpen}
      >
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)}>
          <div className="relative">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Where do I watch..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsOpen(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onClick={() => {
                  // Clear query and hide tiles when clicking on search bar
                  if (selectedTitle) {
                    setQuery("");
                    setSelectedTitle(null);
                    setResults([]);
                    setSelectedIndex(-1);
                  }
                }}
                onFocus={() => {
                  // Clear query and hide tiles when focusing on search bar
                  if (selectedTitle) {
                    setQuery("");
                    setSelectedTitle(null);
                    setResults([]);
                    setSelectedIndex(-1);
                  }
                  if (query.length >= 2 || results.length > 0) {
                    setIsOpen(true);
                  }
                }}
                className="h-14 pr-12 text-base bg-transparent"
              />
              {/* Animated text overlay for smooth character loading */}
              <div className="absolute inset-0 pointer-events-none flex items-center px-3 pr-12">
                <div className="flex items-center w-full">
                  <AnimatePresence mode="popLayout">
                    {query.split("").map((char, index) => (
                      <motion.span
                        key={`${char}-${index}`}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{
                          duration: 0.15,
                          ease: "easeOut",
                        }}
                        className="text-base text-zinc-50"
                        style={{ fontFamily: "inherit" }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <AnimatePresence>
        {shouldShowPopover && (
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-1 mt-2 rounded-2xl"
            align="start"
            side="bottom"
            sideOffset={12}
            onOpenAutoFocus={(e) => e.preventDefault()}
            asChild
            forceMount
          >
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <Command className="rounded-2xl">
              <CommandList>
                {isLoading && results.length === 0 ? (
                  <div className="p-2 space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3 p-2">
                        <Skeleton className="h-12 w-8 rounded" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : results.length > 0 ? (
              results.map((result, index) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  onSelect={() => handleSelect(result)}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(result);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer rounded-xl transition-colors duration-200 m-1",
                    "hover:bg-zinc-800",
                    selectedIndex === index && "bg-zinc-800"
                  )}
                >
                  {result.posterUrl && (
                    <img
                      src={result.posterUrl}
                      alt={result.title}
                      className="h-12 w-8 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-50 truncate">
                        {highlightSearchTerm(result.title, query)}
                      </p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {result.type === "movie" ? "Movie" : "TV"}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400">
                      {result.type === "movie" ? "Movie" : "TV"} •{" "}
                      {formatDate(result.releaseDate) || "Unknown year"}
                    </p>
                  </div>
                </CommandItem>
              ))
            ) : error ? (
              <CommandEmpty>
                <div className="py-6 text-center px-4">
                  <p className="text-sm font-medium text-zinc-50 text-red-400">Error</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {error}
                  </p>
                  {error.includes("TMDB_API_KEY") && (
                    <p className="text-xs text-zinc-500 mt-2">
                      Create a <code className="bg-zinc-800 px-1 py-0.5 rounded">.env.local</code> file with your API keys. See <code className="bg-zinc-800 px-1 py-0.5 rounded">.env.example</code> for reference.
                    </p>
                  )}
                </div>
              </CommandEmpty>
            ) : query.length >= 2 ? (
              <CommandEmpty>
                <div className="py-6 text-center">
                  <p className="text-sm font-medium text-zinc-50">No results</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Try a different name or check spelling
                  </p>
                </div>
              </CommandEmpty>
            ) : null}
              </CommandList>
              </Command>
            </motion.div>
          </PopoverContent>
        )}
      </AnimatePresence>
    </Popover>

    {/* Title Tiles Container */}
    {selectedTitle && (
      <div className="w-full mt-4">
        <TitleTiles
          titleData={selectedTitle}
          type={selectedTitle.type}
          id={selectedTitle.id}
        />
      </div>
    )}
    {isLoadingTitle && (
      <div className="w-full mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-zinc-900 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )}
    </div>
  );
}
