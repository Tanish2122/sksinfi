import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { supabase, supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let fileBuffer: Buffer | null = null;
    let fileName = "image.jpg";
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      fileName = file.name || "image.jpg";
      mimeType = file.type || "image/jpeg";
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
    } else if (contentType.includes("application/json")) {
      const json = await req.json();
      if (!json.base64) {
        return NextResponse.json({ error: "No base64 data provided" }, { status: 400 });
      }

      fileName = json.filename || "image.jpg";
      mimeType = json.mimeType || "image/jpeg";
      const base64Data = json.base64.replace(/^data:image\/\w+;base64,/, "");
      fileBuffer = Buffer.from(base64Data, "base64");
    } else {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json({ error: "File buffer is empty" }, { status: 400 });
    }

    // Limit size to 15MB
    if (fileBuffer.length > 15 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 15MB limit" }, { status: 400 });
    }

    const ext = path.extname(fileName) || ".jpg";
    const rawBase = path.basename(fileName, ext).toLowerCase().replace(/[^a-z0-9_-]/g, "");
    const safeName = `blog-${Date.now()}-${rawBase || "img"}${ext.toLowerCase()}`;

    // 1. Try Supabase Storage if configured
    const sbClient = supabaseAdmin || supabase;
    if (isSupabaseConfigured() && sbClient) {
      try {
        const bucketName = "blog-images";
        // Check or upload to bucket
        const { error: uploadError } = await sbClient.storage
          .from(bucketName)
          .upload(safeName, fileBuffer, {
            contentType: mimeType,
            upsert: true
          });

        if (!uploadError) {
          const { data: publicData } = sbClient.storage
            .from(bucketName)
            .getPublicUrl(safeName);

          if (publicData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: publicData.publicUrl,
              filename: safeName,
              storage: "supabase"
            });
          }
        }
      } catch (sbErr) {
        console.warn("Supabase storage upload error, falling back to local disk:", sbErr);
      }
    }

    // 2. Local disk fallback to public/uploads
    try {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadsDir, { recursive: true });
      const targetPath = path.join(uploadsDir, safeName);
      await fs.writeFile(targetPath, fileBuffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${safeName}`,
        filename: safeName,
        storage: "local"
      });
    } catch (diskErr) {
      console.warn("Disk write error, falling back to data URL:", diskErr);
    }

    // 3. Fallback: Data URL so the upload NEVER fails
    const dataUrl = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: safeName,
      storage: "data-url"
    });
  } catch (err: any) {
    console.error("Upload handler error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
