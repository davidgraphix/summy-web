import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Clears the cached server render for a storefront product page after an admin
 * edit, so metadata and server-rendered content reflect the change immediately.
 */
export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ success: false, error: "slug is required" }, { status: 400 });
  }
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  return NextResponse.json({ success: true, revalidated: slug });
}
