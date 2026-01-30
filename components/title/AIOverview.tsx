"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { MediaType } from "@/types";

interface AIOverviewProps {
  type: MediaType;
  id: number;
  fallbackOverview: string;
}

export function AIOverview({ type, id, fallbackOverview }: AIOverviewProps) {
  const [overview, setOverview] = useState<{
    overviewText: string;
    similarTitles: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const response = await fetch("/api/ai-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, id }),
        });

        if (response.ok) {
          const data = await response.json();
          setOverview(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch AI overview:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverview();
  }, [type, id]);

  const handleRegenerate = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const response = await fetch("/api/ai-overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to regenerate AI overview:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const words = overview
    ? overview.overviewText.split(" ")
    : error
    ? fallbackOverview.split(" ")
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-zinc-400" />
          <CardTitle>AI Overview</CardTitle>
        </div>
        <CardDescription>Quick summary + vibe (no spoilers)</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-3/6" />
          </div>
        ) : error || !overview ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-300 leading-relaxed">
              {fallbackOverview}
            </p>
            <p className="text-xs text-zinc-500 italic">
              AI overview unavailable
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300 leading-relaxed">
              {words.map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.03,
                  }}
                  className="inline-block mr-1"
                >
                  {word}
                </motion.span>
              ))}
            </div>
            {overview.similarTitles.length > 0 && (
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-sm text-zinc-400">
                  Best if you like:{" "}
                  <span className="text-zinc-300">
                    {overview.similarTitles.join(", ")}
                  </span>
                </p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="mt-2"
            >
              Regenerate
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
