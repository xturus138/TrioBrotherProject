import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, UserIcon, HeartIcon } from "lucide-react"

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const supabase = await createClient()
  const { token } = await params

  // Get share data with asset information
  const { data: share, error } = await supabase
    .from("shares")
    .select(`
      *,
      asset:assets(
        *,
        uploaded_by_user:users!assets_uploaded_by_fkey(name),
        folder:folders(name)
      )
    `)
    .eq("share_token", token)
    .single()

  if (error || !share) {
    notFound()
  }

  // Check if share has expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    notFound()
  }

  const asset = share.asset

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <h1 className="text-2xl font-bold text-indigo-900">BestTrio</h1>
            <Badge variant="secondary" className="ml-4 bg-indigo-100 text-indigo-800">
              Shared Photo
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="overflow-hidden">
          {/* Image Display */}
          <div className="aspect-video relative bg-gray-100">
            {asset.file_type.startsWith("image/") ? (
              <img
                src={asset.blob_url || "/placeholder.svg"}
                alt={asset.caption || asset.original_filename}
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                src={asset.blob_url}
                controls
                className="w-full h-full object-contain"
                poster="/video-thumbnail.png"
              />
            )}
          </div>

          <CardContent className="p-6">
            {/* Caption */}
            {asset.caption && (
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">{asset.caption}</h2>
              </div>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                <span>Shared by {asset.uploaded_by_user.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{new Date(asset.created_at).toLocaleDateString()}</span>
              </div>

              {asset.folder && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{asset.folder.name}</Badge>
                </div>
              )}

              <div className="flex items-center gap-2">
                <HeartIcon className="w-4 h-4" />
                <span>
                  {asset.hearts} {asset.hearts === 1 ? "heart" : "hearts"}
                </span>
              </div>
            </div>

            {/* File Info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <span>{asset.original_filename}</span>
                <span>{(asset.file_size / 1024 / 1024).toFixed(2)} MB</span>
                <span>{asset.file_type}</span>
              </div>
            </div>

            {/* Expiration Notice */}
            {share.expires_at && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  This shared link expires on {new Date(share.expires_at).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">Powered by BestTrio - Create your own memory collection</p>
        </div>
      </div>
    </div>
  )
}
