import { del } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Update asset (caption, folder)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { caption, folderId } = await request.json()

    // Update asset
    const { data: asset, error } = await supabase
      .from("assets")
      .update({
        caption: caption || null,
        folder_id: folderId || null,
      })
      .eq("id", id)
      .eq("uploaded_by", user.user_metadata?.user_id) // Ensure user owns the asset
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update asset" }, { status: 500 })
    }

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    console.error("Update error:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}

// Delete asset
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get asset to delete from blob
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("blob_url")
      .eq("id", id)
      .eq("uploaded_by", user.user_metadata?.user_id) // Ensure user owns the asset
      .single()

    if (fetchError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 })
    }

    // Delete from Vercel Blob
    await del(asset.blob_url)

    // Delete from database (this will cascade delete hearts and shares)
    const { error: deleteError } = await supabase
      .from("assets")
      .delete()
      .eq("id", id)
      .eq("uploaded_by", user.user_metadata?.user_id)

    if (deleteError) {
      console.error("Database error:", deleteError)
      return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ error: "Delete failed" }, { status: 500 })
  }
}
