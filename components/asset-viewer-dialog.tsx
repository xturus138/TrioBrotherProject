"use client";

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Asset {
  id: string;
  blob_url: string;
  file_type: string;
  caption: string | null;
  original_filename: string;
}

interface AssetViewerDialogProps {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssetViewerDialog({
  asset,
  open,
  onOpenChange,
}: AssetViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-[700px] overflow-hidden">
        <DialogHeader className="hidden" />
        <div className="relative">
          {asset.file_type.startsWith("image/") ? (
            <img
              src={asset.blob_url}
              alt={asset.caption || asset.original_filename}
              className="w-full h-auto object-contain"
            />
          ) : (
            <AspectRatio ratio={16 / 9}>
              <video
                src={asset.blob_url}
                controls
                className="w-full h-full object-contain"
                poster="/video-thumbnail.png"
                autoPlay
              />
            </AspectRatio>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
