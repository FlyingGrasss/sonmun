import { del, put } from "@vercel/blob";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

function isManagedBlobUrl(imageUrl: string) {
  try {
    return new URL(imageUrl).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export async function deleteAdminImage(imageUrl: string | null | undefined) {
  if (!imageUrl || !isManagedBlobUrl(imageUrl)) return;

  try {
    await del(imageUrl);
  } catch (error) {
    console.error("Admin image cleanup failed", error);
  }
}

export async function handleAdminImageUpload(request: Request) {
  try {
    const body = await request.json() as HandleUploadBody;
    if (body.type === "blob.generate-client-token" && !(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "You must be logged in as an administrator." }, { status: 401 });
    }

    const jsonResponse = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdminAuthenticated())) {
          throw new Error("You must be logged in as an administrator.");
        }
        if (!pathname.startsWith("admin/")) {
          throw new Error("Invalid upload path.");
        }

        return {
          allowedContentTypes: ALLOWED_IMAGE_TYPES,
          maximumSizeInBytes: MAX_IMAGE_SIZE,
          addRandomSuffix: true,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Admin client image upload failed", error);
    return NextResponse.json({ error: "The image could not be uploaded." }, { status: 500 });
  }
}

export async function uploadAdminImage(request: Request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "You must be logged in as an administrator." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files can be uploaded." }, { status: 400 });
    }

    const body = await request.arrayBuffer();
    if (body.byteLength === 0) {
      return NextResponse.json({ error: "No image was provided." }, { status: 400 });
    }
    if (body.byteLength > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
    }

    const { searchParams } = new URL(request.url);
    const originalName = searchParams.get("filename") || "image";
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "-");
    const blob = await put(`admin/${Date.now()}-${safeName}`, body, {
      access: "public",
      addRandomSuffix: true,
      contentType,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Admin image upload failed", error);
    return NextResponse.json({ error: "The image could not be uploaded." }, { status: 500 });
  }
}
