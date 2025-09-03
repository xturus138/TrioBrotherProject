"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SaveIcon } from "lucide-react"

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

interface Folder {
  id: string
  name: string
  created_by: string
  created_at: string
}

interface EditAssetDialogProps {
  asset: Asset
  folders: Folder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditAssetDialog({ asset, folders, open, onOpenChange, onSuccess }: EditAssetDialogProps) {
  const [caption, setCaption] = useState(asset.caption || "")
  const [folderId, setFolderId] = useState(asset.folder_id || "none")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caption: caption.trim() || null,
          folderId: folderId === "none" ? null : folderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update asset")
      }

      onSuccess()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Update failed")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Photo</DialogTitle>
          <DialogDescription>Update the caption and folder for this photo</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
            {asset.file_type.startsWith("image/") ? (
              <img
                src={asset.blob_url || "/placeholder.svg"}
                alt={asset.caption || asset.original_filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-500">Video Preview</span>
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption for your photo..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="folder">Folder</Label>
            <Select value={folderId} onValueChange={setFolderId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No folder</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {isSaving ? (
                <>
                  <SaveIcon className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
