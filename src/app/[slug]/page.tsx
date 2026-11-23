import React from "react";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import LegacyPageRenderer from "@/components/LegacyPageRenderer";
import pagesDataRaw from "@/data/pagesContent.json";
import { resolveBlogPost } from "@/lib/blogsResolver";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const pagesData = pagesDataRaw as Record<
  string,
  {
    slug: string;
    file: string;
    title: string;
    metaDescription: string;
    keywords?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
    html: string;
    jsonLd?: string[];
  }
>;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.php$/, "");
  const page =
    pagesData[cleanSlug] ||
    (cleanSlug === "sitemap" || cleanSlug === "sitemap.html"
      ? pagesData["sitemap.html"] || pagesData["sitemap"]
      : undefined);

  if (!page) {
    const blogPost = await resolveBlogPost(cleanSlug);
    if (blogPost) {
      return {
        title: `${blogPost.title} | SKS INFI`,
        description: blogPost.excerpt,
        alternates: {
          canonical: `https://www.sksinfi.com/blogs/${blogPost.slug}`
        }
      };
    }
    return {
      title: "SKS INFI | Financial Consultant in Jaipur",
      description: "SKS INFI provides expert financial planning, investment, loan and insurance services as a trusted Financial Consultant in Jaipur.",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const isSitemap = cleanSlug === "sitemap" || cleanSlug === "sitemap.html";
  const title = page.title || "SKS INFI | Financial Consultant in Jaipur";
  const description =
    page.metaDescription ||
    "SKS INFI provides expert financial planning, investment, loan and insurance services as a trusted Financial Consultant in Jaipur. Contact us today for guidance.";
  let canonicalUrl = (page.canonical || `https://www.sksinfi.com/${cleanSlug}`).trim();
  if (isSitemap) {
    canonicalUrl = "https://www.sksinfi.com/sitemap";
  } else if (canonicalUrl.endsWith(".php")) {
    canonicalUrl = canonicalUrl.replace(/\.php$/, "");
  }
  const ogImg = page.ogImage || "https://www.sksinfi.com/img/aboutus.png";

  const keywordsList = page.keywords
    ? page.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
    : undefined;

  return {
    title,
    description,
    keywords: keywordsList,
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: page.ogTitle || title,
      description: page.ogDescription || description,
      url: canonicalUrl,
      siteName: "SKS INFI",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: ogImg,
          alt: title
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: page.twitterTitle || title,
      description: page.twitterDescription || description,
      images: [page.twitterImage || ogImg]
    },
    robots: isSitemap
      ? {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true
          }
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1
          }
        }
  };
}

export default async function DynamicLegacyPage({ params }: PageProps) {
  const { slug } = await params;
  const cleanSlug = slug.replace(/\.php$/, "");
  if (slug.endsWith(".php")) {
    redirect(`/${cleanSlug}`);
  }

  if (cleanSlug === "blog" || cleanSlug === "blogs") {
    redirect("/blogs");
  }
  if (cleanSlug === "msme") {
    redirect("/msme");
  }
  if (cleanSlug === "contact" || cleanSlug === "contactus" || cleanSlug === "contact-us") {
    redirect("/contact");
  }
  if (cleanSlug === "sitemap.html") {
    redirect("/sitemap");
  }
  if (cleanSlug === "sitemap") {
    const sitemapPage = pagesData["sitemap"] || pagesData["sitemap.html"];
    if (sitemapPage) {
      return <LegacyPageRenderer slug="sitemap" initialData={sitemapPage} />;
    }
  }

  const page = pagesData[cleanSlug];

  if (!page) {
    const blogPost = await resolveBlogPost(cleanSlug);
    if (blogPost) {
      redirect(`/blogs/${blogPost.slug}`);
    }
    notFound();
  }

  return <LegacyPageRenderer slug={cleanSlug} initialData={page} />;
}
