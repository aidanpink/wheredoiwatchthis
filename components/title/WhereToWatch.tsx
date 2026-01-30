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

  const hasAnyOption = streaming.length > 0 || rent.length > 0 || buy.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where to Watch</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasAnyOption ? (
          <p className="text-sm text-zinc-400">
            Not currently included with a subscription
          </p>
        ) : (
          <>
            {streaming.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-300 mb-2">
                  Streaming
                </h4>
                <div className="flex flex-wrap gap-2">
                  {streaming.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary">{option.provider}</Badge>
                      {option.deepLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => window.open(option.deepLink!, "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {rent.length > 0 && (
              <>
                <Separator />
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

            {buy.length > 0 && (
              <>
                <Separator />
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
