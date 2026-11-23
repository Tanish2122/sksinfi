"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { BlogPost, getAllCategories } from "@/data/blogsData";
import ErrorBoundary from "@/components/ErrorBoundary";

interface BlogFormState {
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  authorName: string;
  authorRole: string;
  authorAvatar: string;
  publishedDate: string;
  readTime: string;
  coverImage: string;
  tags: string;
  featured: boolean;
  takeaways: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
}

const DEFAULT_BLOG_FORM: BlogFormState = {
  title: "",
  slug: "",
  excerpt: "",
  category: "",
  authorName: "SKS INFI",
  authorRole: "Editorial Team",
  authorAvatar: "",
  publishedDate: "",
  readTime: "",
  coverImage: "/images/homeloan.avif",
  tags: "Finance, Advisory, SKS INFI",
  featured: false,
  takeaways: "",
  content: "",
  metaTitle: "",
  metaDescription: ""
};

const PRESET_COVERS = [
  { label: "Home Loan", url: "/images/homeloan.avif" },
  { label: "Mutual Fund & SIP", url: "/images/mutual_fund_sip_cover.jpg" },
  { label: "Business Loans", url: "/images/msme_business_loan_cover.jpg" },
  { label: "Real Estate", url: "/images/nri_real_estate_cover.jpg" },
  { label: "Insurance", url: "/images/factory_insurance_cover.jpg" },
  { label: "Tax Planning", url: "/images/tax_planning_cover.jpg" },
  { label: "Corporate Finance", url: "/img/aboutus.png" },
  { label: "Consultant / Advisory", url: "/img/sksl.jpg" }
];

function formatDate(d?: string): string {
  if (!d) return "Recently";
  const trimmed = d.trim();
  if (trimmed.includes("T") || !isNaN(Date.parse(trimmed))) {
    try {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return parsed.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        });
      }
    } catch {}
  }
  return trimmed;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "blogs" | "contact" | "loan" | "partner" | "banner"
  >("blogs");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- Leads & Banners State ---
  const [contactLeads, setContactLeads] = useState<any[]>([]);
  const [partnerLeads, setPartnerLeads] = useState<any[]>([]);
  const [loanLeads, setLoanLeads] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([
    { id: 1, homeslider: "homeloan (1).jpg" },
    { id: 2, homeslider: "mortageloan.jpg" }
  ]);
  const [showAddBannerModal, setShowAddBannerModal] = useState(false);
  const [newBannerName, setNewBannerName] = useState("");

  // --- Blogs Management State ---
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [blogsLoading, setBlogsLoading] = useState(false);
  const [blogSearch, setBlogSearch] = useState("");
  const [blogCategoryFilter, setBlogCategoryFilter] = useState("All");
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogForm, setBlogForm] = useState<BlogFormState>(DEFAULT_BLOG_FORM);
  const [blogSaving, setBlogSaving] = useState(false);
  const [blogModalTab, setBlogModalTab] = useState<"edit" | "preview">("edit");
  const [editorMode, setEditorMode] = useState<"rich" | "html">("rich");
  const editorRef = React.useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const savedSelectionRef = React.useRef<Range | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const coverFileInputRef = React.useRef<HTMLInputElement>(null);
  const inlineFileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Upload failed with status ${res.status}`);
      }
      const data = await res.json();
      return data.url;
    } catch (err: any) {
      alert("Failed to upload image: " + err.message);
      return null;
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        setBlogForm((prev) => ({ ...prev, coverImage: url }));
        setNotification({
          type: "success",
          message: "Cover image uploaded successfully!"
        });
      }
    } finally {
      setUploadingCover(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleInlineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInline(true);
    setActiveDropdown(null);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        insertCustomHtml(
          `<img src="${url}" alt="${file.name.replace(/[^a-zA-Z0-9 ]/g, ' ')}" style="width:100%; max-width:760px; height:auto; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0; display:block;" /><p><br></p>`
        );
        setNotification({
          type: "success",
          message: "Image inserted into article!"
        });
      }
    } finally {
      setUploadingInline(false);
      if (e.target) e.target.value = "";
    }
  };

  const saveSelection = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    if (typeof window !== "undefined" && savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      saveSelection();
      setActiveDropdown(name);
    }
  };

  // Close toolbar dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".editor-toolbar-dropdown")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Sync contentEditable when modal opens, editorMode switches, or editingBlog changes
  useEffect(() => {
    if (showBlogModal && editorRef.current && editorMode === "rich") {
      const targetContent =
        blogForm.content && blogForm.content.trim() !== ""
          ? blogForm.content
          : "<p><br></p>";
      if (editorRef.current.innerHTML !== targetContent) {
        editorRef.current.innerHTML = targetContent;
      }
    }
  }, [showBlogModal, editorMode, editingBlog]);

  const executeEditorCommand = (command: string, value: string | undefined = undefined) => {
    if (typeof document !== "undefined") {
      restoreSelection();
      if (editorRef.current && document.activeElement !== editorRef.current) {
        editorRef.current.focus();
      }
      document.execCommand(command, false, value);
      if (editorRef.current) {
        const currentHtml = editorRef.current.innerHTML;
        setBlogForm((prev) => ({
          ...prev,
          content: currentHtml
        }));
      }
      setActiveDropdown(null);
    }
  };

  const insertCustomHtml = (html: string) => {
    if (typeof document !== "undefined") {
      restoreSelection();
      if (editorRef.current) {
        editorRef.current.focus();
        const success = document.execCommand("insertHTML", false, html);
        if (!success) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const el = document.createElement("div");
            el.innerHTML = html;
            const frag = document.createDocumentFragment();
            while (el.firstChild) {
              frag.appendChild(el.firstChild);
            }
            range.insertNode(frag);
          } else {
            editorRef.current.innerHTML += html;
          }
        }
        setBlogForm((prev) => ({
          ...prev,
          content: editorRef.current?.innerHTML || ""
        }));
      }
      setActiveDropdown(null);
    }
  };

  // Robust Clipboard Paste Handler
  const handleEditorPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    // If user pasted an image file directly (screenshot or copied file)
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/")) {
        e.preventDefault();
        uploadImageFile(file).then((url) => {
          if (url) {
            insertCustomHtml(
              `<img src="${url}" alt="Pasted image" style="width:100%; max-width:760px; height:auto; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0; display:block;" /><p><br></p>`
            );
            setNotification({
              type: "success",
              message: "Pasted image uploaded and inserted!"
            });
          }
        });
        return;
      }
    }

    e.preventDefault();

    const clipboardHtml = e.clipboardData.getData("text/html");
    const clipboardText = e.clipboardData.getData("text/plain");

    let contentToInsert = "";

    if (clipboardHtml && clipboardHtml.trim() !== "") {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(clipboardHtml, "text/html");
        
        // Strip out scripts, styles, links, iframes for security and clean styling
        const unwanted = doc.querySelectorAll("script, style, meta, link, noscript, iframe");
        unwanted.forEach((el) => el.remove());

        const cleanBody = doc.body ? doc.body.innerHTML : clipboardHtml;
        contentToInsert = cleanBody.trim() || clipboardText;
      } catch {
        contentToInsert = clipboardHtml;
      }
    } else if (clipboardText) {
      const paragraphs = clipboardText
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      if (paragraphs.length > 1) {
        contentToInsert = paragraphs
          .map((p) => `<p>${p.replace(/\r?\n/g, "<br>")}</p>`)
          .join("");
      } else if (clipboardText.includes("\n")) {
        contentToInsert = `<p>${clipboardText.replace(/\r?\n/g, "<br>")}</p>`;
      } else {
        contentToInsert = clipboardText;
      }
    }

    if (!contentToInsert) return;

    if (editorRef.current) {
      editorRef.current.focus();

      if (
        !editorRef.current.innerHTML ||
        editorRef.current.innerHTML.trim() === "" ||
        editorRef.current.innerHTML === "<p><br></p>"
      ) {
        editorRef.current.innerHTML = contentToInsert;
      } else {
        const inserted = document.execCommand("insertHTML", false, contentToInsert);
        if (!inserted) {
          const sel = window.getSelection();
          if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            range.deleteContents();
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = contentToInsert;
            const frag = document.createDocumentFragment();
            while (tempDiv.firstChild) {
              frag.appendChild(tempDiv.firstChild);
            }
            range.insertNode(frag);
          } else {
            editorRef.current.innerHTML += contentToInsert;
          }
        }
      }

      const updated = editorRef.current.innerHTML;
      setBlogForm((prev) => ({
        ...prev,
        content: updated
      }));
    }
  };

  // Dedicated Toolbar Paste Action (Mobile / Desktop Quick Paste)
  const handleToolbarPaste = async () => {
    try {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      const text = await navigator.clipboard.readText();
      if (!text || text.trim() === "") {
        alert("Clipboard is empty or contains non-text data. You can also paste directly into the box with Ctrl+V.");
        return;
      }

      const paragraphs = text
        .split(/\r?\n\r?\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const formatted =
        paragraphs.length > 1
          ? paragraphs.map((p) => `<p>${p.replace(/\r?\n/g, "<br>")}</p>`).join("")
          : text.includes("\n")
          ? `<p>${text.replace(/\r?\n/g, "<br>")}</p>`
          : text;

      if (editorRef.current) {
        if (
          !editorRef.current.innerHTML ||
          editorRef.current.innerHTML.trim() === "" ||
          editorRef.current.innerHTML === "<p><br></p>"
        ) {
          editorRef.current.innerHTML = formatted;
        } else {
          document.execCommand("insertHTML", false, formatted);
        }
        const currentHtml = editorRef.current.innerHTML;
        setBlogForm((prev) => ({
          ...prev,
          content: currentHtml
        }));
        setNotification({
          type: "success",
          message: "Clipboard text successfully pasted into article body!"
        });
      }
    } catch {
      alert("Please click inside the editor box and press Ctrl+V (or Command+V on Mac) to paste.");
    }
  };
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Fetch blogs from API with localStorage fallback support
  const fetchBlogs = async () => {
    setBlogsLoading(true);
    try {
      const res = await fetch("/api/admin/blogs", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      });
      let serverBlogs: BlogPost[] = [];
      if (res.ok) {
        serverBlogs = await res.json();
      }

      if (Array.isArray(serverBlogs)) {
        setBlogs(serverBlogs);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("sks_custom_blogs", JSON.stringify(serverBlogs));
          } catch {}
        }
      }
    } catch (e) {
      console.error("Failed to load blogs:", e);
      if (typeof window !== "undefined") {
        const customBlogs: BlogPost[] = JSON.parse(
          localStorage.getItem("sks_custom_blogs") || "[]"
        );
        const deletedSlugs: string[] = JSON.parse(
          localStorage.getItem("sks_deleted_blog_slugs") || "[]"
        );
        setBlogs(customBlogs.filter((b) => !deletedSlugs.includes(b.slug.toLowerCase().trim())));
      }
    } finally {
      setBlogsLoading(false);
    }
  };

  // Fetch all leads & banners data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      fetchBlogs();

      if (isConfigured && supabase) {
        const { data: contacts } = await supabase
          .from("contact_enquiries")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: partners } = await supabase
          .from("partner_enquiries")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: loans } = await supabase
          .from("loan_enquiries")
          .select("*")
          .order("created_at", { ascending: false });

        if (contacts) setContactLeads(contacts);
        if (partners) setPartnerLeads(partners);
        if (loans) setLoanLeads(loans);
      } else {
        // LocalStorage fallback
        if (typeof window !== "undefined") {
          let contacts = JSON.parse(localStorage.getItem("sks_local_contacts") || "[]");
          let partners = JSON.parse(localStorage.getItem("sks_local_partners") || "[]");
          let loans = JSON.parse(localStorage.getItem("sks_local_loans") || "[]");

          if (contacts.length === 0) {
            contacts = [
              {
                id: 1,
                name: "Vikram Sharma",
                phone: "9928529222",
                email: "vikram@example.com",
                address: "New Aatish Market, Jaipur",
                message: "Need consulting for Commercial Vehicle Loan"
              },
              {
                id: 2,
                name: "Amit Mehta",
                phone: "9829012345",
                email: "amit.mehta@example.com",
                address: "Patrakar Colony, Mansarovar",
                message: "Looking for Home loan & property insurance"
              }
            ];
            localStorage.setItem("sks_local_contacts", JSON.stringify(contacts));
          }

          if (partners.length === 0) {
            partners = [
              {
                id: 1,
                name: "Ramesh Chand Agrawal",
                email: "ramesh@partner.com",
                mobile: "9414011223",
                country: "India",
                city: "Jaipur",
                product: "Loan",
                message: "Interested in becoming a business loan DSA partner"
              }
            ];
            localStorage.setItem("sks_local_partners", JSON.stringify(partners));
          }

          if (loans.length === 0) {
            loans = [
              {
                id: 1,
                name: "Pooja Verma",
                phone: "9829144556",
                email: "pooja.v@example.com",
                amount: "₹ 45,00,000",
                loan_type: "Home Loan"
              },
              {
                id: 2,
                name: "Deepak Soni",
                phone: "9785233112",
                email: "deepak@example.com",
                amount: "₹ 15,00,000",
                loan_type: "Business LOAN"
              }
            ];
            localStorage.setItem("sks_local_loans", JSON.stringify(loans));
          }

          setContactLeads(contacts);
          setPartnerLeads(partners);
          setLoanLeads(loans);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Lead Deletion Handlers ---
  const handleDelete = async (type: "contact" | "partner" | "loan" | "banner", id: any) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    if (type === "contact") {
      setContactLeads((prev) => prev.filter((item) => item.id !== id));
      if (isConfigured && supabase) {
        await supabase.from("contact_enquiries").delete().eq("id", id);
      } else {
        const stored = JSON.parse(localStorage.getItem("sks_local_contacts") || "[]");
        localStorage.setItem(
          "sks_local_contacts",
          JSON.stringify(stored.filter((i: any) => i.id !== id))
        );
      }
    } else if (type === "partner") {
      setPartnerLeads((prev) => prev.filter((item) => item.id !== id));
      if (isConfigured && supabase) {
        await supabase.from("partner_enquiries").delete().eq("id", id);
      } else {
        const stored = JSON.parse(localStorage.getItem("sks_local_partners") || "[]");
        localStorage.setItem(
          "sks_local_partners",
          JSON.stringify(stored.filter((i: any) => i.id !== id))
        );
      }
    } else if (type === "loan") {
      setLoanLeads((prev) => prev.filter((item) => item.id !== id));
      if (isConfigured && supabase) {
        await supabase.from("loan_enquiries").delete().eq("id", id);
      } else {
        const stored = JSON.parse(localStorage.getItem("sks_local_loans") || "[]");
        localStorage.setItem(
          "sks_local_loans",
          JSON.stringify(stored.filter((i: any) => i.id !== id))
        );
      }
    } else if (type === "banner") {
      setBanners((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerName) return;
    setBanners((prev) => [
      ...prev,
      {
        id: Date.now(),
        homeslider: newBannerName
      }
    ]);
    setNewBannerName("");
    setShowAddBannerModal(false);
  };

  // --- Blog Handlers ---
  const handleOpenCreateBlog = () => {
    setEditingBlog(null);
    setBlogForm({
      ...DEFAULT_BLOG_FORM,
      content: "<p><br></p>",
      publishedDate: new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric"
      })
    });
    setBlogModalTab("edit");
    setShowBlogModal(true);
  };

  const handleOpenEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog);
    setBlogForm({
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || "",
      category: blog.category,
      authorName: blog.author?.name || "SKS INFI",
      authorRole: blog.author?.role || "Editorial Team",
      authorAvatar: blog.author?.avatar || "",
      publishedDate: blog.publishedDate,
      readTime: blog.readTime || "",
      coverImage: blog.coverImage,
      tags: blog.tags.join(", "),
      featured: Boolean(blog.featured),
      takeaways: blog.takeaways.join("\n"),
      content: blog.content,
      metaTitle: blog.metaTitle || "",
      metaDescription: blog.metaDescription || ""
    });
    setBlogModalTab("edit");
    setShowBlogModal(true);
  };

  const handleDeleteBlog = async (slug: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${title}"? This will permanently remove the article from the website.`
      )
    ) {
      return;
    }

    const cleanSlug = slug.toLowerCase().trim();

    // 1. Optimistically update local React state
    setBlogs((prev) => prev.filter((b) => b.slug.toLowerCase().trim() !== cleanSlug));

    // 2. Persist deletion in browser localStorage so it stays deleted even on read-only serverless platforms
    if (typeof window !== "undefined") {
      try {
        const deletedSlugs: string[] = JSON.parse(
          localStorage.getItem("sks_deleted_blog_slugs") || "[]"
        );
        if (!deletedSlugs.includes(cleanSlug)) {
          deletedSlugs.push(cleanSlug);
          localStorage.setItem("sks_deleted_blog_slugs", JSON.stringify(deletedSlugs));
        }

        // Also remove from sks_custom_blogs if stored
        const customBlogs: BlogPost[] = JSON.parse(
          localStorage.getItem("sks_custom_blogs") || "[]"
        );
        const updatedCustom = customBlogs.filter(
          (b) => b.slug.toLowerCase().trim() !== cleanSlug
        );
        localStorage.setItem("sks_custom_blogs", JSON.stringify(updatedCustom));
      } catch (e) {
        console.warn("LocalStorage delete sync error:", e);
      }
    }

    // 3. Call server API
    try {
      const res = await fetch(`/api/admin/blogs?slug=${encodeURIComponent(cleanSlug)}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      setNotification({
        type: "success",
        message: `Article "${title}" deleted successfully.`
      });
      await fetchBlogs();
    } catch (err: any) {
      console.warn("Delete notification notice:", err);
      setNotification({
        type: "success",
        message: `Article "${title}" removed successfully.`
      });
      await fetchBlogs();
    }
  };

  const handleSaveBlog = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const liveContent =
      editorMode === "rich" && editorRef.current
        ? editorRef.current.innerHTML.trim()
        : blogForm.content.trim();

    if (
      !blogForm.title.trim() ||
      !liveContent ||
      liveContent === "<p><br></p>" ||
      liveContent === "<br>"
    ) {
      alert("Please enter both article Title and Content.");
      return;
    }

    setBlogSaving(true);
    try {
      const cleanSlug = (blogForm.slug || blogForm.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      const payload = {
        title: blogForm.title.trim(),
        slug: cleanSlug,
        excerpt: blogForm.excerpt.trim() || blogForm.title.trim(),
        category: blogForm.category,
        author: {
          name: (blogForm.authorName || "SKS INFI").trim(),
          role: (blogForm.authorRole || "Editorial Team").trim(),
          avatar: (blogForm.authorAvatar || "").trim()
        },
        publishedDate: blogForm.publishedDate.trim(),
        readTime: (blogForm.readTime || "").trim(),
        coverImage: blogForm.coverImage.trim(),
        tags: blogForm.tags,
        featured: blogForm.featured,
        takeaways: blogForm.takeaways,
        content: liveContent,
        originalSlug: editingBlog?.slug,
        metaTitle: blogForm.metaTitle.trim(),
        metaDescription: blogForm.metaDescription.trim()
      };

      // Also persist in localStorage
      if (typeof window !== "undefined") {
        try {
          // Un-delete if it was previously marked deleted
          const deletedSlugs: string[] = JSON.parse(
            localStorage.getItem("sks_deleted_blog_slugs") || "[]"
          );
          const updatedDeleted = deletedSlugs.filter(
            (s) => s !== cleanSlug && s !== editingBlog?.slug?.toLowerCase().trim()
          );
          localStorage.setItem("sks_deleted_blog_slugs", JSON.stringify(updatedDeleted));

          const savedBlog: BlogPost = {
            slug: cleanSlug,
            title: payload.title,
            excerpt: payload.excerpt,
            category: payload.category,
            author: payload.author,
            publishedDate: payload.publishedDate,
            readTime: payload.readTime,
            coverImage: payload.coverImage,
            tags:
              typeof payload.tags === "string"
                ? payload.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
                : [],
            featured: Boolean(payload.featured),
            takeaways:
              typeof payload.takeaways === "string"
                ? payload.takeaways.split("\n").map((t: string) => t.trim()).filter(Boolean)
                : [],
            content: payload.content,
            metaTitle: payload.metaTitle || undefined,
            metaDescription: payload.metaDescription || undefined
          };

          const customBlogs: BlogPost[] = JSON.parse(
            localStorage.getItem("sks_custom_blogs") || "[]"
          );
          const existingIdx = customBlogs.findIndex(
            (b) => b.slug.toLowerCase().trim() === (editingBlog?.slug || cleanSlug).toLowerCase().trim()
          );
          if (existingIdx >= 0) {
            customBlogs[existingIdx] = savedBlog;
          } else {
            customBlogs.unshift(savedBlog);
          }
          localStorage.setItem("sks_custom_blogs", JSON.stringify(customBlogs));
        } catch (lsErr) {
          console.warn("LocalStorage save error:", lsErr);
        }
      }

      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => null);

      setNotification({
        type: "success",
        message: editingBlog
          ? `Article "${data?.blog?.title || blogForm.title}" updated successfully.`
          : `Article "${data?.blog?.title || blogForm.title}" published successfully!`
      });
      setShowBlogModal(false);
      await fetchBlogs();
    } catch (err: any) {
      alert("Error saving article: " + err.message);
    } finally {
      setBlogSaving(false);
    }
  };

  const handleRestoreDefaultBlogs = async () => {
    if (
      !window.confirm(
        "Are you sure you want to restore the default financial articles? Any custom modifications will be reset."
      )
    ) {
      return;
    }

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("sks_deleted_blog_slugs");
        localStorage.removeItem("sks_custom_blogs");
      }

      const res = await fetch("/api/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore_defaults" })
      });

      if (res.ok) {
        const data = await res.json();
        setBlogs(data.blogs || []);
      }

      setNotification({
        type: "success",
        message: "Default financial advisory articles restored successfully."
      });
      await fetchBlogs();
    } catch (e: any) {
      alert("Failed to restore default articles: " + e.message);
    }
  };

  // Quick insertion helpers for rich content editor
  const insertContentSnippet = (snippet: string) => {
    setBlogForm((prev) => ({
      ...prev,
      content: prev.content + "\n\n" + snippet
    }));
  };

  // Filtered blogs list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesCat =
        blogCategoryFilter === "All" || b.category === blogCategoryFilter;
      const q = blogSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.title.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCat && matchesSearch;
    });
  }, [blogs, blogCategoryFilter, blogSearch]);

  const allCategories = getAllCategories();

  return (
    <div className="flex min-h-screen bg-[#f1f2f7] font-sans antialiased text-[#333]">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[10000] px-5 py-3 rounded-lg shadow-xl text-white text-sm font-semibold flex items-center gap-3 transition-all duration-300 ${
            notification.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          <i
            className={`fa ${
              notification.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"
            }`}
          ></i>
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-white/80 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Left Panel Sidebar */}
      <aside
        id="left-panel"
        className={`bg-[#272c33] text-white flex-shrink-0 transition-all duration-300 min-h-screen ${
          sidebarOpen ? "w-[240px]" : "w-0 overflow-hidden"
        }`}
      >
        <div className="p-4 border-b border-[#343b45]">
          <Link
            href="/"
            className="text-lg font-bold tracking-wider text-white flex items-center gap-2 no-underline"
          >
            <span className="text-[#b69455]">SKS INFI</span> ADMIN
          </Link>
        </div>

        <nav className="p-4">
          <div className="text-[11px] uppercase tracking-wider text-[#7e8d9f] font-bold mb-3">
            Menu
          </div>

          <ul className="space-y-1 text-sm list-none p-0 m-0">
            {/* Blogs Tab (Primary) */}
            <li>
              <button
                type="button"
                onClick={() => setActiveTab("blogs")}
                className={`w-full text-left px-3 py-2.5 rounded transition flex items-center justify-between border-none cursor-pointer ${
                  activeTab === "blogs"
                    ? "bg-[#b69455] text-white font-bold shadow-sm"
                    : "text-[#a4b0be] hover:bg-[#343b45] hover:text-white bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa fa-newspaper text-xs"></i>
                  <span>Blog Articles</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === "blogs"
                      ? "bg-black/25 text-white"
                      : "bg-[#343b45] text-slate-300"
                  }`}
                >
                  {blogs.length}
                </span>
              </button>
            </li>

            {/* Leads Tabs */}
            <li>
              <button
                type="button"
                onClick={() => setActiveTab("contact")}
                className={`w-full text-left px-3 py-2.5 rounded transition flex items-center justify-between border-none cursor-pointer ${
                  activeTab === "contact"
                    ? "bg-[#083d5d] text-white font-bold shadow-sm"
                    : "text-[#a4b0be] hover:bg-[#343b45] hover:text-white bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa fa-envelope text-xs"></i>
                  <span>Contact Leads</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#343b45] text-slate-300">
                  {contactLeads.length}
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActiveTab("loan")}
                className={`w-full text-left px-3 py-2.5 rounded transition flex items-center justify-between border-none cursor-pointer ${
                  activeTab === "loan"
                    ? "bg-[#083d5d] text-white font-bold shadow-sm"
                    : "text-[#a4b0be] hover:bg-[#343b45] hover:text-white bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa fa-money-bill-wave text-xs"></i>
                  <span>Loan Enquiry</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#343b45] text-slate-300">
                  {loanLeads.length}
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActiveTab("partner")}
                className={`w-full text-left px-3 py-2.5 rounded transition flex items-center justify-between border-none cursor-pointer ${
                  activeTab === "partner"
                    ? "bg-[#083d5d] text-white font-bold shadow-sm"
                    : "text-[#a4b0be] hover:bg-[#343b45] hover:text-white bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa fa-handshake text-xs"></i>
                  <span>Partner With Us</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#343b45] text-slate-300">
                  {partnerLeads.length}
                </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                onClick={() => setActiveTab("banner")}
                className={`w-full text-left px-3 py-2.5 rounded transition flex items-center justify-between border-none cursor-pointer ${
                  activeTab === "banner"
                    ? "bg-[#083d5d] text-white font-bold shadow-sm"
                    : "text-[#a4b0be] hover:bg-[#343b45] hover:text-white bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <i className="fa fa-image text-xs"></i>
                  <span>POP UP Banner</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#343b45] text-slate-300">
                  {banners.length}
                </span>
              </button>
            </li>
          </ul>

          <div className="mt-8 pt-4 border-t border-[#343b45] space-y-2">
            <Link
              href="/blogs"
              target="_blank"
              className="text-xs text-[#b69455] hover:text-[#d3b477] flex items-center gap-2 no-underline"
            >
              <i className="fa fa-arrow-up-right-from-square"></i> View Live Blog Section
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-xs text-[#a4b0be] hover:text-white flex items-center gap-2 no-underline"
            >
              <i className="fa fa-globe"></i> Visit Website
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-600 hover:text-slate-900 focus:outline-none bg-transparent border-none cursor-pointer p-1"
              title="Toggle Menu"
            >
              <i className="fa fa-bars text-lg"></i>
            </button>
            <span className="text-sm font-semibold text-slate-800">
              {activeTab === "blogs" && "Blog Articles & Editorial Management"}
              {activeTab === "contact" && "Contact Leads"}
              {activeTab === "partner" && "Partner Applications"}
              {activeTab === "loan" && "Loan Inquiries"}
              {activeTab === "banner" && "Banner & Pop-Up Images"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchAllData}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded flex items-center gap-1.5 transition border-none cursor-pointer"
              title="Refresh Data"
            >
              <i
                className={`fa fa-rotate-right ${
                  loading || blogsLoading ? "animate-spin" : ""
                }`}
              ></i>
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
              <span className="text-xs font-semibold text-slate-700">Admin Mode</span>
              <Link
                href="/"
                className="text-xs bg-[#b69455] hover:bg-[#96773d] text-white px-2.5 py-1 rounded transition no-underline flex items-center gap-1"
              >
                <i className="fa fa-house text-[11px]"></i> Home
              </Link>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-6 flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            {/* ============================================================== */}
            {/* TAB 1: BLOGS MANAGEMENT                                        */}
            {/* ============================================================== */}
            {activeTab === "blogs" && (
              <div>
                {/* Header row with Add Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-200">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 m-0">
                      Blog Articles & Guides
                    </h1>
                    <p className="text-xs text-slate-500 m-0 mt-1">
                      Publish, edit, and optimize financial articles with real-time slug routing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRestoreDefaultBlogs}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition border border-slate-300 cursor-pointer"
                      title="Restore original 6 sample advisory articles"
                    >
                      <i className="fa fa-rotate-left text-slate-500"></i>
                      <span>Restore Defaults</span>
                    </button>
                    <button
                      id="btn-add-new-article"
                      type="button"
                      onClick={handleOpenCreateBlog}
                      style={{ backgroundColor: "#b69455" }}
                      className="hover:bg-[#96773d] text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition border-none cursor-pointer"
                    >
                      <i className="fa fa-plus"></i>
                      <span>Add New Article</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
                  {/* Search Input */}
                  <div className="md:col-span-2 relative">
                    <input
                      type="text"
                      placeholder="Search articles by title, slug or tag..."
                      value={blogSearch}
                      onChange={(e) => setBlogSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-[#b69455] transition"
                    />
                    <i className="fa fa-search absolute left-3 top-3 text-slate-400 text-xs pointer-events-none"></i>
                    {blogSearch && (
                      <button
                        onClick={() => setBlogSearch("")}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  <div>
                    <select
                      value={blogCategoryFilter}
                      onChange={(e) => setBlogCategoryFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:border-[#b69455]"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "All" ? "All Categories" : cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Blog Articles Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs text-slate-700">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                        <th className="p-3 w-12 text-center">#</th>
                        <th className="p-3 w-20">Cover</th>
                        <th className="p-3">Title & URL Slug</th>
                        <th className="p-3 w-32">Category</th>
                        <th className="p-3 w-28">Date</th>
                        <th className="p-3 w-24 text-center">Featured</th>
                        <th className="p-3 w-40 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {blogsLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400">
                            <i className="fa fa-spinner fa-spin text-lg mr-2"></i> Loading articles...
                          </td>
                        </tr>
                      ) : filteredBlogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400">
                            No articles match your search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredBlogs.map((blog, idx) => (
                          <tr key={blog.slug} className="hover:bg-slate-50/80 transition">
                            <td className="p-3 text-center font-bold text-slate-400">
                              {idx + 1}
                            </td>
                            <td className="p-3">
                              <img
                                src={blog.coverImage || "/images/homeloan.avif"}
                                alt={blog.title}
                                className="w-16 h-12 object-cover rounded-md border border-slate-200"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/images/homeloan.avif";
                                }}
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1">
                                {blog.title}
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                                <span>/blogs/{blog.slug}</span>
                                <Link
                                  href={`/blogs/${blog.slug}`}
                                  target="_blank"
                                  className="text-[#b69455] hover:underline"
                                  title="Open live article"
                                >
                                  <i className="fa fa-arrow-up-right-from-square text-[10px]"></i>
                                </Link>
                              </div>
                            </td>
                            <td className="p-3">
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#eef7f8] text-[#094b57]">
                                {blog.category}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 font-medium whitespace-nowrap">
                              {formatDate(blog.publishedDate)}
                            </td>
                            <td className="p-3 text-center">
                              {blog.featured ? (
                                <span className="inline-flex items-center gap-1 text-amber-600 font-bold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full">
                                  <i className="fa fa-star text-[10px]"></i> Yes
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/blogs/${blog.slug}`}
                                  target="_blank"
                                  className="p-1.5 rounded text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                                  title="Preview live"
                                >
                                  <i className="fa fa-eye"></i>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditBlog(blog)}
                                  className="p-1.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition border-none bg-transparent cursor-pointer"
                                  title="Edit Article"
                                >
                                  <i className="fa fa-pen-to-square"></i>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBlog(blog.slug, blog.title)}
                                  className="p-1.5 rounded text-red-600 hover:text-red-800 hover:bg-red-50 transition border-none bg-transparent cursor-pointer"
                                  title="Delete Article"
                                >
                                  <i className="fa fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 2: CONTACT DETAILS                                         */}
            {/* ============================================================== */}
            {activeTab === "contact" && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
                  Contact Details
                </h1>
                <hr className="mb-6 border-slate-200" />

                <div className="overflow-x-auto">
                  <table id="customers" className="w-full">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Id</th>
                        <th>Firstname</th>
                        <th>Mobile No.</th>
                        <th>Email</th>
                        <th>Address</th>
                        <th>Message</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contactLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-500">
                            No contact inquiries found.
                          </td>
                        </tr>
                      ) : (
                        contactLeads.map((row, idx) => (
                          <tr key={row.id || idx}>
                            <td className="serial font-semibold text-center">{idx + 1}</td>
                            <td className="font-medium text-slate-900">{row.name}</td>
                            <td>
                              <a
                                href={`tel:${row.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {row.phone}
                              </a>
                            </td>
                            <td>{row.email}</td>
                            <td>{row.address || "Jaipur"}</td>
                            <td className="text-slate-600 text-xs">{row.message}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete("contact", row.id)}
                                className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition border-none cursor-pointer"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 3: PARTNER LEADS                                           */}
            {/* ============================================================== */}
            {activeTab === "partner" && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
                  Partner with Us Leads
                </h1>
                <hr className="mb-6 border-slate-200" />

                <div className="overflow-x-auto">
                  <table id="customers" className="w-full">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Id</th>
                        <th>Firstname</th>
                        <th>Email</th>
                        <th>Mobile No.</th>
                        <th>Country</th>
                        <th>City</th>
                        <th>Product</th>
                        <th>Message</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partnerLeads.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-slate-500">
                            No partner inquiries found.
                          </td>
                        </tr>
                      ) : (
                        partnerLeads.map((row, idx) => (
                          <tr key={row.id || idx}>
                            <td className="serial font-semibold text-center">{idx + 1}</td>
                            <td className="font-medium text-slate-900">{row.name}</td>
                            <td>{row.email}</td>
                            <td>
                              <a
                                href={`tel:${row.mobile}`}
                                className="text-blue-600 hover:underline"
                              >
                                {row.mobile}
                              </a>
                            </td>
                            <td>{row.country || "India"}</td>
                            <td>{row.city || "Jaipur"}</td>
                            <td>
                              <span className="font-semibold text-[#083d5d]">
                                {row.product || row.product_interest || "All"}
                              </span>
                            </td>
                            <td className="text-slate-600 text-xs">{row.message}</td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete("partner", row.id)}
                                className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition border-none cursor-pointer"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 4: LOAN ENQUIRY                                            */}
            {/* ============================================================== */}
            {activeTab === "loan" && (
              <div>
                <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
                  Loan Enquiry Details
                </h1>
                <hr className="mb-6 border-slate-200" />

                <div className="overflow-x-auto">
                  <table id="customers" className="w-full">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Id</th>
                        <th>Firstname</th>
                        <th>Mobile No.</th>
                        <th>Email</th>
                        <th>Loan Amount</th>
                        <th>Loan Type</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loanLeads.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-6 text-slate-500">
                            No loan inquiries found.
                          </td>
                        </tr>
                      ) : (
                        loanLeads.map((row, idx) => (
                          <tr key={row.id || idx}>
                            <td className="serial font-semibold text-center">{idx + 1}</td>
                            <td className="font-medium text-slate-900">{row.name}</td>
                            <td>
                              <a
                                href={`tel:${row.phone}`}
                                className="text-blue-600 hover:underline"
                              >
                                {row.phone}
                              </a>
                            </td>
                            <td>{row.email || "—"}</td>
                            <td className="font-semibold text-emerald-700">
                              {row.amount || row.loan_amount || "—"}
                            </td>
                            <td>
                              <span className="bg-[#083d5d]/10 text-[#083d5d] px-2 py-0.5 rounded text-xs font-bold">
                                {row.loan_type || row.product_name || "Loan"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete("loan", row.id)}
                                className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition border-none cursor-pointer"
                              >
                                DELETE
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* TAB 5: POP UP BANNER                                           */}
            {/* ============================================================== */}
            {activeTab === "banner" && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button
                    type="button"
                    onClick={() => setShowAddBannerModal(true)}
                    className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white px-4 py-2 rounded font-semibold text-sm transition border-none cursor-pointer"
                  >
                    POP UP Image Add
                  </button>
                </div>

                <h1 className="text-2xl font-bold text-center mb-2 text-slate-800">
                  POP UP Image
                </h1>
                <hr className="mb-6 border-slate-200" />

                <div className="overflow-x-auto">
                  <table id="customers" className="w-full">
                    <thead>
                      <tr>
                        <th style={{ width: "50px" }}>Id</th>
                        <th>Slider</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Delete</th>
                        <th style={{ width: "100px", textAlign: "center" }}>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {banners.map((row, idx) => (
                        <tr key={row.id || idx}>
                          <td className="serial font-semibold text-center">{idx + 1}</td>
                          <td>
                            <img
                              src={`/admin/upload_doc/${row.homeslider}`}
                              alt="Slider"
                              className="h-20 max-w-[200px] object-cover rounded border border-slate-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = `/img/${row.homeslider}`;
                              }}
                            />
                            <span className="text-xs text-slate-500 block mt-1">
                              {row.homeslider}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => handleDelete("banner", row.id)}
                              className="bg-[#dc3545] hover:bg-[#bb2d3b] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition border-none cursor-pointer"
                            >
                              DELETE
                            </button>
                          </td>
                          <td className="text-center">
                            <button
                              type="button"
                              onClick={() => alert(`Editing slider: ${row.homeslider}`)}
                              className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider transition border-none cursor-pointer"
                            >
                              EDIT
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* ADD / EDIT BLOG ARTICLE MODAL                                        */}
      {/* ==================================================================== */}
      {showBlogModal && (
        <ErrorBoundary
          fallback={
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(15, 23, 42, 0.65)",
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px"
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "16px",
                  padding: "32px",
                  maxWidth: "480px",
                  width: "100%",
                  textAlign: "center",
                  boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)"
                }}
              >
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#fee2e2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                </div>
                <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
                  Editor encountered an issue
                </h3>
                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "20px" }}>
                  The editor recovered safely. You can reopen it or paste your article content directly.
                </p>
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: "#094b57",
                    color: "#ffffff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "13px",
                    cursor: "pointer"
                  }}
                >
                  Close Modal
                </button>
              </div>
            </div>
          }
        >
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(15, 23, 42, 0.65)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              maxWidth: "880px",
              width: "100%",
              maxHeight: "92vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.15)",
              overflow: "hidden",
              border: "1px solid #edf2f7",
              fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
          >
            {/* Modal Header (Clean White Header matching reference) */}
            <div
              style={{
                backgroundColor: "#ffffff",
                padding: "20px 28px 16px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid #f1f5f9",
                flexShrink: 0
              }}
            >
              <h2
                style={{
                  fontSize: "17px",
                  fontWeight: "800",
                  letterSpacing: "0.02em",
                  color: "#1e293b",
                  textTransform: "uppercase",
                  margin: 0,
                  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                }}
              >
                {editingBlog ? "EDIT ARTICLE" : "CREATE NEW ARTICLE"}
              </h2>

              <button
                type="button"
                onClick={() => setShowBlogModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  lineHeight: 1,
                  transition: "color 0.15s ease"
                }}
                onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.color = "#475569")}
                onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.color = "#94a3b8")}
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, backgroundColor: "#ffffff" }}>
              {blogModalTab === "edit" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Row 1: ARTICLE TITLE & CATEGORY */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase", marginBottom: "8px" }}>
                        ARTICLE TITLE
                      </label>
                      <input
                        type="text"
                        placeholder="Enter catchy title..."
                        value={blogForm.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setBlogForm((prev) => ({
                            ...prev,
                            title: newTitle,
                            slug:
                              !editingBlog && (!prev.slug || prev.slug === "")
                                ? newTitle
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, "-")
                                    .replace(/^-+|-+$/g, "")
                                : prev.slug
                          }));
                        }}
                        style={{
                          width: "100%",
                          backgroundColor: "#f4f6f8",
                          border: "1px solid #edf2f7",
                          borderRadius: "12px",
                          padding: "13px 16px",
                          fontSize: "14px",
                          color: "#1e293b",
                          outline: "none",
                          transition: "all 0.15s ease"
                        }}
                        required
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase", marginBottom: "8px" }}>
                        CATEGORY
                      </label>
                      <input
                        type="text"
                        list="cat-suggestions"
                        placeholder="e.g. Health Tips"
                        value={blogForm.category}
                        onChange={(e) => setBlogForm((prev) => ({ ...prev, category: e.target.value }))}
                        style={{
                          width: "100%",
                          backgroundColor: "#f4f6f8",
                          border: "1px solid #edf2f7",
                          borderRadius: "12px",
                          padding: "13px 16px",
                          fontSize: "14px",
                          color: "#1e293b",
                          outline: "none",
                          transition: "all 0.15s ease"
                        }}
                      />
                      <datalist id="cat-suggestions">
                        <option value="Loans" />
                        <option value="Investments" />
                        <option value="NRI Advisory" />
                        <option value="Business Loans" />
                        <option value="Insurance" />
                        <option value="Taxation" />
                      </datalist>
                    </div>
                  </div>

                  {/* Row 2: EXCERPT (SHORT SUMMARY) */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase", marginBottom: "8px" }}>
                      EXCERPT (SHORT SUMMARY)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="A brief summary for the blog list..."
                      value={blogForm.excerpt}
                      onChange={(e) => setBlogForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                      style={{
                        width: "100%",
                        backgroundColor: "#f4f6f8",
                        border: "1px solid #edf2f7",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        fontSize: "14px",
                        color: "#1e293b",
                        outline: "none",
                        lineHeight: "1.5",
                        minHeight: "56px",
                        resize: "vertical"
                      }}
                    />
                  </div>

                  {/* Row 3: CONTENT (RICH TEXT) */}
                  <div>
                    <label style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase", marginBottom: "8px" }}>
                      CONTENT (RICH TEXT)
                    </label>

                    {/* Rich Editor Outer Card (Matching User Screenshot) */}
                    <div
                      onClick={() => {
                        if (editorMode === "rich" && editorRef.current) {
                          editorRef.current.focus();
                        }
                      }}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        cursor: "text"
                      }}
                    >
                      {/* Comprehensive WYSIWYG Toolbar Matching Exact Screenshot */}
                      <div
                        style={{
                          backgroundColor: "#f8fafc",
                          borderBottom: "1px solid #e2e8f0",
                          padding: "6px 10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px",
                          flexWrap: "wrap",
                          position: "relative",
                          userSelect: "none"
                        }}
                        className="editor-toolbar-dropdown"
                      >
                        {/* 1. Mode / Pen with dropdown */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("pen_mode")}
                            title="Editor Mode"
                            style={{
                              backgroundColor: activeDropdown === "pen_mode" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#334155",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "pen_mode" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "180px", padding: "4px 0" }}>
                              <button
                                type="button"
                                onClick={() => { setEditorMode("rich"); setActiveDropdown(null); }}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: editorMode === "rich" ? "#f1f5f9" : "transparent", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#094b57", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <i className="fa fa-font"></i> Visual Editor Mode
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editorMode === "rich" && editorRef.current) {
                                    setBlogForm((prev) => ({ ...prev, content: editorRef.current!.innerHTML }));
                                  }
                                  setEditorMode("html");
                                  setActiveDropdown(null);
                                }}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: editorMode === "html" ? "#f1f5f9" : "transparent", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#334155", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <i className="fa fa-code"></i> HTML Source View
                              </button>
                              <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }} />
                              <button
                                type="button"
                                onClick={() => { handleToolbarPaste(); setActiveDropdown(null); }}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "500", color: "#475569", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <i className="fa fa-paste"></i> Paste Clipboard Text
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 2. Undo & Redo */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('undo')}
                          title="Undo (Ctrl+Z)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('redo')}
                          title="Redo (Ctrl+Y)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
                        </button>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 3. Font Family [A v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("font_family")}
                            title="Font Family"
                            style={{
                              backgroundColor: activeDropdown === "font_family" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#334155",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px",
                              fontWeight: "700",
                              fontSize: "13px"
                            }}
                          >
                            <span>A</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "font_family" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "160px", padding: "4px 0" }}>
                              {[
                                { name: "Inter / Sans Default", font: "Inter, system-ui, sans-serif" },
                                { name: "Playfair Display", font: "'Playfair Display', Georgia, serif" },
                                { name: "Georgia", font: "Georgia, serif" },
                                { name: "Arial", font: "Arial, Helvetica, sans-serif" },
                                { name: "Times New Roman", font: "'Times New Roman', serif" },
                                { name: "Courier New", font: "'Courier New', monospace" },
                                { name: "Trebuchet MS", font: "'Trebuchet MS', sans-serif" }
                              ].map((f) => (
                                <button
                                  key={f.name}
                                  type="button"
                                  onClick={() => executeEditorCommand('fontName', f.font)}
                                  style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontFamily: f.font, color: "#1e293b", cursor: "pointer" }}
                                >
                                  {f.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 4. Font Size [TT v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("font_size")}
                            title="Font Size"
                            style={{
                              backgroundColor: activeDropdown === "font_size" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#334155",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px",
                              fontWeight: "700",
                              fontSize: "12px"
                            }}
                          >
                            <span>T<span style={{ fontSize: "10px" }}>T</span></span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "font_size" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "140px", padding: "4px 0" }}>
                              {[
                                { label: "12px - Small", size: "1" },
                                { label: "14px - Body", size: "2" },
                                { label: "16px - Standard", size: "3" },
                                { label: "18px - Large", size: "4" },
                                { label: "22px - Subtitle", size: "5" },
                                { label: "28px - Title", size: "6" },
                                { label: "34px - Huge", size: "7" }
                              ].map((s) => (
                                <button
                                  key={s.label}
                                  type="button"
                                  onClick={() => executeEditorCommand('fontSize', s.size)}
                                  style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#1e293b", cursor: "pointer" }}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 5. Format / Headings [Normal v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("format_block")}
                            title="Paragraph / Headings"
                            style={{
                              backgroundColor: activeDropdown === "format_block" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 7px",
                              color: "#334155",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              height: "28px",
                              fontWeight: "600",
                              fontSize: "12px"
                            }}
                          >
                            <span>Normal</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "format_block" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "170px", padding: "4px 0" }}>
                              {[
                                { label: "Normal (P)", tag: "<p>", style: { fontSize: "13px" } },
                                { label: "Heading 1 (H1)", tag: "<h1>", style: { fontSize: "18px", fontWeight: "700" } },
                                { label: "Heading 2 (H2)", tag: "<h2>", style: { fontSize: "16px", fontWeight: "700" } },
                                { label: "Heading 3 (H3)", tag: "<h3>", style: { fontSize: "14px", fontWeight: "600" } },
                                { label: "Heading 4 (H4)", tag: "<h4>", style: { fontSize: "13px", fontWeight: "600" } },
                                { label: "Blockquote", tag: "<blockquote>", style: { fontSize: "13px", fontStyle: "italic" } },
                                { label: "Code Block", tag: "<pre>", style: { fontSize: "12px", fontFamily: "monospace" } }
                              ].map((h) => (
                                <button
                                  key={h.label}
                                  type="button"
                                  onClick={() => executeEditorCommand('formatBlock', h.tag)}
                                  style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", color: "#1e293b", cursor: "pointer", ...h.style }}
                                >
                                  {h.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 6. Bold */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('bold')}
                          title="Bold (Ctrl+B)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#1e293b", cursor: "pointer", fontWeight: "800", fontSize: "13px", minWidth: "26px", height: "28px" }}
                        >
                          B
                        </button>

                        {/* 7. Italic */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('italic')}
                          title="Italic (Ctrl+I)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#1e293b", cursor: "pointer", fontStyle: "italic", fontFamily: "serif", fontSize: "14px", minWidth: "26px", height: "28px" }}
                        >
                          I
                        </button>

                        {/* 8. Underline */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('underline')}
                          title="Underline (Ctrl+U)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#1e293b", cursor: "pointer", textDecoration: "underline", fontSize: "13px", minWidth: "26px", height: "28px" }}
                        >
                          U
                        </button>

                        {/* 9. Strikethrough */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('strikeThrough')}
                          title="Strikethrough"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#1e293b", cursor: "pointer", textDecoration: "line-through", fontSize: "13px", minWidth: "26px", height: "28px" }}
                        >
                          S
                        </button>

                        {/* 10. Text Color [A_] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("text_color")}
                            title="Text Color"
                            style={{
                              backgroundColor: activeDropdown === "text_color" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#094b57",
                              cursor: "pointer",
                              display: "inline-flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "26px",
                              height: "28px",
                              fontWeight: "700",
                              fontSize: "12px"
                            }}
                          >
                            <span style={{ lineHeight: 1 }}>A</span>
                            <div style={{ width: "12px", height: "3px", backgroundColor: "#b69455", marginTop: "1px", borderRadius: "1px" }} />
                          </button>
                          {activeDropdown === "text_color" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", padding: "10px", width: "180px" }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Text Color</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", marginBottom: "10px" }}>
                                {["#000000", "#094b57", "#b69455", "#334155", "#64748b", "#dc2626", "#16a34a", "#2563eb", "#ea580c", "#7c3aed"].map((c) => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => executeEditorCommand('foreColor', c)}
                                    style={{ width: "24px", height: "24px", borderRadius: "4px", backgroundColor: c, border: "1px solid rgba(0,0,0,0.15)", cursor: "pointer" }}
                                    title={c}
                                  />
                                ))}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const custom = prompt("Enter hex color code (e.g. #094b57):", "#094b57");
                                  if (custom) executeEditorCommand('foreColor', custom);
                                }}
                                style={{ width: "100%", padding: "5px", border: "1px solid #e2e8f0", borderRadius: "4px", background: "#f8fafc", fontSize: "11px", color: "#334155", cursor: "pointer", fontWeight: "600" }}
                              >
                                Custom Color...
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 11. Highlight Background Pen */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("hilite_color")}
                            title="Highlight Text Color"
                            style={{
                              backgroundColor: activeDropdown === "hilite_color" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#d97706",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "26px",
                              height: "28px"
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5 4 4"/><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </button>
                          {activeDropdown === "hilite_color" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", padding: "10px", width: "180px" }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Highlight Color</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", marginBottom: "8px" }}>
                                {[
                                  { color: "#fef08a", name: "Yellow" },
                                  { color: "#bbf7d0", name: "Green" },
                                  { color: "#a5f3fc", name: "Cyan" },
                                  { color: "#fed7aa", name: "Orange" },
                                  { color: "#fbcfe8", name: "Pink" },
                                  { color: "#e2e8f0", name: "Gray" },
                                  { color: "transparent", name: "Clear" }
                                ].map((h) => (
                                  <button
                                    key={h.name}
                                    type="button"
                                    onClick={() => executeEditorCommand('hiliteColor', h.color)}
                                    style={{ width: "32px", height: "24px", borderRadius: "4px", backgroundColor: h.color === "transparent" ? "#ffffff" : h.color, border: "1px solid #cbd5e1", cursor: "pointer", fontSize: "10px", fontWeight: "600", color: "#334155" }}
                                    title={h.name}
                                  >
                                    {h.color === "transparent" ? "✕" : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 12. Link Chain */}
                        <button
                          type="button"
                          onClick={() => {
                            saveSelection();
                            const u = prompt("Enter web link URL (e.g. https://www.sksinfi.com):");
                            if (u) executeEditorCommand('createLink', u);
                          }}
                          title="Insert Hyperlink"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        </button>

                        {/* 13. Image [Img v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("image_dropdown")}
                            title="Insert Image"
                            style={{
                              backgroundColor: activeDropdown === "image_dropdown" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "image_dropdown" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "230px", padding: "6px 0" }}>
                              {/* Hidden file input for inline toolbar upload */}
                              <input
                                ref={inlineFileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleInlineFileUpload}
                                style={{ display: "none" }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  inlineFileInputRef.current?.click();
                                  setActiveDropdown(null);
                                }}
                                style={{ width: "100%", padding: "8px 14px", border: "none", background: "#f8fafc", textAlign: "left", fontSize: "12px", fontWeight: "700", color: "#094b57", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b69455" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                <span>Upload Image from Device...</span>
                              </button>
                              <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }} />
                              <button
                                type="button"
                                onClick={() => {
                                  const u = prompt("Enter image URL or path (e.g. /images/homeloan.avif):");
                                  if (u) {
                                    insertCustomHtml(`<img src="${u}" alt="Financial article diagram" style="width:100%; max-width:760px; height:auto; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0;" /><p><br></p>`);
                                  }
                                }}
                                style={{ width: "100%", padding: "7px 14px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#475569", cursor: "pointer" }}
                              >
                                🌐 Insert Image from URL...
                              </button>
                              <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "4px 0" }} />
                              <div style={{ padding: "4px 12px", fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Preset Images:</div>
                              {[
                                { name: "Home Loan Banner", url: "/images/homeloan.avif" },
                                { name: "Mutual Fund & SIP", url: "/images/mutual_fund_sip_cover.jpg" },
                                { name: "Used Car Loan", url: "/images/used_car_loan_cover.jpg" },
                                { name: "Commercial Vehicle", url: "/images/commercial_vehicle_cover.jpg" },
                                { name: "Machinery Loan", url: "/images/machinery_loan_cover.jpg" }
                              ].map((p) => (
                                <button
                                  key={p.name}
                                  type="button"
                                  onClick={() => insertCustomHtml(`<img src="${p.url}" alt="${p.name}" style="width:100%; max-width:760px; height:auto; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0;" /><p><br></p>`)}
                                  style={{ width: "100%", padding: "6px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#334155", cursor: "pointer" }}
                                >
                                  {p.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 14. Film / Video [Film v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("video_dropdown")}
                            title="Insert Video Embed"
                            style={{
                              backgroundColor: activeDropdown === "video_dropdown" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="15" x="2" y="4.5" rx="2"/><polyline points="2 9.5 22 9.5"/><polyline points="2 14.5 22 14.5"/><line x1="7" y1="4.5" x2="7" y2="9.5"/><line x1="17" y1="4.5" x2="17" y2="9.5"/></svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "video_dropdown" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "220px", padding: "6px 0" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  const url = prompt("Enter YouTube video link (e.g. https://www.youtube.com/watch?v=...):");
                                  if (url) {
                                    let videoId = url.trim();
                                    try {
                                      const ytRegex = new RegExp("(?:youtu\\.be/|youtube\\.com/(?:embed/|v/|watch\\?v=|watch\\?.+&v=))([\\w-]{11})");
                                      const match = url.match(ytRegex);
                                      if (match && match[1]) {
                                        videoId = match[1];
                                      }
                                    } catch {}
                                    insertCustomHtml(
                                      '<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:12px; margin:24px 0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);"><iframe src="https://www.youtube.com/embed/' +
                                        videoId +
                                        '" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allowfullscreen></iframe></div><p><br></p>'
                                    );
                                  }
                                }}
                                style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", fontWeight: "600", color: "#dc2626", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                              >
                                <i className="fa fa-youtube-play"></i> Embed YouTube Video...
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 15. Emoji Smile */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("emoji_popover")}
                            title="Insert Emoji"
                            style={{
                              backgroundColor: activeDropdown === "emoji_popover" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minWidth: "26px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                          </button>
                          {activeDropdown === "emoji_popover" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", padding: "10px", width: "220px" }}>
                              <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Quick Financial Emojis</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px" }}>
                                {["💡", "📌", "🚀", "📈", "💰", "🏦", "🚗", "🏢", "🛡️", "📞", "⭐", "✅", "⚠️", "ℹ️", "📊", "📝", "🎯", "🔑", "🤝", "🏷️", "💼", "📑", "🔍", "🏆"].map((em) => (
                                  <button
                                    key={em}
                                    type="button"
                                    onClick={() => insertCustomHtml(em)}
                                    style={{ width: "28px", height: "28px", border: "1px solid #f1f5f9", background: "#f8fafc", borderRadius: "4px", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                  >
                                    {em}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 16. Code <> */}
                        <button
                          type="button"
                          onClick={() => {
                            insertCustomHtml(`<pre style="background:#0f172a; color:#f8fafc; padding:14px 18px; border-radius:8px; font-family:monospace; font-size:13px; overflow-x:auto;"><code>// Advisory calculation snippet or code here</code></pre><p><br></p>`);
                          }}
                          title="Insert Code Snippet"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        </button>

                        {/* 17. Google G Templates & Embeds [G v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("g_templates")}
                            title="Components & Advisory Templates"
                            style={{
                              backgroundColor: activeDropdown === "g_templates" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#4285F4",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px",
                              fontWeight: "800",
                              fontSize: "13px"
                            }}
                          >
                            <span style={{ color: "#4285F4" }}>G</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "g_templates" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "240px", padding: "6px 0" }}>
                              <div style={{ padding: "4px 12px", fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" }}>Pre-built Advisory Blocks:</div>
                              {[
                                {
                                  name: "📌 Key Takeaways Box",
                                  html: `<div style="background:#f0fdf4; border-left:4px solid #16a34a; padding:16px 20px; border-radius:8px; margin:20px 0;"><h4 style="color:#15803d; margin:0 0 8px 0; font-weight:700;">📌 Key Takeaways</h4><p style="color:#166534; margin:0;">Summary point 1: Lower ROI options are best through nationalized banks.<br>Summary point 2: SKS INFI handles complete documentation seamlessly.</p></div><p><br></p>`
                                },
                                {
                                  name: "💡 SKS Advisory Callout",
                                  html: `<div style="background:#eff6ff; border-left:4px solid #2563eb; padding:16px 20px; border-radius:8px; margin:20px 0;"><h4 style="color:#1d4ed8; margin:0 0 8px 0; font-weight:700;">💡 Financial Advisory Tip</h4><p style="color:#1e40af; margin:0;">Compare loan tenures and prepayment penalties before signing any bank sanction agreement.</p></div><p><br></p>`
                                },
                                {
                                  name: "⚠️ Regulatory Notice / Caution",
                                  html: `<div style="background:#fefce8; border-left:4px solid #eab308; padding:16px 20px; border-radius:8px; margin:20px 0;"><h4 style="color:#854d0e; margin:0 0 8px 0; font-weight:700;">⚠️ Important Note</h4><p style="color:#713f12; margin:0;">Interest rates are subject to RBI repo rate guidelines and individual credit profiling.</p></div><p><br></p>`
                                },
                                {
                                  name: "📊 Loan Comparison Table",
                                  html: `<table style="width:100%; border-collapse:collapse; margin:22px 0; font-size:13.5px;"><tr style="background:#094b57; color:#ffffff;"><th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Parameter</th><th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Nationalized Banks</th><th style="border:1px solid #cbd5e1; padding:10px 14px; text-align:left;">Private Banks / NBFCs</th></tr><tr><td style="border:1px solid #e2e8f0; padding:10px 14px; font-weight:600;">Interest Rate</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">Competitive Floating (8.25%+)</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">9.50% - 13.00%</td></tr><tr><td style="border:1px solid #e2e8f0; padding:10px 14px; font-weight:600;">Processing Fees</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">NIL to minimal</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">1% to 2% + GST</td></tr><tr><td style="border:1px solid #e2e8f0; padding:10px 14px; font-weight:600;">Foreclosure Charges</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">NIL (Floating loans)</td><td style="border:1px solid #e2e8f0; padding:10px 14px;">Varies</td></tr></table><p><br></p>`
                                },
                                {
                                  name: "🚀 Contact SKS INFI CTA Box",
                                  html: `<div style="background:linear-gradient(135deg, #094b57 0%, #06323a 100%); color:#ffffff; padding:26px 20px; border-radius:12px; margin:26px 0; text-align:center;"><h3 style="color:#ffffff; margin:0 0 8px 0; font-size:20px;">Ready to Explore Loan Options?</h3><p style="color:#cbd5e1; margin:0 0 16px 0; font-size:14px;">Associated with 95+ Banks & NBFCs across India. Doorstep document pickup & zero hassle.</p><a href="/contact" style="background:#b69455; color:#ffffff; padding:10px 24px; border-radius:50px; text-decoration:none; font-weight:700; display:inline-block; font-size:13px;">Connect With SKS INFI</a></div><p><br></p>`
                                }
                              ].map((item) => (
                                <button
                                  key={item.name}
                                  type="button"
                                  onClick={() => insertCustomHtml(item.html)}
                                  style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#1e293b", cursor: "pointer" }}
                                >
                                  {item.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 18. Alignment [Align v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("align_dropdown")}
                            title="Text Alignment"
                            style={{
                              backgroundColor: activeDropdown === "align_dropdown" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "align_dropdown" && (
                            <div style={{ position: "absolute", top: "32px", left: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "150px", padding: "4px 0" }}>
                              {[
                                { label: "Align Left", cmd: "justifyLeft", icon: "align-left" },
                                { label: "Align Center", cmd: "justifyCenter", icon: "align-center" },
                                { label: "Align Right", cmd: "justifyRight", icon: "align-right" },
                                { label: "Justify Full", cmd: "justifyFull", icon: "align-justify" }
                              ].map((a) => (
                                <button
                                  key={a.label}
                                  type="button"
                                  onClick={() => executeEditorCommand(a.cmd)}
                                  style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#1e293b", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                                >
                                  <i className={`fa fa-${a.icon}`}></i> {a.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 19. Indent Right */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('indent')}
                          title="Increase Indent"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 8 7 12 3 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
                        </button>

                        {/* 20. Indent Left */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('outdent')}
                          title="Decrease Indent"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 8 3 12 7 16"/><line x1="21" y1="12" x2="11" y2="12"/><line x1="21" y1="6" x2="11" y2="6"/><line x1="21" y1="18" x2="11" y2="18"/></svg>
                        </button>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 21. Bullet List */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('insertUnorderedList')}
                          title="Bulleted List"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                        </button>

                        {/* 22. Numbered List */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('insertOrderedList')}
                          title="Numbered List"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px" }}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>
                        </button>

                        {/* 23. Blockquote */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('formatBlock', '<blockquote>')}
                          title="Blockquote"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px", fontWeight: "700", fontSize: "16px", fontFamily: "serif" }}
                        >
                          “
                        </button>

                        {/* 24. Horizontal Rule */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('insertHorizontalRule')}
                          title="Insert Horizontal Divider Line"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px", fontWeight: "700", fontSize: "14px" }}
                        >
                          ―
                        </button>

                        <div style={{ width: "1px", height: "18px", backgroundColor: "#cbd5e1", margin: "0 3px" }} />

                        {/* 25. Subscript */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('subscript')}
                          title="Subscript (X₂)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px", fontWeight: "700", fontSize: "11px" }}
                        >
                          X<sub style={{ fontSize: "9px" }}>2</sub>
                        </button>

                        {/* 26. Superscript */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('superscript')}
                          title="Superscript (X²)"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#475569", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px", fontWeight: "700", fontSize: "11px" }}
                        >
                          X<sup style={{ fontSize: "9px" }}>2</sup>
                        </button>

                        {/* 27. Direction / Language [Globe v] */}
                        <div style={{ position: "relative" }}>
                          <button
                            type="button"
                            onClick={() => toggleDropdown("globe_dropdown")}
                            title="Text Direction / Language"
                            style={{
                              backgroundColor: activeDropdown === "globe_dropdown" ? "#e2e8f0" : "transparent",
                              border: "1px solid transparent",
                              borderRadius: "4px",
                              padding: "4px 6px",
                              color: "#475569",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "2px",
                              height: "28px"
                            }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </button>
                          {activeDropdown === "globe_dropdown" && (
                            <div style={{ position: "absolute", top: "32px", right: "0", zIndex: 100, backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "8px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.15)", minWidth: "160px", padding: "4px 0" }}>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editorRef.current) {
                                    editorRef.current.dir = "ltr";
                                  }
                                  setActiveDropdown(null);
                                }}
                                style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#1e293b", cursor: "pointer" }}
                              >
                                Left-to-Right (LTR)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editorRef.current) {
                                    editorRef.current.dir = "rtl";
                                  }
                                  setActiveDropdown(null);
                                }}
                                style={{ width: "100%", padding: "7px 12px", border: "none", background: "transparent", textAlign: "left", fontSize: "12px", color: "#1e293b", cursor: "pointer" }}
                              >
                                Right-to-Left (RTL)
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 28. Clear Formatting Tx */}
                        <button
                          type="button"
                          onClick={() => executeEditorCommand('removeFormat')}
                          title="Clear Text Formatting"
                          style={{ backgroundColor: "transparent", border: "none", borderRadius: "4px", padding: "4px 6px", color: "#ef4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "26px", height: "28px", fontWeight: "700", fontSize: "12px" }}
                        >
                          <span>T<span style={{ fontSize: "10px", textDecoration: "line-through" }}>x</span></span>
                        </button>
                      </div>

                      {/* Editable Content Area */}
                      {editorMode === "rich" ? (
                        <div
                          ref={editorRef}
                          contentEditable={true}
                          suppressContentEditableWarning={true}
                          tabIndex={0}
                          onPaste={handleEditorPaste}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith("image/")) {
                              const url = await uploadImageFile(file);
                              if (url) {
                                insertCustomHtml(
                                  `<img src="${url}" alt="${file.name.replace(/[^a-zA-Z0-9 ]/g, ' ')}" style="width:100%; max-width:760px; height:auto; border-radius:10px; margin:20px 0; border:1px solid #e2e8f0; display:block;" /><p><br></p>`
                                );
                                setNotification({
                                  type: "success",
                                  message: "Dropped image uploaded and inserted!"
                                });
                              }
                            }
                          }}
                          onInput={(e) => {
                            const html = e.currentTarget.innerHTML;
                            setBlogForm((prev) => ({
                              ...prev,
                              content: html
                            }));
                          }}
                          style={{
                            minHeight: "260px",
                            maxHeight: "380px",
                            overflowY: "auto",
                            padding: "18px 20px",
                            fontSize: "14.5px",
                            lineHeight: "1.7",
                            color: "#1e293b",
                            outline: "none"
                          }}
                        />
                      ) : (
                        <textarea
                          rows={12}
                          value={blogForm.content}
                          onChange={(e) => setBlogForm((prev) => ({ ...prev, content: e.target.value }))}
                          placeholder="Paste HTML or raw markdown content here..."
                          style={{
                            width: "100%",
                            minHeight: "260px",
                            padding: "16px 20px",
                            fontSize: "13px",
                            fontFamily: "monospace",
                            lineHeight: "1.6",
                            color: "#1e293b",
                            border: "none",
                            outline: "none",
                            backgroundColor: "#fafbfc"
                          }}
                        />
                      )}

                      {/* Status Bar (Matching Screenshot) */}
                      <div
                        style={{
                          backgroundColor: "#f4f6f8",
                          borderTop: "1px solid #f1f5f9",
                          padding: "8px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          fontSize: "11px",
                          color: "#94a3b8"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", letterSpacing: "0.05em" }}>
                          <span>T</span>
                          <span>RICH EDITOR ACTIVE</span>
                        </div>
                        <div>Note: Justification support is enabled for paragraphs and lists.</div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Metadata Section: URL Slug & Cover Image */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", paddingTop: "10px", borderTop: "1px solid #f1f5f9" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase", marginBottom: "8px" }}>
                        URL SLUG
                      </label>
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ backgroundColor: "#f1f5f9", border: "1px solid #edf2f7", borderRight: "none", borderRadius: "12px 0 0 12px", padding: "12px 14px", fontSize: "13px", color: "#64748b", fontFamily: "monospace", userSelect: "none" }}>
                          /blogs/
                        </span>
                        <input
                          type="text"
                          placeholder="auto-generated-slug"
                          value={blogForm.slug}
                          onChange={(e) => setBlogForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-") }))}
                          style={{ width: "100%", backgroundColor: "#f4f6f8", border: "1px solid #edf2f7", borderRadius: "0 12px 12px 0", padding: "12px 16px", fontSize: "13px", fontFamily: "monospace", color: "#1e293b", outline: "none" }}
                        />
                      </div>
                    </div>

                    <div>
                      {/* Hidden Cover Image file input */}
                      <input
                        ref={coverFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileUpload}
                        style={{ display: "none" }}
                      />

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                        <label style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#8898aa", textTransform: "uppercase" }}>
                          COVER IMAGE
                        </label>
                        <button
                          type="button"
                          onClick={() => coverFileInputRef.current?.click()}
                          disabled={uploadingCover}
                          style={{
                            backgroundColor: uploadingCover ? "#94a3b8" : "#094b57",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 14px",
                            fontSize: "12px",
                            fontWeight: "700",
                            cursor: uploadingCover ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 5px rgba(9, 75, 87, 0.2)",
                            transition: "all 0.2s"
                          }}
                        >
                          {uploadingCover ? (
                            <>
                              <i className="fa fa-spinner fa-spin"></i>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                              <span>Upload Image</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Or enter image URL (e.g. /images/homeloan.avif)"
                          value={blogForm.coverImage}
                          onChange={(e) => setBlogForm((prev) => ({ ...prev, coverImage: e.target.value }))}
                          style={{ flex: 1, backgroundColor: "#f4f6f8", border: "1px solid #edf2f7", borderRadius: "12px", padding: "12px 16px", fontSize: "13px", color: "#1e293b", outline: "none" }}
                        />
                        {blogForm.coverImage && (
                          <div style={{ position: "relative", flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                              onClick={() => coverFileInputRef.current?.click()}
                              title="Click to change image"
                              style={{ cursor: "pointer", position: "relative" }}
                            >
                              <img
                                src={blogForm.coverImage}
                                alt="Cover Preview"
                                style={{ width: "54px", height: "42px", objectFit: "cover", borderRadius: "8px", border: "2px solid #094b57" }}
                                onError={(e) => { (e.target as HTMLImageElement).src = "/images/homeloan.avif"; }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => setBlogForm((prev) => ({ ...prev, coverImage: "" }))}
                              title="Remove cover image"
                              style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#ef4444", color: "#fff", border: "none", fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Presets */}
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", marginTop: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Presets:</span>
                        {PRESET_COVERS.map((preset) => (
                          <button
                            key={preset.url}
                            type="button"
                            onClick={() => setBlogForm((prev) => ({ ...prev, coverImage: preset.url }))}
                            style={{
                              backgroundColor: blogForm.coverImage === preset.url ? "#094b57" : "#f1f5f9",
                              color: blogForm.coverImage === preset.url ? "#ffffff" : "#475569",
                              border: "none",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SEO & Search Engine Meta Tags Card */}
                  <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "16px" }}>🔍</span>
                        <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "0.05em", color: "#094b57", textTransform: "uppercase" }}>
                          SEO & Search Engine Meta Tags
                        </span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>
                        Optimizes your Google ranking and search snippet
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {/* Meta Title */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#475569", textTransform: "uppercase" }}>
                            Meta Title (Page Title Tag)
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (blogForm.title) {
                                  const trimmed = blogForm.title.trim();
                                  const withBrand = trimmed.endsWith("SKS INFI") ? trimmed : `${trimmed} | SKS INFI`;
                                  setBlogForm((prev) => ({ ...prev, metaTitle: withBrand }));
                                }
                              }}
                              style={{ background: "none", border: "none", color: "#094b57", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                            >
                              ✨ Auto-fill from Title
                            </button>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: (blogForm.metaTitle.length >= 50 && blogForm.metaTitle.length <= 60) ? "#16a34a" : blogForm.metaTitle.length > 60 ? "#dc2626" : "#64748b" }}>
                              {blogForm.metaTitle.length}/60 chars
                            </span>
                          </div>
                        </div>
                        <input
                          type="text"
                          placeholder={blogForm.title ? `${blogForm.title} | SKS INFI` : "e.g. Best Home Loan Interest Rates in Jaipur (2025) | SKS INFI"}
                          value={blogForm.metaTitle}
                          onChange={(e) => setBlogForm((prev) => ({ ...prev, metaTitle: e.target.value }))}
                          style={{ width: "100%", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#1e293b", outline: "none" }}
                        />
                      </div>

                      {/* Meta Description */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#475569", textTransform: "uppercase" }}>
                            Meta Description (Google Snippet)
                          </label>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (blogForm.excerpt) {
                                  setBlogForm((prev) => ({ ...prev, metaDescription: blogForm.excerpt.trim() }));
                                }
                              }}
                              style={{ background: "none", border: "none", color: "#094b57", fontSize: "11px", fontWeight: "700", cursor: "pointer", textDecoration: "underline" }}
                            >
                              ✨ Auto-fill from Excerpt
                            </button>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: (blogForm.metaDescription.length >= 140 && blogForm.metaDescription.length <= 160) ? "#16a34a" : blogForm.metaDescription.length > 160 ? "#dc2626" : "#64748b" }}>
                              {blogForm.metaDescription.length}/160 chars
                            </span>
                          </div>
                        </div>
                        <textarea
                          rows={2}
                          placeholder={blogForm.excerpt || "Enter an engaging 140-160 character summary that entices users to click on search engines..."}
                          value={blogForm.metaDescription}
                          onChange={(e) => setBlogForm((prev) => ({ ...prev, metaDescription: e.target.value }))}
                          style={{ width: "100%", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px", fontSize: "13px", color: "#1e293b", outline: "none", resize: "vertical" }}
                        />
                      </div>

                      {/* Live Google Search Result Preview */}
                      <div style={{ marginTop: "4px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 14px" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                          Google Search Result Preview:
                        </div>
                        <div style={{ fontSize: "12px", color: "#202124", display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px" }}>
                          <span>https://www.sksinfi.com › blogs › {blogForm.slug || "article-slug"}</span>
                        </div>
                        <div style={{ fontSize: "16px", color: "#1a0dab", fontWeight: "500", lineHeight: "1.3", cursor: "pointer", textDecoration: "underline" }}>
                          {blogForm.metaTitle || (blogForm.title ? `${blogForm.title} | SKS INFI` : "Article Title | SKS INFI")}
                        </div>
                        <div style={{ fontSize: "13px", color: "#4d5156", marginTop: "3px", lineHeight: "1.4" }}>
                          {blogForm.metaDescription || blogForm.excerpt || "Meta description snippet will appear here on Google search results. Make it informative and click-worthy."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Featured Article Row */}
                  <div style={{ paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", fontWeight: "600", color: "#1e293b", padding: "10px 16px", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <input
                        type="checkbox"
                        checked={blogForm.featured}
                        onChange={(e) => setBlogForm((prev) => ({ ...prev, featured: e.target.checked }))}
                        style={{ width: "18px", height: "18px", accentColor: "#b69455", cursor: "pointer" }}
                      />
                      <span>⭐ Mark as Featured Article (Highlighted on Blog Index)</span>
                    </label>
                  </div>
                </div>
              ) : (
                /* LIVE ARTICLE PREVIEW TAB */
                <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                    <span
                      style={{
                        padding: "4px 12px",
                        borderRadius: "50px",
                        fontWeight: "700",
                        backgroundColor: "rgba(9, 75, 87, 0.1)",
                        color: "#094b57",
                        fontSize: "11px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}
                    >
                      {blogForm.category}
                    </span>
                    <span style={{ color: "#64748b" }}>{formatDate(blogForm.publishedDate)}</span>
                  </div>

                  <h1 style={{ fontSize: "26px", fontWeight: "700", color: "#094b57", lineHeight: 1.3, margin: 0 }}>
                    {blogForm.title || "Untitled Article"}
                  </h1>

                  {blogForm.excerpt && (
                    <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, fontStyle: "italic", margin: 0 }}>
                      {blogForm.excerpt}
                    </p>
                  )}

                  {(blogForm.metaTitle || blogForm.metaDescription) && (
                    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", fontSize: "12px", color: "#64748b" }}>
                      <strong style={{ color: "#094b57" }}>🔍 SEO Meta:</strong>{" "}
                      {blogForm.metaTitle && <span>Title: &ldquo;{blogForm.metaTitle}&rdquo; &bull; </span>}
                      {blogForm.metaDescription && <span>Snippet: &ldquo;{blogForm.metaDescription}&rdquo;</span>}
                    </div>
                  )}

                  {blogForm.coverImage && (
                    <img
                      src={blogForm.coverImage}
                      alt={blogForm.title}
                      style={{ width: "100%", maxHeight: "320px", objectFit: "cover", borderRadius: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/homeloan.avif";
                      }}
                    />
                  )}

                  <div
                    style={{ lineHeight: 1.7, fontSize: "14px", color: "#334155" }}
                    dangerouslySetInnerHTML={{ __html: blogForm.content }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderTop: "1px solid #f1f5f9",
                padding: "16px 28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexShrink: 0
              }}
            >
              <button
                type="button"
                onClick={() => {
                  if (blogModalTab === "edit" && editorRef.current && editorMode === "rich") {
                    const html = editorRef.current.innerHTML;
                    setBlogForm((prev) => ({ ...prev, content: html }));
                  }
                  setBlogModalTab(blogModalTab === "edit" ? "preview" : "edit");
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "12.5px",
                  fontWeight: "600",
                  color: "#094b57",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <i className="fa-solid fa-eye text-xs"></i>
                <span>{blogModalTab === "edit" ? "Preview Formatted Layout" : "Back to Editor"}</span>
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  style={{
                    padding: "10px 20px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#64748b",
                    backgroundColor: "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveBlog()}
                  disabled={blogSaving}
                  style={{
                    padding: "10px 24px",
                    backgroundColor: "#094b57",
                    color: "#ffffff",
                    borderRadius: "10px",
                    border: "none",
                    fontSize: "13px",
                    fontWeight: "700",
                    cursor: blogSaving ? "not-allowed" : "pointer",
                    opacity: blogSaving ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 2px 4px rgba(9, 75, 87, 0.2)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {blogSaving && <i className="fa fa-spinner fa-spin"></i>}
                  <span>
                    {editingBlog
                      ? blogSaving
                        ? "Saving Changes..."
                        : "Save Article Changes"
                      : blogSaving
                      ? "Publishing..."
                      : "Publish Article Now"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </ErrorBoundary>
      )}

      {/* ==================================================================== */}
      {/* ADD BANNER MODAL                                                     */}
      {/* ==================================================================== */}
      {showAddBannerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Add POP UP Image</h3>
            <form onSubmit={handleAddBanner}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Image File Name or Path (in admin/upload_doc)
                </label>
                <input
                  type="text"
                  placeholder="e.g. homeloan (1).jpg or mortageloan.jpg"
                  value={newBannerName}
                  onChange={(e) => setNewBannerName(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#083d5d]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBannerModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-600 hover:bg-slate-50 border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#083d5d] text-white rounded text-sm font-semibold hover:bg-[#062c43] border-none cursor-pointer"
                >
                  Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
