import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"

// Create a new share link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { assetId, expiresInDays } = await request.json()

    if (!assetId) {
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 })
    }

    // Verify user owns the asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id")
      .eq("id", assetId)
      .eq("uploaded_by", user.user_metadata?.user_id)
      .single()

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found or access denied" }, { status: 404 })
    }

    // Generate unique share token
    const shareToken = randomBytes(32).toString("hex")

    // Calculate expiration date
    let expiresAt = null
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + expiresInDays)
    }

    // Create share record
    const { data: share, error: shareError } = await supabase
      .from("shares")
      .insert({
        share_token: shareToken,
        asset_id: assetId,
        created_by: user.user_metadata?.user_id,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (shareError) {
      console.error("Database error:", shareError)
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      share,
      shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/share/${shareToken}`,
    })
  } catch (error) {
    console.error("Share creation error:", error)
    return NextResponse.json({ error: "Failed to create share link" }, { status: 500 })
  }
}
