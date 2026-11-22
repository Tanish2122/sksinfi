import React from "react";
import type { Metadata } from "next";
import { BLOGS_DATA, BlogPost } from "@/data/blogsData";
import { resolveBlogPost, cleanBlogSlug, getAllCurrentBlogs } from "@/lib/blogsResolver";
import SingleBlogClient from "./SingleBlogClient";

export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOGS_DATA.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const clean = cleanBlogSlug(slug);
  const post = await resolveBlogPost(clean);

  if (!post) {
    return {
      title: "Financial Article | SKS INFI",
      description: "Read expert financial planning, loan advisory and investment insights from SKS INFI.",
    };
  }

  return {
    title: `${post.title} | SKS INFI`,
    description: post.excerpt,
    keywords: post.tags,
    authors: [{ name: "SKS INFI" }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.publishedDate,
      authors: ["SKS INFI"],
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
      canonical: `https://www.sksinfi.com/blogs/${post.slug}`
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
  const clean = cleanBlogSlug(slug);
  const post = await resolveBlogPost(clean);

  // Find related articles (same category or recent)
  const allPosts = await getAllCurrentBlogs();
  const relatedPosts = allPosts.filter((p) => !post || p.slug !== post.slug).slice(0, 3);

  const jsonLd = post
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.excerpt,
        image: `https://www.sksinfi.com${post.coverImage}`,
        datePublished: post.publishedDate,
        author: {
          "@type": "Organization",
          name: "SKS INFI",
          url: "https://www.sksinfi.com",
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
          "@id": `https://www.sksinfi.com/blogs/${post.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SingleBlogClient post={post || null} slug={clean} relatedPosts={relatedPosts} />
    </>
  );
}
