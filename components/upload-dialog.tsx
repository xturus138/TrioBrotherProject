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

  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [folderId, setFolderId] = useState(selectedFolderId || "none");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
    setError(null);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      for (const [index, file] of files.entries()) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("caption", caption);
        if (folderId !== "none") formData.append("folderId", folderId);

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

        setUploadProgress(((index + 1) / files.length) * 100);
      }

      setFiles([]);
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
          <DialogTitle>Upload Photos &amp; Videos</DialogTitle>
          <DialogDescription>
            Add new memories to your BestTrio collection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="files">Select Files</Label>
            <Input
              id="files"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="mt-1"
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>

              {/* Simple, fixed-width rows that never overflow the dialog */}
              <div className="max-h-40 w-full overflow-y-auto rounded-md border bg-white/50">
                {files.map((file, index) => (
                  <div
                    key={`${index}`}
                    className="flex w-full items-center justify-between gap-2 border-b p-2 last:border-b-0"
                  >
                    {/* Hide the real name: show generic label + lightweight meta only */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        Upload {index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      className="h-6 w-6 shrink-0"
                      aria-label={`Remove upload ${index + 1}`}
                    >
                      <XIcon className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea
              id="caption"
              placeholder="Add a caption for your photos..."
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
              <p className="text-sm text-muted-foreground">
                Uploading {files.length} file(s)...
              </p>
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
              disabled={isUploading || files.length === 0}
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
                  Upload {files.length > 0 ? `(${files.length})` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
