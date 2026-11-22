import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { BlogPost, BLOGS_DATA } from "@/data/blogsData";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const BLOGS_FILE_PATH = path.join(process.cwd(), "src", "data", "blogs.json");
const TMP_BLOGS_PATH = path.join(os.tmpdir(), "sks_blogs.json");

// Helper to read blogs from Supabase, os.tmpdir(), or disk
async function readBlogs(): Promise<BlogPost[]> {
  const sbClient = supabaseAdmin || supabase;

  // 1. Optional Supabase synchronization if configured
  if (isSupabaseConfigured() && sbClient) {
    try {
      const { data, error } = await sbClient
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((b: any) => ({
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
          coverImage: b.cover_image || b.coverImage || "/images/homeloan.avif",
          tags: Array.isArray(b.tags) ? b.tags : [],
          featured: Boolean(b.is_featured ?? b.featured),
          takeaways: Array.isArray(b.takeaways) ? b.takeaways : [],
          content: b.content || "",
          metaTitle: b.meta_title || b.metaTitle || undefined,
          metaDescription: b.meta_description || b.metaDescription || undefined
        }));
      }
    } catch (sbErr) {
      console.warn("Supabase read error, falling back to disk/tmp:", sbErr);
    }
  }

  // 2. Check os.tmpdir() sks_blogs.json (warm serverless instance fallback on Vercel)
  try {
    const tmpRaw = await fs.readFile(TMP_BLOGS_PATH, "utf8");
    const parsed = JSON.parse(tmpRaw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {}

  // 3. Fallback to src/data/blogs.json on disk
  try {
    const raw = await fs.readFile(BLOGS_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.error("Error reading blogs.json:", error);
  }

  return BLOGS_DATA || [];
}

// Helper to write blogs to disk safely (gracefully handles read-only serverless filesystems)
async function writeBlogs(blogs: BlogPost[]): Promise<void> {
  // Always update os.tmpdir()
  try {
    await fs.writeFile(TMP_BLOGS_PATH, JSON.stringify(blogs, null, 2), "utf8");
  } catch (err: any) {
    console.warn("Notice: could not write to temporary blogs file:", err?.message);
  }

  try {
    await fs.writeFile(BLOGS_FILE_PATH, JSON.stringify(blogs, null, 2), "utf8");
  } catch (err: any) {
    if (err?.code === "EROFS" || err?.message?.includes("read-only")) {
      console.warn(
        "Read-only filesystem detected (Vercel serverless runtime); safely stored in memory/tmp:",
        err.message
      );
      return;
    }
    throw err;
  }
}

// GET: Return all blogs
export async function GET() {
  try {
    const blogs = await readBlogs();
    return NextResponse.json(blogs, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0"
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to read blogs", details: error?.message },
      { status: 500 }
    );
  }
}

// POST: Create, Update, or Restore blogs
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check for "restore_defaults" action
    if (body?.action === "restore_defaults") {
      const defaultBlogs = Array.isArray(BLOGS_DATA) && BLOGS_DATA.length > 0 ? BLOGS_DATA : [];
      await writeBlogs(defaultBlogs);

      const sbClient = supabaseAdmin || supabase;
      if (isSupabaseConfigured() && sbClient) {
        try {
          for (const b of defaultBlogs) {
            await sbClient.from("blogs").upsert([{
              slug: b.slug,
              title: b.title,
              excerpt: b.excerpt,
              category: b.category,
              author_name: b.author.name,
              author_role: b.author.role,
              author_avatar: b.author.avatar,
              published_at: b.publishedDate,
              read_time: b.readTime,
              cover_image: b.coverImage,
              tags: b.tags,
              is_featured: b.featured,
              takeaways: b.takeaways,
              content: b.content,
              is_published: true
            }]);
          }
        } catch (sbErr) {
          console.warn("Supabase restore sync error:", sbErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Default articles restored successfully.",
        blogs: defaultBlogs
      });
    }

    const {
      slug,
      title,
      excerpt,
      category,
      author,
      publishedDate,
      readTime,
      coverImage,
      tags,
      featured,
      takeaways,
      content,
      originalSlug,
      metaTitle,
      metaDescription
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required fields." },
        { status: 400 }
      );
    }

    // Generate or clean slug
    const cleanSlug = (slug || title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newBlog: BlogPost = {
      slug: cleanSlug,
      title: title.trim(),
      excerpt: excerpt?.trim() || title.trim(),
      category: category || "Loans",
      author: {
        name: author?.name?.trim() || "Arun Mehta",
        role: author?.role?.trim() || "Senior Financial Consultant, SKS INFI",
        avatar: author?.avatar || "/images/user (1).png"
      },
      publishedDate:
        publishedDate ||
        new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric"
        }),
      readTime: readTime?.trim() || "5 min read",
      coverImage: coverImage?.trim() || "/images/homeloan.avif",
      tags: Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : ["Financial Advisory"],
      featured: Boolean(featured),
      takeaways: Array.isArray(takeaways)
        ? takeaways.filter(Boolean)
        : typeof takeaways === "string"
        ? takeaways.split("\n").map((t: string) => t.trim()).filter(Boolean)
        : [],
      content: content.trim(),
      metaTitle: metaTitle?.trim() || undefined,
      metaDescription: metaDescription?.trim() || undefined
    };

    // Supabase synchronization if configured
    const sbClient = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && sbClient) {
      try {
        // If slug was renamed during edit, remove the old slug from Supabase
        if (originalSlug && originalSlug.toLowerCase().trim() !== cleanSlug) {
          await sbClient
            .from("blogs")
            .delete()
            .eq("slug", originalSlug.toLowerCase().trim());
        }

        const sbPayload: any = {
          slug: newBlog.slug,
          title: newBlog.title,
          excerpt: newBlog.excerpt,
          category: newBlog.category,
          author_name: newBlog.author.name,
          author_role: newBlog.author.role,
          author_avatar: newBlog.author.avatar,
          published_at: newBlog.publishedDate,
          read_time: newBlog.readTime,
          cover_image: newBlog.coverImage,
          tags: newBlog.tags,
          is_featured: newBlog.featured,
          takeaways: newBlog.takeaways,
          content: newBlog.content,
          is_published: true,
          meta_title: newBlog.metaTitle || null,
          meta_description: newBlog.metaDescription || null
        };

        let { error: sbUpsertErr } = await sbClient.from("blogs").upsert([sbPayload]);

        if (sbUpsertErr && (sbUpsertErr.message?.includes("meta_") || sbUpsertErr.code === "PGRST204")) {
          // If columns don't exist in remote Supabase table yet, retry without them
          delete sbPayload.meta_title;
          delete sbPayload.meta_description;
          const retry = await sbClient.from("blogs").upsert([sbPayload]);
          sbUpsertErr = retry.error;
        }

        if (sbUpsertErr) {
          console.warn("Supabase blog upsert warning:", sbUpsertErr);
        }
      } catch (sbErr) {
        console.warn("Supabase blog sync notice:", sbErr);
      }
    }

    const currentBlogs = await readBlogs();

    // Check if updating an existing blog (via originalSlug or matching slug)
    const targetSlug = originalSlug || cleanSlug;
    const existingIndex = currentBlogs.findIndex(
      (b) => b.slug.toLowerCase().trim() === targetSlug.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      // Update in place
      currentBlogs[existingIndex] = newBlog;
    } else {
      // Insert new post at the top
      currentBlogs.unshift(newBlog);
    }

    await writeBlogs(currentBlogs);

    return NextResponse.json(
      {
        success: true,
        message: existingIndex >= 0 ? "Blog post updated successfully." : "Blog post published successfully.",
        blog: newBlog
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (error: any) {
    console.error("Error saving blog:", error);
    return NextResponse.json(
      { error: "Failed to save blog post", details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a blog post by slug
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let slug = searchParams.get("slug");

    // Also support JSON body if slug is not in query params
    if (!slug) {
      try {
        const body = await req.json();
        slug = body?.slug;
      } catch {}
    }

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required." }, { status: 400 });
    }

    const cleanSlug = slug.toLowerCase().trim();

    // Supabase sync if configured
    const sbClient = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && sbClient) {
      try {
        const { error: sbDelErr } = await sbClient
          .from("blogs")
          .delete()
          .eq("slug", cleanSlug);
        if (sbDelErr) {
          console.warn("Supabase blog delete warning:", sbDelErr);
        }
      } catch (sbErr) {
        console.warn("Supabase blog delete notice:", sbErr);
      }
    }

    const currentBlogs = await readBlogs();
    const filteredBlogs = currentBlogs.filter(
      (b) => b.slug.toLowerCase().trim() !== cleanSlug
    );

    await writeBlogs(filteredBlogs);

    return NextResponse.json(
      {
        success: true,
        message: `Blog '${slug}' deleted successfully.`,
        remaining: filteredBlogs.length
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (error: any) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog", details: error?.message },
      { status: 500 }
    );
  }
}
