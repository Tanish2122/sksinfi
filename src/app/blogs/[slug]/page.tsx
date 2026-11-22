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

function extractFaqItems(content: string): Array<{ question: string; answer: string }> {
  const faqItems: Array<{ question: string; answer: string }> = [];
  try {
    const faqSectionMatch = content.match(/<h[23][^>]*>(?:Frequently Asked Questions|FAQ|FAQs)<\/h[23]>([\s\S]*)/i);
    if (!faqSectionMatch) return [];

    const sectionHtml = faqSectionMatch[1];
    const regex = /<h[34][^>]*>([\s\S]*?)<\/h[34]>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    let match;
    while ((match = regex.exec(sectionHtml)) !== null) {
      const q = match[1].replace(/<[^>]+>/g, "").trim();
      const a = match[2].replace(/<[^>]+>/g, "").trim();
      if (q && a) {
        faqItems.push({ question: q, answer: a });
      }
    }
  } catch {}
  return faqItems;
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

  const metaTitle = post.metaTitle?.trim() || `${post.title} | SKS INFI`;
  const metaDescription = post.metaDescription?.trim() || post.excerpt;
  const canonicalUrl = `https://www.sksinfi.com/blogs/${post.slug}`;
  const absoluteImageUrl = post.coverImage.startsWith("http")
    ? post.coverImage
    : post.coverImage.startsWith("data:")
    ? "https://www.sksinfi.com/images/homeloan.avif"
    : `https://www.sksinfi.com${post.coverImage.startsWith("/") ? "" : "/"}${post.coverImage}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: post.tags && post.tags.length > 0 ? post.tags : ["Financial Planning", "Advisory", "SKS INFI"],
    authors: [{ name: post.author?.name || "SKS INFI" }],
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: "SKS INFI",
      locale: "en_IN",
      type: "article",
      publishedTime: post.publishedDate,
      authors: [post.author?.name || "SKS INFI"],
      tags: post.tags,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: metaTitle,
        },
      ],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [absoluteImageUrl],
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

  let jsonLd = null;
  if (post) {
    const canonicalUrl = `https://www.sksinfi.com/blogs/${post.slug}`;
    const absoluteImageUrl = post.coverImage.startsWith("http")
      ? post.coverImage
      : post.coverImage.startsWith("data:")
      ? "https://www.sksinfi.com/images/homeloan.avif"
      : `https://www.sksinfi.com${post.coverImage.startsWith("/") ? "" : "/"}${post.coverImage}`;

    const blogPostingSchema: any = {
      "@type": "BlogPosting",
      "@id": `${canonicalUrl}#article`,
      headline: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      image: absoluteImageUrl,
      datePublished: post.publishedDate,
      dateModified: post.publishedDate,
      articleSection: post.category,
      inLanguage: "en-IN",
      author: {
        "@type": "Organization",
        name: "SKS INFI",
        url: "https://www.sksinfi.com",
      },
      publisher: {
        "@type": "Organization",
        name: "SKS INFI",
        url: "https://www.sksinfi.com",
        logo: {
          "@type": "ImageObject",
          url: "https://www.sksinfi.com/images/skslogo.png",
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
    };

    if (post.tags && post.tags.length > 0) {
      blogPostingSchema.keywords = post.tags.join(", ");
    }

    const breadcrumbSchema = {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.sksinfi.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blogs",
          item: "https://www.sksinfi.com/blogs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: canonicalUrl,
        },
      ],
    };

    const faqItems = extractFaqItems(post.content);
    const faqSchema =
      faqItems.length > 0
        ? {
            "@type": "FAQPage",
            mainEntity: faqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
              },
            })),
          }
        : null;

    jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        blogPostingSchema,
        breadcrumbSchema,
        ...(faqSchema ? [faqSchema] : []),
      ],
    };
  }

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
