// components/gallery-view.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HardDriveIcon,
} from "lucide-react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/PaginationControls";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";

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
  totalAssetsCount: number;
  page: number;
  perPage: number;
  searchQuery?: string;
  totalStorageUsedMB: number;
  storageQuotaMB: number;
}

const FOLDERS_PER_PAGE = 5;

export function GalleryView({
  currentUser,
  folders,
  assets,
  selectedFolderId,
  folderCounts,
  totalCount,
  totalAssetsCount,
  page,
  perPage,
  searchQuery,
  totalStorageUsedMB,
  storageQuotaMB,
}: GalleryViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [shareAsset, setShareAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [folderSearchQuery, setFolderSearchQuery] = useState("");
  const [mediaSearchQuery, setMediaSearchQuery] = useState(searchQuery || "");
  const [folderPage, setFolderPage] = useState(1);

  useEffect(() => {
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

  const handleMediaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set("search", mediaSearchQuery);
    params.set("page", "1");
    handleNavigationClick(`/gallery?${params.toString()}`);
  };

  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(folderSearchQuery.toLowerCase())
  );

  const totalFolderPages = Math.ceil(filteredFolders.length / FOLDERS_PER_PAGE);
  const paginatedFolders = filteredFolders.slice(
    (folderPage - 1) * FOLDERS_PER_PAGE,
    folderPage * FOLDERS_PER_PAGE
  );

  const usagePercentage = (totalStorageUsedMB / storageQuotaMB) * 100;
  const remainingStorageMB = storageQuotaMB - totalStorageUsedMB;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <LoadingOverlay isLoading={isLoading} />

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
          <aside className="lg:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Folders</h2>
                <CreateFolderDialog />
              </div>

              <div className="mb-4">
                <Input
                  id="folder-search"
                  placeholder="Search folders..."
                  value={folderSearchQuery}
                  onChange={(e) => {
                    setFolderSearchQuery(e.target.value);
                    setFolderPage(1);
                  }}
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleNavigationClick("/gallery")}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 transition-colors ${
                    !selectedFolderId && !folderSearchQuery
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

                {paginatedFolders.map((folder) => (
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

              {totalFolderPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setFolderPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={folderPage === 1}
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-500">
                    Page {folderPage} of {totalFolderPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setFolderPage((prev) =>
                        Math.min(totalFolderPages, prev + 1)
                      )
                    }
                    disabled={folderPage === totalFolderPages}
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8 rounded-lg bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <HardDriveIcon className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Storage
                </h3>
              </div>
              <div className="mt-4">
                <Progress value={usagePercentage} />
                <p className="mt-2 text-sm text-gray-600">
                  Digunakan {totalStorageUsedMB.toFixed(2)} MB dari{" "}
                  {storageQuotaMB.toFixed(0)} MB
                </p>
                <p className="text-xs text-gray-500">
                  Tersisa {remainingStorageMB.toFixed(2)} MB.
                </p>
              </div>
            </div>
          </aside>

          <main className="lg:col-span-3">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedFolder ? selectedFolder.name : "All Photos"}
                  </h2>
                  <p className="mt-1 text-gray-600">
                    {totalAssetsCount}{" "}
                    {totalAssetsCount === 1 ? "item" : "items"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <form onSubmit={handleMediaSearch} className="flex-1">
                    <div className="relative">
                      <Input
                        type="search"
                        placeholder="Search media..."
                        value={mediaSearchQuery}
                        onChange={(e) => setMediaSearchQuery(e.target.value)}
                        className="w-full pl-8"
                      />
                      <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </form>
                  <UploadDialog
                    folders={folders}
                    selectedFolderId={selectedFolderId}
                  />
                </div>
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
              {totalAssetsCount > perPage && (
                <div className="mt-8">
                  <PaginationControls
                    totalCount={totalAssetsCount}
                    perPage={perPage}
                    page={page}
                  />
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
