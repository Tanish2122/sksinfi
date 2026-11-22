"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import EnquiryModal from "@/components/EnquiryModal";
import { BlogPost } from "@/data/blogsData";
import {
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  PhoneCall,
  Mail,
  Shield,
  HelpCircle,
  Tag
} from "lucide-react";

interface SingleBlogClientProps {
  post: BlogPost | null;
  slug?: string;
  relatedPosts: BlogPost[];
}

export default function SingleBlogClient({ post: initialPost, slug, relatedPosts }: SingleBlogClientProps) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [loading, setLoading] = useState<boolean>(!initialPost);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<string | undefined>(initialPost?.category || "Loans");
  const [copied, setCopied] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isDeleted, setIsDeleted] = useState(false);
  const articleRef = useRef<HTMLDivElement>(null);

  // Check client-side localStorage and API if not found on server
  useEffect(() => {
    if (!initialPost && typeof window !== "undefined") {
      const cleanTargetSlug = (slug || "").toLowerCase().trim();

      // 1. Check custom blogs in localStorage
      try {
        const customBlogs: BlogPost[] = JSON.parse(
          localStorage.getItem("sks_custom_blogs") || "[]"
        );
        const found = customBlogs.find(
          (b) =>
            b.slug.toLowerCase().trim() === cleanTargetSlug ||
            b.slug.toLowerCase().trim().replace(/-/g, "") === cleanTargetSlug.replace(/-/g, "") ||
            b.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === cleanTargetSlug
        );
        if (found) {
          setPost(found);
          setModalCategory(found.category);
          setIsDeleted(false);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Failed checking localStorage for blog post:", e);
      }

      // 2. Query /api/admin/blogs for dynamically published articles across sessions
      fetch("/api/admin/blogs", { cache: "no-store" })
        .then((res) => (res.ok ? res.json() : null))
        .then((blogs: BlogPost[]) => {
          if (Array.isArray(blogs)) {
            const found = blogs.find(
              (b) =>
                b.slug.toLowerCase().trim() === cleanTargetSlug ||
                b.slug.toLowerCase().trim().replace(/-/g, "") === cleanTargetSlug.replace(/-/g, "") ||
                b.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === cleanTargetSlug
            );
            if (found) {
              setPost(found);
              setModalCategory(found.category);
              setIsDeleted(false);
            }
          }
        })
        .catch((e) => console.warn("API blogs fetch error:", e))
        .finally(() => setLoading(false));
    }
  }, [initialPost, slug]);

  // Check if blog was deleted locally
  useEffect(() => {
    if (post && typeof window !== "undefined") {
      try {
        const cleanSlug = post.slug.toLowerCase().trim();
        const customBlogs: BlogPost[] = JSON.parse(
          localStorage.getItem("sks_custom_blogs") || "[]"
        );
        // If this blog is in customBlogs, it is active and cannot be considered deleted
        const isCustom = customBlogs.some((b) => b.slug.toLowerCase().trim() === cleanSlug);
        if (isCustom) {
          setIsDeleted(false);
          // Heal stale deleted slugs in localStorage
          const deletedSlugs: string[] = JSON.parse(
            localStorage.getItem("sks_deleted_blog_slugs") || "[]"
          );
          if (deletedSlugs.includes(cleanSlug)) {
            const cleaned = deletedSlugs.filter((s) => s.toLowerCase().trim() !== cleanSlug);
            localStorage.setItem("sks_deleted_blog_slugs", JSON.stringify(cleaned));
          }
          return;
        }

        const deletedSlugs: string[] = JSON.parse(
          localStorage.getItem("sks_deleted_blog_slugs") || "[]"
        );
        if (deletedSlugs.includes(cleanSlug)) {
          setIsDeleted(true);
        } else {
          setIsDeleted(false);
        }
      } catch {}
    }
  }, [post]);

  // Reading progress bar
  useEffect(() => {
    const updateProgress = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalHeight = el.offsetHeight;
      const scrolled = -rect.top;
      const progress = Math.min(Math.max((scrolled / totalHeight) * 100, 0), 100);
      setReadingProgress(progress);
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-[#333333]">
        <Navbar onOpenEnquiry={() => setModalOpen(true)} />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="text-center text-slate-500 font-semibold text-sm">
            <div className="w-8 h-8 border-3 border-[#b69455] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading advisory article...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isDeleted) {
    return (
      <div className="min-h-screen flex flex-col bg-white text-[#333333]">
        <Navbar onOpenEnquiry={() => setModalOpen(true)} />
        <main className="flex-1 flex items-center justify-center py-20 px-4">
          <div className="max-w-md mx-auto text-center bg-slate-50 border border-slate-200 rounded-2xl p-8 shadow-sm">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Blog Removed</h1>
            <p className="text-slate-500 text-sm mb-6">
              This blog article has been removed from SKS INFI.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center justify-center gap-2 bg-[#094b57] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#073842] transition no-underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Explore All Blogs</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#333333]">
        <Navbar onOpenEnquiry={() => setModalOpen(true)} />
        <main className="flex-1 py-16 px-4">
          <div className="max-w-2xl mx-auto text-center bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm mb-12">
            <div className="w-16 h-16 bg-amber-50 text-[#b69455] rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-100">
              <HelpCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Blog Not Found or Moved
            </h1>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-6">
              The requested advisory article <code className="bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-xs font-mono">{slug || "article"}</code> could not be found. It may have been updated, renamed, or relocated.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/blogs"
                style={{ color: "#ffffff", backgroundColor: "#094b57", textDecoration: "none" }}
                className="inline-flex items-center justify-center gap-2 hover:bg-[#073942] px-6 py-2.5 rounded-xl font-semibold text-sm transition shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Explore All Blogs</span>
              </Link>
              <Link
                href="/"
                style={{ color: "#1e293b", backgroundColor: "#f1f5f9", textDecoration: "none" }}
                className="inline-flex items-center justify-center gap-2 hover:bg-slate-200 px-5 py-2.5 rounded-xl font-semibold text-sm transition"
              >
                <span>Return Home</span>
              </Link>
            </div>
          </div>

          {relatedPosts && relatedPosts.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">
                Popular Financial Advisory Blogs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rel) => (
                  <Link
                    key={rel.slug}
                    href={`/blogs/${rel.slug}`}
                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-md transition flex flex-col no-underline"
                  >
                    <div className="h-40 overflow-hidden bg-slate-100">
                      <img
                        src={rel.coverImage || "/images/homeloan.avif"}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="inline-block text-[11px] font-bold text-[#094b57] bg-teal-50 px-2 py-0.5 rounded-full mb-2 uppercase">
                          {rel.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#094b57] line-clamp-2 transition mb-2">
                          {rel.title}
                        </h3>
                      </div>
                      <span className="text-xs text-[#b69455] font-semibold flex items-center gap-1 mt-3">
                        Read Guide <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    );
  }

  const currentUrl = "https://www.sksinfi.com/blogs/" + post.slug;
  const encodedTitle = encodeURIComponent(post.title);
  const encodedUrl = encodeURIComponent(currentUrl);

  return (
    <>
      {/* Reading Progress Bar */}
      <div
        className="blog-reading-bar"
        style={{ width: `${readingProgress}%` }}
      />
      <div className="min-h-screen flex flex-col bg-white text-[#333333] overflow-x-clip w-full">
        <Navbar
          onOpenEnquiry={(cat) => {
            setModalCategory(cat || post.category);
            setModalOpen(true);
          }}
        />
        <main className="flex-1 w-full pb-16" ref={articleRef}>
          {/* ================= ARTICLE HEADER ================= */}
          <section className="relative bg-gradient-to-br from-[#06323a] via-[#083d49] to-[#0a4f5e] text-white pt-10 pb-12 overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-72 h-72 rounded-full bg-[#b69455]/10 blur-2xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-4xl mx-auto">
                {/* Back to blogs link */}
                <div className="mb-5">
                  <Link
                    href="/blogs"
                    style={{ color: "rgba(255, 255, 255, 0.85)", textDecoration: "none" }}
                    className="inline-flex items-center gap-2 text-xs md:text-sm font-semibold hover:text-white transition group"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 text-[#e9c787]" />
                    <span>Back to Financial Insights</span>
                  </Link>
                </div>

                {/* Category Pill */}
                <div className="inline-block mb-4">
                  <Link
                    href={`/blogs?category=${encodeURIComponent(post.category)}`}
                    style={{
                      backgroundColor: "rgba(182, 148, 85, 0.25)",
                      color: "#e9c787",
                      border: "1px solid rgba(182, 148, 85, 0.4)",
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "6px 18px",
                      borderRadius: "9999px",
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      textDecoration: "none"
                    }}
                    className="hover:bg-white/20 transition"
                  >
                    {post.category}
                  </Link>
                </div>

                {/* Article Title */}
                <h1
                  style={{ textTransform: "none", color: "#ffffff" }}
                  className="blog-article-title text-2xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-7"
                >
                  {post.title}
                </h1>

                {/* Metadata row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-5 border-t border-white/15">
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-white/80">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#e9c787]" />
                      {post.publishedDate}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="bg-white/10 text-[#e9c787] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {post.category}
                    </span>
                  </div>

                  {/* Social Share Buttons */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-white/50 font-semibold mr-1 text-xs">Share:</span>
                    <a
                      href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-emerald-500 flex items-center justify-center transition border border-white/20"
                      title="Share on WhatsApp"
                    >
                      <i className="fab fa-whatsapp text-sm"></i>
                    </a>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-blue-600 flex items-center justify-center transition border border-white/20"
                      title="Share on LinkedIn"
                    >
                      <i className="fab fa-linkedin-in text-sm"></i>
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-white/10 text-white hover:bg-gray-900 flex items-center justify-center transition border border-white/20"
                      title="Share on X"
                    >
                      <i className="fab fa-x-twitter text-sm"></i>
                    </a>
                    <button
                      onClick={handleCopyLink}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.8)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid rgba(255,255,255,0.2)",
                        cursor: "pointer"
                      }}
                      className="hover:bg-white/20 transition"
                      title="Copy Blog Link"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= FEATURED COVER IMAGE ================= */}
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="rounded-[24px] overflow-hidden shadow-lg border border-gray-200 max-h-[480px] bg-gray-100">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover max-h-[480px]"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ================= ARTICLE BODY & SIDEBAR ================= */}
          <section className="py-4">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Executive Summary & Key Takeaways Card */}
                {post.takeaways && post.takeaways.length > 0 && (
                  <div className="bg-[#faf1e0]/85 border-l-4 border-[#b69455] p-6 md:p-8 rounded-r-[20px] mb-10 shadow-xs">
                    <h3
                      style={{ textTransform: "none", color: "#094b57" }}
                      className="text-base md:text-lg font-bold mb-4 flex items-center gap-2.5"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#b69455] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                      <span>Executive Summary &amp; Key Takeaways</span>
                    </h3>
                    <ul className="space-y-3 text-sm md:text-base text-gray-800">
                      {post.takeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span
                            style={{ backgroundColor: "rgba(182, 148, 85, 0.2)", color: "#b69455" }}
                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold"
                          >
                            ✓
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rich Blog Content */}
                <div
                  className="blog-prose-body max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Tags Cloud */}
                <div className="mt-12 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mr-2">
                      <Tag className="w-3.5 h-3.5 text-[#b69455]" />
                      Related Topics:
                    </span>
                    {post.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/blogs?search=${encodeURIComponent(tag)}`}
                        className="text-xs bg-gray-100 hover:bg-[#094b57] hover:text-white text-gray-700 px-3 py-1 rounded-full transition font-medium no-underline"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contextual Consultation Box */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #06323a 0%, #094b57 100%)",
                    color: "#ffffff",
                    borderRadius: "20px",
                    padding: "36px 40px",
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "24px",
                    marginTop: "40px",
                    boxShadow: "0 10px 25px rgba(9, 75, 87, 0.25)"
                  }}
                >
                  <div style={{ flex: "1 1 500px", minWidth: "280px" }}>
                    <h4
                      style={{
                        color: "#ffffff",
                        fontSize: "22px",
                        fontWeight: "700",
                        marginBottom: "8px",
                        lineHeight: "1.3",
                        textTransform: "none"
                      }}
                    >
                      Need Personalized Advice for Your Financial Portfolio?
                    </h4>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.88)",
                        fontSize: "14px",
                        lineHeight: "1.6",
                        margin: "0"
                      }}
                    >
                      Schedule a confidential 1-on-1 session with our senior advisors in Jaipur.
                      We compare 40+ lending institutions and curate high-yielding, tax-efficient investments.
                    </p>
                  </div>
                  <div style={{ flex: "0 0 auto" }}>
                    <button
                      onClick={() => {
                        setModalCategory(post.category);
                        setModalOpen(true);
                      }}
                      style={{
                        backgroundColor: "#b69455",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "600",
                        padding: "14px 32px",
                        borderRadius: "9999px",
                        border: "none",
                        cursor: "pointer",
                        boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                        whiteSpace: "nowrap",
                        display: "inline-block"
                      }}
                      className="hover:bg-[#a58446] transition"
                    >
                      Request Consultation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= RELATED ARTICLES ================= */}
          {relatedPosts.length > 0 && (
            <section className="py-16 bg-[#faf1e0]/40 border-t border-gray-200 mt-12">
              <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3
                        style={{ textTransform: "none", color: "#094b57" }}
                        className="text-xl md:text-2xl font-bold text-[#094b57]"
                      >
                        Explore Related Financial Insights
                      </h3>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        More articles to help guide your financial decisions
                      </p>
                    </div>
                    <Link
                      href="/blogs"
                      className="text-xs md:text-sm font-semibold text-[#094b57] hover:text-[#b69455] flex items-center gap-1 transition"
                    >
                      <span>View All Blogs</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedPosts.map((rel) => (
                      <article
                        key={rel.slug}
                        className="bg-white rounded-[20px] border border-gray-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col overflow-hidden"
                      >
                        <Link
                          href={`/blogs/${rel.slug}`}
                          className="relative block h-40 overflow-hidden bg-gray-100 group"
                        >
                          <img
                            src={rel.coverImage}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute top-3 left-3">
                            <span
                              style={{
                                backgroundColor: "rgba(9, 75, 87, 0.95)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: "700",
                                padding: "4px 10px",
                                borderRadius: "9999px",
                                letterSpacing: "0.04em",
                                display: "inline-block",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                              }}
                            >
                              {rel.category}
                            </span>
                          </div>
                        </Link>

                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mb-2">
                              <span>{rel.publishedDate}</span>
                            </div>
                            <h4
                              className="text-sm font-bold leading-snug mb-2 hover:text-[#b69455] transition line-clamp-2 min-h-[42px] flex items-start"
                              style={{ color: "#094b57", textTransform: "none" }}
                            >
                              <Link
                                href={`/blogs/${rel.slug}`}
                                style={{ color: "#094b57", textDecoration: "none" }}
                                className="hover:text-[#b69455] transition"
                              >
                                {rel.title}
                              </Link>
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 mb-3 min-h-[36px] leading-relaxed">
                              {rel.excerpt}
                            </p>
                          </div>

                          <Link
                            href={`/blogs/${rel.slug}`}
                            style={{ color: "#094b57", textDecoration: "none" }}
                            className="text-xs font-bold hover:text-[#b69455] flex items-center gap-1.5 transition pt-3 border-t border-gray-100"
                          >
                            <span>Read Full Story</span>
                            <ArrowRight className="w-3.5 h-3.5" style={{ color: "#b69455" }} />
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
      {modalOpen ? (
        <EnquiryModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          initialCategory={modalCategory}
        />
      ) : null}
    </>
  );
}
