"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadDialog } from "@/components/upload-dialog";
import { AssetCard } from "@/components/asset-card";
import { ShareDialog } from "@/components/share-dialog";
import { CreateFolderDialog } from "@/components/create-folder-dialog";
import { EditFolderDialog } from "@/components/edit-folder-dialog";
import { DeleteFolderDialog } from "@/components/delete-folder-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderIcon,
  ImageIcon,
  LogOutIcon,
  MoreVerticalIcon,
} from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay"; // Import komponen baru

interface User {
  id: string;
  name: string;
  created_at: string;
  pin: string;
}

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

type FolderCounts = Record<string, number>;

interface GalleryViewProps {
  currentUser: User | null;
  folders: Folder[];
  assets: Asset[];
  selectedFolderId?: string;
  folderCounts: FolderCounts;
  totalCount: number;
}

export function GalleryView({
  currentUser,
  folders,
  assets,
  selectedFolderId,
  folderCounts,
  totalCount,
}: GalleryViewProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shareAsset, setShareAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Nonaktifkan loading setelah navigasi selesai
    setIsLoading(false);
  }, [assets]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleShare = (asset: Asset) => setShareAsset(asset);

  const handleNavigationClick = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoadingOverlay isLoading={isLoading} /> {/* Tambahkan overlay di sini */}
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-indigo-900">BestTrio</h1>
            {currentUser && (
              <Badge
                variant="secondary"
                className="bg-indigo-100 text-indigo-800"
              >
                {currentUser.name}
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="bg-transparent text-gray-600 hover:text-gray-800"
          >
            <LogOutIcon className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                <CreateFolderDialog />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleNavigationClick("/gallery")}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors ${
                    !selectedFolderId
                      ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ImageIcon className="h-5 w-5" />
                  <span className="font-medium">All Photos</span>
                  <Badge variant="secondary" className="ml-auto">
                    {totalCount}
                  </Badge>
                </button>

                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className={`group flex items-center justify-between gap-3 rounded-lg p-3 transition-colors ${
                      selectedFolderId === folder.id
                        ? "border border-indigo-200 bg-indigo-50 text-indigo-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <button
                      onClick={() =>
                        handleNavigationClick(`/gallery?folder=${folder.id}`)
                      }
                      className="min-w-0 flex flex-1 items-center gap-3"
                    >
                      <FolderIcon className="h-5 w-5 shrink-0" />
                      <span className="truncate font-medium">
                        {folder.name}
                      </span>
                      <Badge variant="secondary" className="ml-auto">
                        {folderCounts[folder.id] || 0}
                      </Badge>
                    </button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        >
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <EditFolderDialog
                          folder={folder}
                          onSuccess={() => router.refresh()}
                        />
                        <DeleteFolderDialog folder={folder} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedFolder ? selectedFolder.name : "All Photos"}
                  </h2>
                  <p className="mt-1 text-gray-600">
                    {assets.length} {assets.length === 1 ? "item" : "items"}
                  </p>
                </div>
                <UploadDialog
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                />
              </div>

              {assets.length === 0 ? (
                <div className="py-12 text-center">
                  <ImageIcon className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    No photos yet
                  </h3>
                  <p className="mb-4 text-gray-600">
                    {selectedFolder
                      ? `No photos in ${selectedFolder.name} folder yet.`
                      : "Start building your memories by uploading your first photo."}
                  </p>
                  <UploadDialog
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {assets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      folders={folders}
                      currentUserId={currentUser?.id}
                      onShare={(a) => setShareAsset(a)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      {shareAsset && (
        <ShareDialog
          asset={shareAsset}
          open={!!shareAsset}
          onOpenChange={() => setShareAsset(null)}
        />
      )}
    </div>
  );
}
