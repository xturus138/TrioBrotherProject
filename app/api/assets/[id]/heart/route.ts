import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

// Toggle heart on asset
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const userId = user.user_metadata?.user_id

    // Check if user already hearted this asset
    const { data: existingHeart } = await supabase
      .from("asset_hearts")
      .select("id")
      .eq("asset_id", id)
      .eq("user_id", userId)
      .single()

    if (existingHeart) {
      // Remove heart
      await supabase.from("asset_hearts").delete().eq("asset_id", id).eq("user_id", userId)

      // Decrement hearts count
      await supabase
        .from("assets")
        .update({ hearts: supabase.rpc("decrement_hearts", { asset_id: id }) })
        .eq("id", id)
    } else {
      // Add heart
      await supabase.from("asset_hearts").insert({
        asset_id: id,
        user_id: userId,
      })

      // Increment hearts count
      await supabase
        .from("assets")
        .update({ hearts: supabase.rpc("increment_hearts", { asset_id: id }) })
        .eq("id", id)
    }

    // Get updated asset
    const { data: asset } = await supabase.from("assets").select("hearts").eq("id", id).single()

    return NextResponse.json({
      success: true,
      hearted: !existingHeart,
      hearts: asset?.hearts || 0,
    })
  } catch (error) {
    console.error("Heart error:", error)
    return NextResponse.json({ error: "Heart action failed" }, { status: 500 })
  }
}
