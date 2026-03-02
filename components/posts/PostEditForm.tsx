"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryName } from "@/components/CategoryName";

interface Post {
  id: string;
  city: string;
  areaText: string | null;
  status: string;
  instrument: {
    id: string;
    title: string;
    category: { slug: string };
  };
}

export function PostEditForm() {
  const t = useTranslations("common");
  const tPosts = useTranslations("posts");
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ city: "", country: "", areaText: "" });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
          setPost(null);
          return;
        }
        const data = await res.json();
        setPost(data);
        setFormData({
          city: data.city ?? "",
          country: data.country ?? "",
          areaText: data.areaText ?? "",
        });
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !post) return;
    if (post.status !== "PENDING_APPROVAL") return;

    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: formData.city.trim() || undefined,
          country: formData.country.trim() || undefined,
          areaText: formData.areaText.trim() || undefined,
        }),
      });

      if (res.ok) {
        router.push("/posts");
      } else {
        const error = await res.json();
        alert(`${tPosts("errorUpdating")}: ${error.error || ""}`);
      }
    } catch {
      alert(tPosts("errorUpdating"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">{t("loading")}</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">{t("postNotFound")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/posts")}>
          {tPosts("backToList")}
        </Button>
      </div>
    );
  }

  if (post.status !== "PENDING_APPROVAL") {
    return (
      <div className="container py-8">
        <p className="text-muted-foreground">{tPosts("editOnlyWhenPending")}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/posts")}>
          {tPosts("backToList")}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tPosts("editTitle")}</CardTitle>
        <CardDescription>{tPosts("editDescription")}</CardDescription>
        <p className="text-sm text-muted-foreground">
          {post.instrument.title} • <CategoryName category={post.instrument.category} />
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="city">{tPosts("cityLabel")} *</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
              placeholder={tPosts("cityPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="country">{tPosts("countryLabel")}</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder={tPosts("countryPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="areaText">{tPosts("areaLabel")}</Label>
            <Input
              id="areaText"
              value={formData.areaText}
              onChange={(e) => setFormData({ ...formData, areaText: e.target.value })}
              placeholder={tPosts("areaPlaceholder")}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? tPosts("saving") : t("save")}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
