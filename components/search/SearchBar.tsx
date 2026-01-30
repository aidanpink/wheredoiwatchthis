"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
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
import { SearchResult } from "@/types";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
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

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/title/${result.type}/${result.id}`);
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

  return (
    <Popover open={isOpen && (results.length > 0 || isLoading || query.length >= 2)} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative w-full", className)}>
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search a movie or show"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setSelectedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (query.length >= 2 || results.length > 0) {
                  setIsOpen(true);
                }
              }}
              className="h-14 rounded-xl pr-12 text-base"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Search className="h-5 w-5 text-zinc-400" />
            </div>
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {isLoading ? (
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
                  className={cn(
                    "flex items-center gap-3 p-3 cursor-pointer",
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
                        {result.title}
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
      </PopoverContent>
    </Popover>
  );
}
