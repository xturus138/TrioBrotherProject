import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Delete a share link
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const supabase = await createClient()
    const { token } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Delete share (only if user owns it)
    const { error } = await supabase
      .from("shares")
      .delete()
      .eq("share_token", token)
      .eq("created_by", user.user_metadata?.user_id)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to delete share link" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Share deletion error:", error)
    return NextResponse.json({ error: "Failed to delete share link" }, { status: 500 })
  }
}
