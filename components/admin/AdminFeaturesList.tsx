"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ToggleLeft, ToggleRight } from "lucide-react";

export type FeatureFlagItem = {
  key: string;
  enabled: boolean;
  labelKey: string;
  descriptionKey: string;
};

export function AdminFeaturesList() {
  const tFeatures = useTranslations("features");
  const [flags, setFlags] = useState<FeatureFlagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feature-flags");
      if (res.ok) {
        const data = await res.json();
        setFlags(data);
      }
    } catch (error) {
      console.error("Error fetching feature flags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: string, currentEnabled: boolean) => {
    setTogglingKey(key);
    try {
      const res = await fetch(`/api/admin/feature-flags/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, enabled: !currentEnabled } : f))
        );
      }
    } catch (error) {
      console.error("Error toggling feature flag:", error);
    } finally {
      setTogglingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {tFeatures("intro")}
      </p>
      <div className="grid gap-4">
        {flags.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            {tFeatures("noFlags")}
          </p>
        ) : (
          flags.map((flag) => {
            const label = tFeatures(flag.labelKey as any);
            const description = tFeatures(flag.descriptionKey as any);
            const isToggling = togglingKey === flag.key;
            return (
              <Card key={flag.key}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1.5">
                    <CardTitle className="text-base flex items-center gap-2">
                      {label}
                      <Badge variant={flag.enabled ? "default" : "secondary"}>
                        {flag.enabled ? tFeatures("enabled") : tFeatures("disabled")}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(flag.key, flag.enabled)}
                    disabled={isToggling}
                    aria-label={flag.enabled ? tFeatures("disable") : tFeatures("enable")}
                  >
                    {isToggling ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : flag.enabled ? (
                      <ToggleRight className="h-8 w-8 text-primary" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                    )}
                  </Button>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
