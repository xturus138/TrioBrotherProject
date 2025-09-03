"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PencilIcon, SaveIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Folder {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface EditFolderDialogProps {
  folder: Folder;
  onSuccess: () => void;
}

export function EditFolderDialog({ folder, onSuccess }: EditFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState(folder.name);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUpdate = async () => {
    if (!folderName.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }

    setIsUpdating(true);
    setError(null);
    const supabase = createClient();

    try {
      const { error: dbError } = await supabase
        .from("folders")
        .update({ name: folderName })
        .eq("id", folder.id)
        .eq("created_by", folder.created_by);

      if (dbError) {
        throw new Error(dbError.message);
      }

      setOpen(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update folder");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <PencilIcon className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>Update the name of this folder.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              placeholder="e.g., Family Photos"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
