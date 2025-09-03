"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, UploadIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

interface Folder {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface UploadDialogProps {
  folders: Folder[];
  selectedFolderId?: string;
}

export function UploadDialog({ folders, selectedFolderId }: UploadDialogProps) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [folderId, setFolderId] = useState(selectedFolderId || "none");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", caption);
      if (folderId !== "none") formData.append("folderId", folderId);

      // Membuat objek XMLHttpRequest untuk melacak kemajuan unggahan
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = (event.loaded / event.total) * 100;
          setUploadProgress(progress);
        }
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let msg = "Upload failed";
        try {
          const data = await res.json();
          msg = data?.error || msg;
        } catch {}
        throw new Error(msg);
      }

      setFile(null);
      setCaption("");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const FormContent = (
    <div className="space-y-4">
      <div>
        <Label htmlFor="file">Select File</Label>
        <Input
          id="file"
          type="file"
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="mt-1"
        />
      </div>
      {file && (
        <div className="space-y-2">
          <Label>Selected File</Label>
          <div className="flex items-center justify-between gap-2 rounded-md border p-2 bg-white/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setFile(null)}
              className="h-6 w-6 shrink-0"
              aria-label="Remove upload"
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="caption">Caption (Optional)</Label>
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
          <SelectTrigger id="folder" className="mt-1">
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
      {isUploading && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Uploading file...</p>
          <Progress value={uploadProgress} />
        </div>
      )}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
          className="flex-1"
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700"
        >
          {isUploading ? (
            <>
              <UploadIcon className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <UploadIcon className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PlusIcon className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </DrawerTrigger>
        <DrawerContent className="p-4 pt-0">
          <DrawerHeader className="text-left">
            <DrawerTitle>Upload Photo & Video</DrawerTitle>
            <DrawerDescription>
              Add a new memory to your BestTrio collection
            </DrawerDescription>
          </DrawerHeader>
          {FormContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <PlusIcon className="mr-2 h-4 w-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[92vw] max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Photo & Video</DialogTitle>
          <DialogDescription>
            Add a new memory to your BestTrio collection
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
