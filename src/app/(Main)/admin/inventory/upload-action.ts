"use server";

// ============================================================
// src/app/(Main)/admin/inventory/upload-action.ts
// Cloudinary server action for uploading, compressing (~200KB), and converting images to WebP in Cdnfire folder.
// Enforces a maximum file size limit of 3MB.
// ============================================================

import { v2 as cloudinary } from "cloudinary";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB limit in bytes

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "zdikto7r",
  api_key: process.env.CLOUDINARY_API_KEY || "281644865736144",
  api_secret: process.env.CLOUDINARY_API_SECRET || "eZQxVLuoaTBvWHjYIp9FYYe3N8o",
});

export async function uploadImageToCloudinary(
  formData: FormData
): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) {
      return { success: false, message: "Please select an image file to upload." };
    }

    // Validate maximum file size (3MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return {
        success: false,
        message: `Image size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 3MB.`,
      };
    }

    // Validate image MIME type
    if (!file.type.startsWith("image/")) {
      return { success: false, message: "Selected file must be an image." };
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Cdnfire",
          resource_type: "image",
          format: "webp",
          transformation: [
            { width: 1200, height: 1200, crop: "limit" },
            { quality: "auto:good" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            console.error("[Cloudinary Upload Error]", error);
            resolve({
              success: false,
              message: error?.message || "Failed to upload image to Cloudinary.",
            });
          } else {
            resolve({
              success: true,
              url: result.secure_url,
            });
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (err) {
    console.error("[Cloudinary Exception]", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "An unexpected upload error occurred.",
    };
  }
}
