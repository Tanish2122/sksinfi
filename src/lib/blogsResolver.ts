import fs from "fs";
import path from "path";
import os from "os";
import { BlogPost, BLOGS_DATA, getBlogPostBySlug } from "@/data/blogsData";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export function cleanBlogSlug(slug: string): string {
  try {
    let clean = decodeURIComponent(slug).toLowerCase().trim();
    clean = clean.replace(/\.php$/, "").replace(/\/$/, "");
    clean = clean.replace(/^\/?blogs\//, "").replace(/^\/?blog\//, "");
    return clean;
  } catch {
    return slug.toLowerCase().trim().replace(/\.php$/, "");
  }
}

export async function resolveBlogPost(slug: string): Promise<BlogPost | undefined> {
  const clean = cleanBlogSlug(slug);

  // 1. Supabase check if configured
  const sbClient = supabaseAdmin || supabase;
  if (isSupabaseConfigured() && sbClient) {
    try {
      const { data, error } = await sbClient
        .from("blogs")
        .select("*")
        .or(`slug.eq.${clean},slug.ilike.${clean}`)
        .maybeSingle();

      if (!error) {
        if (!data) {
          return undefined;
        }

        const diskFallback = BLOGS_DATA.find(
          (b) =>
            b.slug.toLowerCase().trim() === clean ||
            b.slug.toLowerCase().trim().replace(/-/g, "") === clean.replace(/-/g, "")
        );

        return {
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt || data.title,
          category: data.category || "Loans",
          author: {
            name: data.author_name || "Arun Mehta",
            role: data.author_role || "Senior Financial Consultant, SKS INFI",
            avatar: data.author_avatar || "/images/user (1).png"
          },
          publishedDate: data.published_at || data.publishedDate || "Recently",
          readTime: data.read_time || data.readTime || "5 min read",
          coverImage: data.cover_image || diskFallback?.coverImage || "/images/homeloan.avif",
          tags: Array.isArray(data.tags) && data.tags.length > 0 ? data.tags : diskFallback?.tags || [],
          featured: Boolean(data.is_featured ?? data.featured ?? diskFallback?.featured),
          takeaways: Array.isArray(data.takeaways) && data.takeaways.length > 0 ? data.takeaways : diskFallback?.takeaways || [],
          content: data.content || diskFallback?.content || "",
          metaTitle: data.meta_title || data.metaTitle || diskFallback?.metaTitle || undefined,
          metaDescription: data.meta_description || data.metaDescription || diskFallback?.metaDescription || undefined
        };
      }
    } catch (e) {
      console.warn("Supabase fetch notice in resolveBlogPost:", e);
    }
  }

  // 2. Temp cache check (os.tmpdir())
  try {
    const tmpPath = path.join(os.tmpdir(), "sks_blogs.json");
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const tmpBlogs: BlogPost[] = JSON.parse(raw);
      if (Array.isArray(tmpBlogs) && tmpBlogs.length > 0) {
        const found = tmpBlogs.find(
          (b) =>
            b.slug.toLowerCase().trim() === clean ||
            b.slug.toLowerCase().trim().replace(/-/g, "") === clean.replace(/-/g, "")
        );
        if (found) return found;
      }
    }
  } catch {}

  // 3. Disk file check (src/data/blogs.json)
  try {
    const filePath = path.join(process.cwd(), "src", "data", "blogs.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const diskBlogs: BlogPost[] = JSON.parse(raw);
      if (Array.isArray(diskBlogs) && diskBlogs.length > 0) {
        const found = diskBlogs.find(
          (b) =>
            b.slug.toLowerCase().trim() === clean ||
            b.slug.toLowerCase().trim().replace(/-/g, "") === clean.replace(/-/g, "")
        );
        if (found) return found;
      }
    }
  } catch {}

  // 4. Bundled data fallback
  const directBundled = getBlogPostBySlug(clean);
  if (directBundled) return directBundled;

  return BLOGS_DATA.find(
    (b) =>
      b.slug.toLowerCase().trim() === clean ||
      b.slug.toLowerCase().trim().replace(/-/g, "") === clean.replace(/-/g, "")
  );
}

export async function getAllCurrentBlogs(): Promise<BlogPost[]> {
  // 1. Check Supabase
  const sbClient = supabaseAdmin || supabase;
  if (isSupabaseConfigured() && sbClient) {
    try {
      const { data, error } = await sbClient
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((b: any) => {
          const diskFallback = BLOGS_DATA.find(
            (item) => item.slug.toLowerCase().trim() === (b.slug || "").toLowerCase().trim()
          );
          return {
            slug: b.slug,
            title: b.title,
            excerpt: b.excerpt || b.title,
            category: b.category || "Loans",
            author: {
              name: b.author_name || "Arun Mehta",
              role: b.author_role || "Senior Financial Consultant, SKS INFI",
              avatar: b.author_avatar || "/images/user (1).png"
            },
            publishedDate: b.published_at || b.publishedDate || "Recently",
            readTime: b.read_time || b.readTime || "5 min read",
            coverImage: b.cover_image || diskFallback?.coverImage || "/images/homeloan.avif",
            tags: Array.isArray(b.tags) && b.tags.length > 0 ? b.tags : diskFallback?.tags || [],
            featured: Boolean(b.is_featured ?? b.featured ?? diskFallback?.featured),
            takeaways: Array.isArray(b.takeaways) && b.takeaways.length > 0 ? b.takeaways : diskFallback?.takeaways || [],
            content: b.content || diskFallback?.content || "",
            metaTitle: b.meta_title || b.metaTitle || diskFallback?.metaTitle || undefined,
            metaDescription: b.meta_description || b.metaDescription || diskFallback?.metaDescription || undefined
          };
        });
      }
    } catch {}
  }

  // 2. Temp cache
  try {
    const tmpPath = path.join(os.tmpdir(), "sks_blogs.json");
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const tmpBlogs: BlogPost[] = JSON.parse(raw);
      if (Array.isArray(tmpBlogs) && tmpBlogs.length > 0) {
        return tmpBlogs;
      }
    }
  } catch {}

  // 3. Disk file
  try {
    const filePath = path.join(process.cwd(), "src", "data", "blogs.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const diskBlogs: BlogPost[] = JSON.parse(raw);
      if (Array.isArray(diskBlogs) && diskBlogs.length > 0) {
        return diskBlogs;
      }
    }
  } catch {}

  return BLOGS_DATA;
}
