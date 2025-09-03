"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";

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

export function CreateFolderDialog() {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    if (!folderName.trim()) {
      setError("Folder name cannot be empty.");
      return;
    }

    setIsCreating(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("User not authenticated.");
      setIsCreating(false);
      return;
    }

    try {
      const { error: dbError } = await supabase
        .from("folders")
        .insert({ name: folderName, created_by: user.user_metadata?.user_id });

      if (dbError) {
        throw new Error(dbError.message);
      }

      setFolderName("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="text-indigo-600 border-indigo-200 bg-transparent"
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>
            Create a new folder to organize your memories
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              placeholder="e.g., Summer Trip 2024"
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
              onClick={handleCreate}
              disabled={isCreating}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {isCreating ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
