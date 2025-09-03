// app/api/upload/route.ts
import { put } from "@vercel/blob";
import { createClient } from "@/lib/supabase/server";
import { type NextRequest, NextResponse } from "next/server";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import os from "os";
import { pipeline } from "stream/promises";

// Membangun jalur biner secara manual untuk menghindari masalah resolusi Next.js
const ffmpegStaticPath = path.join(
  process.cwd(),
  "node_modules",
  "ffmpeg-static",
  "ffmpeg.exe"
);
const ffprobeStaticPath = path.join(
  process.cwd(),
  "node_modules",
  "ffprobe-static",
  "bin",
  "win32",
  "x64",
  "ffprobe.exe"
);

ffmpeg.setFfmpegPath(ffmpegStaticPath);
ffmpeg.setFfprobePath(ffprobeStaticPath);

console.log("FFmpeg path (manual):", ffmpegStaticPath);
console.log("FFprobe path (manual):", ffprobeStaticPath);

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.error("Upload Error: User is not authenticated.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from our custom users table
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.user_metadata?.user_id)
      .single();

    if (!userData) {
      console.error("Upload Error: User not found in database.");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const caption = formData.get("caption") as string;
    const folderId = formData.get("folderId") as string;

    if (!file) {
      console.error("Upload Error: No file provided in the request.");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/quicktime",
    ];
    if (!allowedTypes.includes(file.type)) {
      console.error(`Upload Error: Unsupported file type: ${file.type}`);
      return NextResponse.json(
        { error: "File type not supported" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${Math.random()
      .toString(36)
      .substring(7)}.${extension}`;

    let thumbnailUrl = null;
    const tempFilePath = path.join(os.tmpdir(), filename);

    // Simpan file stream yang masuk ke file sementara menggunakan pipeline
    const writeStream = fs.createWriteStream(tempFilePath);
    await pipeline(file.stream() as any, writeStream);

    // Proses video untuk membuat thumbnail
    if (file.type.startsWith("video/")) {
      const thumbnailName = `${timestamp}-${Math.random()
        .toString(36)
        .substring(7)}.jpeg`;
      const tempThumbnailPath = path.join(os.tmpdir(), thumbnailName);

      await new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath)
          .screenshots({
            count: 1,
            folder: os.tmpdir(),
            filename: thumbnailName,
            size: "320x240",
          })
          .on("end", () => {
            console.log("FFmpeg finished thumbnail generation.");
            fs.unlink(tempFilePath, (err) => {
              if (err)
                console.error("Failed to delete temporary video file:", err);
            });
            resolve();
          })
          .on("error", (err) => {
            console.error("FFmpeg Error:", err.message);
            fs.unlink(tempFilePath, (err) => {
              if (err)
                console.error("Failed to delete temporary video file:", err);
            });
            reject(err);
          });
      });

      // Unggah thumbnail ke Vercel Blob
      const thumbnailFile = fs.readFileSync(tempThumbnailPath);
      const thumbnailBlob = await put(thumbnailName, thumbnailFile, {
        access: "public",
      });
      thumbnailUrl = thumbnailBlob.url;
      fs.unlink(tempThumbnailPath, (err) => {
        if (err)
          console.error("Failed to delete temporary thumbnail file:", err);
      });
    }

    // Unggah file utama ke Vercel Blob
    const fileToUpload = file.type.startsWith("video/")
      ? fs.readFileSync(tempFilePath)
      : file;
    const blob = await put(filename, fileToUpload, { access: "public" });

    // Hapus file video sementara setelah diunggah
    if (file.type.startsWith("video/")) {
      fs.unlink(tempFilePath, (err) => {
        if (err) console.error("Failed to delete temporary video file:", err);
      });
    }

    // Save to database
    const { data: asset, error: dbError } = await supabase
      .from("assets")
      .insert({
        filename,
        original_filename: file.name,
        file_type: file.type,
        file_size: file.size,
        blob_url: blob.url,
        caption: caption || null,
        folder_id: folderId || null,
        uploaded_by: userData.id,
        thumbnail_url: thumbnailUrl, // Simpan URL thumbnail
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save file metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      asset,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
