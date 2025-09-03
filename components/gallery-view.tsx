"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderIcon, ImageIcon, LogOutIcon, PlusIcon } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UploadDialog } from "@/components/upload-dialog"
import { AssetCard } from "@/components/asset-card"
import { ShareDialog } from "@/components/share-dialog"

interface User {
  id: string
  name: string
  pin: string
  created_at: string
}

interface Folder {
  id: string
  name: string
  created_by: string
  created_at: string
}

interface Asset {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  blob_url: string
  caption: string | null
  folder_id: string | null
  uploaded_by: string
  hearts: number
  created_at: string
  uploaded_by_user: { name: string }
  folder: { name: string } | null
}

interface GalleryViewProps {
  currentUser: User | null
  folders: Folder[]
  assets: Asset[]
  selectedFolderId?: string
}

export function GalleryView({ currentUser, folders, assets, selectedFolderId }: GalleryViewProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [shareAsset, setShareAsset] = useState<Asset | null>(null)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const handleShare = (asset: Asset) => {
    setShareAsset(asset)
  }

  const selectedFolder = folders.find((f) => f.id === selectedFolderId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-indigo-900">BestTrio</h1>
              {currentUser && (
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                  {currentUser.name}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="text-gray-600 hover:text-gray-800 bg-transparent"
            >
              <LogOutIcon className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Folders */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 bg-transparent">
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Link
                  href="/gallery"
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    !selectedFolderId
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium">All Photos</span>
                  <Badge variant="secondary" className="ml-auto">
                    {assets.length}
                  </Badge>
                </Link>
                {folders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/gallery?folder=${folder.id}`}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      selectedFolderId === folder.id
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FolderIcon className="w-5 h-5" />
                    <span className="font-medium">{folder.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {assets.filter((a) => a.folder_id === folder.id).length}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Assets Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedFolder ? selectedFolder.name : "All Photos"}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {assets.length} {assets.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <UploadDialog folders={folders} selectedFolderId={selectedFolderId} />
              </div>

              {assets.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
                  <p className="text-gray-600 mb-4">
                    {selectedFolder
                      ? `No photos in ${selectedFolder.name} folder yet.`
                      : "Start building your memories by uploading your first photo."}
                  </p>
                  <UploadDialog folders={folders} selectedFolderId={selectedFolderId} />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      folders={folders}
                      currentUserId={currentUser?.id}
                      onShare={handleShare}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {shareAsset && <ShareDialog asset={shareAsset} open={!!shareAsset} onOpenChange={() => setShareAsset(null)} />}
    </div>
  )
}
