import { uploadAdminImage } from "@/lib/adminUpload";

export async function POST(request: Request) {
  return uploadAdminImage(request);
}
