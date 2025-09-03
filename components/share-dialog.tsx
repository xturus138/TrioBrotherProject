"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CopyIcon, ShareIcon, CheckIcon, ExternalLinkIcon } from "lucide-react"

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

interface ShareDialogProps {
  asset: Asset
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShareDialog({ asset, open, onOpenChange }: ShareDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [expiresInDays, setExpiresInDays] = useState("7")
  const [isCreating, setIsCreating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateShare = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const response = await fetch("/api/shares", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetId: asset.id,
          expiresInDays: expiresInDays === "never" ? null : Number.parseInt(expiresInDays),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create share link")
      }

      const data = await response.json()
      setShareUrl(data.shareUrl)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to create share link")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy link:", error)
    }
  }

  const handleOpenLink = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  const handleClose = () => {
    setShareUrl(null)
    setError(null)
    setIsCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Photo</DialogTitle>
          <DialogDescription>Create a public link to share this photo with others</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
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

          {!shareUrl ? (
            <>
              {/* Expiration Settings */}
              <div>
                <Label htmlFor="expiration">Link Expiration</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="never">Never expires</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              {/* Create Button */}
              <Button
                onClick={handleCreateShare}
                disabled={isCreating}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isCreating ? (
                  <>
                    <ShareIcon className="w-4 h-4 mr-2 animate-spin" />
                    Creating Link...
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-4 h-4 mr-2" />
                    Create Share Link
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Share URL */}
              <div>
                <Label htmlFor="shareUrl">Share Link</Label>
                <div className="flex gap-2 mt-1">
                  <Input id="shareUrl" value={shareUrl} readOnly className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleCopyLink}>
                    {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenLink}>
                    <ExternalLinkIcon className="w-4 h-4" />
                  </Button>
                </div>
                {isCopied && <p className="text-sm text-green-600 mt-1">Link copied to clipboard!</p>}
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Anyone with this link can view your photo
                  {expiresInDays !== "never" && ` for ${expiresInDays} day${expiresInDays !== "1" ? "s" : ""}`}.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
