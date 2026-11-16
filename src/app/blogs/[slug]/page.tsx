import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import fs from "fs";
import path from "path";
import os from "os";
import { BLOGS_DATA, getBlogPostBySlug, BlogPost } from "@/data/blogsData";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import SingleBlogClient from "./SingleBlogClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolveBlogPost(slug: string): Promise<BlogPost | undefined> {
  const clean = slug.replace(/\.php$/, "").toLowerCase().trim();

  // 1. Supabase check if configured
  const sbClient = supabaseAdmin || supabase;
  if (isSupabaseConfigured() && sbClient) {
    try {
      const { data, error } = await sbClient
        .from("blogs")
        .select("*")
        .eq("slug", clean)
        .maybeSingle();

      if (!error && data) {
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
          coverImage: data.cover_image || data.coverImage || "/images/homeloan.avif",
          tags: Array.isArray(data.tags) ? data.tags : [],
          featured: Boolean(data.is_featured ?? data.featured),
          takeaways: Array.isArray(data.takeaways) ? data.takeaways : [],
          content: data.content || ""
        };
      }
    } catch (e) {
      console.warn("Supabase fetch notice in blog/[slug]:", e);
    }
  }

  // 2. Temp cache check (os.tmpdir())
  try {
    const tmpPath = path.join(os.tmpdir(), "sks_blogs.json");
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, "utf8");
      const tmpBlogs: BlogPost[] = JSON.parse(raw);
      if (Array.isArray(tmpBlogs) && tmpBlogs.length > 0) {
        const found = tmpBlogs.find((b) => b.slug.toLowerCase().trim() === clean);
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
        const found = diskBlogs.find((b) => b.slug.toLowerCase().trim() === clean);
        if (found) return found;
      }
    }
  } catch {}

  // 4. Fallback to bundled data
  return getBlogPostBySlug(slug);
}

async function getAllCurrentBlogs(): Promise<BlogPost[]> {
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

export async function generateStaticParams() {
  return BLOGS_DATA.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await resolveBlogPost(slug);

  if (!post) {
    return {
      title: "Blog Not Found | SKS INFI",
      description: "The requested financial advisory article could not be found.",
    };
  }

  return {
    title: `${post.title} | SKS INFI`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedDate,
      authors: [post.author.name],
      tags: post.tags,
      images: [
        {
          url: post.coverImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    alternates: {
      canonical: `https://www.sksinfi.com/blogs/${slug}`
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [post.coverImage],
    },
  };
}

export default async function SingleBlogPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await resolveBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Find related articles (same category or recent)
  const allPosts = await getAllCurrentBlogs();
  const relatedPosts = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: `https://www.sksinfi.com${post.coverImage}`,
    datePublished: post.publishedDate,
    author: {
      "@type": "Person",
      name: post.author.name,
      jobTitle: post.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "SKS INFI",
      logo: {
        "@type": "ImageObject",
        url: "https://www.sksinfi.com/images/skslogo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.sksinfi.com/blogs/${slug}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SingleBlogClient post={post} relatedPosts={relatedPosts} />
    </>
  );
}
