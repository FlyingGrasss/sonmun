import { handleAdminImageUpload } from "@/lib/adminUpload";

export async function POST(request: Request) {
  return handleAdminImageUpload(request);
}
