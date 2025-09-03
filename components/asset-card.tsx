"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  VideoIcon,
  HeartIcon,
  ShareIcon,
  MoreVerticalIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
} from "lucide-react";
import { EditAssetDialog } from "@/components/edit-asset-dialog";
import { AssetViewerDialog } from "@/components/asset-viewer-dialog";

interface Asset {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  blob_url: string;
  caption: string | null;
  folder_id: string | null;
  uploaded_by: string;
  hearts: number;
  created_at: string;
  uploaded_by_user: { name: string };
  folder: { name: string } | null;
  thumbnail_url?: string | null;
}

interface Folder {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface AssetCardProps {
  asset: Asset;
  folders: Folder[];
  currentUserId?: string;
  onShare?: (asset: Asset) => void;
}

export function AssetCard({
  asset,
  folders,
  currentUserId,
  onShare,
}: AssetCardProps) {
  const router = useRouter();
  const [hearts, setHearts] = useState(asset.hearts);
  const [isHearted, setIsHearted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  const canEdit = currentUserId === asset.uploaded_by;

  const handleHeart = async () => {
    try {
      const response = await fetch(`/api/assets/${asset.id}/heart`, {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setHearts(data.hearts);
        setIsHearted(data.hearted);
      }
    } catch (err) {
      console.error("Failed to heart asset:", err);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this photo? This action cannot be undone."
      )
    )
      return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        router.refresh();
      } else {
        alert("Failed to delete photo");
      }
    } catch (err) {
      console.error("Failed to delete asset:", err);
      alert("Failed to delete photo");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {asset.file_type.startsWith("image/") ? (
            <img
              src={asset.blob_url || "/placeholder.svg"}
              alt={asset.caption || asset.original_filename}
              className="h-full w-full object-cover"
              draggable={false}
            />
          ) : (
            <>
              <video
                src={asset.blob_url}
                className="h-full w-full object-cover"
                poster={asset.thumbnail_url || "/video-thumbnail.png"}
                preload="metadata"
                controls={false}
                playsInline
                muted
                onClick={() => setShowViewer(true)}
              />
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
                <VideoIcon className="h-10 w-10 text-white/90" />
              </div>
            </>
          )}
          {canEdit && (
            <div className="absolute right-2 top-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/85 p-0 hover:bg-white"
                  >
                    <MoreVerticalIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <TrashIcon className="mr-2 h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        <CardContent className="p-4 pb-2">
          {asset.caption && (
            <p className="mb-2 line-clamp-2 text-sm text-foreground/80">
              {asset.caption}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>by {asset.uploaded_by_user.name}</span>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button
              onClick={handleHeart}
              className={`flex items-center gap-1 transition-colors ${
                isHearted ? "text-red-500" : "hover:text-red-500"
              }`}
              aria-label="Heart"
            >
              <HeartIcon
                className={`h-4 w-4 ${isHearted ? "fill-current" : ""}`}
              />
              <span>{hearts}</span>
            </button>
            <button
              onClick={() => onShare?.(asset)}
              className="transition-colors hover:text-indigo-600"
              aria-label="Share"
            >
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => setShowViewer(true)}
          >
            <EyeIcon className="mr-2 h-4 w-4" />
            Lihat
          </Button>
        </CardFooter>
      </Card>
      <EditAssetDialog
        asset={asset}
        folders={folders}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          setShowEditDialog(false);
          router.refresh();
        }}
      />
      <AssetViewerDialog
        asset={asset}
        open={showViewer}
        onOpenChange={setShowViewer}
      />
    </>
  );
}
