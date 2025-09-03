"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  const [hearts, setHearts] = useState(asset.hearts);
  const [isHearted, setIsHearted] = useState(false); // We'd need to check this from the API
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewer, setShowViewer] = useState(false); // State baru untuk viewer
  const router = useRouter();

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
    } catch (error) {
      console.error("Failed to heart asset:", error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this photo? This action cannot be undone."
      )
    ) {
      return;
    }

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
    } catch (error) {
      console.error("Failed to delete asset:", error);
      alert("Failed to delete photo");
    } finally {
      setIsDeleting(false);
    }
  };

  const canEdit = currentUserId === asset.uploaded_by;

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="aspect-square relative bg-gray-100 cursor-pointer"
          onClick={() => setShowViewer(true)} // Tambahkan handler untuk membuka viewer
        >
          {asset.file_type.startsWith("image/") ? (
            <img
              src={asset.blob_url || "/placeholder.svg"}
              alt={asset.caption || asset.original_filename}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={asset.blob_url}
              className="w-full h-full object-cover"
              poster="/video-thumbnail.png"
            />
          )}

          {canEdit && (
            <div className="absolute top-2 right-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  >
                    <MoreVerticalIcon className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <EditIcon className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {asset.caption && (
            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {asset.caption}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>by {asset.uploaded_by_user.name}</span>
            <div className="flex items-center gap-3">
              <button
                onClick={handleHeart}
                className={`flex items-center gap-1 transition-colors ${
                  isHearted ? "text-red-500" : "hover:text-red-500"
                }`}
              >
                <HeartIcon
                  className={`w-4 h-4 ${isHearted ? "fill-current" : ""}`}
                />
                <span>{hearts}</span>
              </button>
              <button
                onClick={() => onShare?.(asset)}
                className="hover:text-indigo-600 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
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
      <AssetViewerDialog // Tambahkan komponen viewer di sini
        asset={asset}
        open={showViewer}
        onOpenChange={setShowViewer}
      />
    </>
  );
}
