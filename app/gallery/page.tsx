// app/gallery/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryView } from "@/components/gallery-view";

const PER_PAGE = 6;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; page?: string; search?: string }>;
}) {
  const supabase = await createClient();

  const {
    folder: selectedFolderId,
    page: pageParam,
    search: searchQuery,
  } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const offset = (page - 1) * PER_PAGE;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.user_metadata?.user_id)
    .single();

  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .order("name");

  const { count: totalCount } = await supabase
    .from("assets")
    .select("*", { count: "exact", head: true });

  const { data: perFolderRows } = await supabase
    .from("assets")
    .select("folder_id")
    .not("folder_id", "is", null);

  const folderCounts: Record<string, number> = {};
  perFolderRows?.forEach((row: { folder_id: string | null }) => {
    if (row.folder_id) {
      folderCounts[row.folder_id] = (folderCounts[row.folder_id] ?? 0) + 1;
    }
  });

  // Kueri yang diubah untuk menghitung total penggunaan penyimpanan dari SEMUA aset.
  const { data: allAssets, error: allAssetsError } = await supabase
    .from("assets")
    .select("file_size");

  let totalStorageUsedMB = 0;
  if (allAssets) {
    const totalBytes = allAssets.reduce(
      (sum, asset) => sum + asset.file_size,
      0
    );
    totalStorageUsedMB = totalBytes / 1024 / 1024;
  }

  let query = supabase
    .from("assets")
    .select(
      `
      *,
      uploaded_by_user:users!assets_uploaded_by_fkey(name),
      folder:folders(name)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (selectedFolderId) {
    query = query.eq("folder_id", selectedFolderId);
  }

  if (searchQuery) {
    query = query.or(
      `caption.ilike.%${searchQuery}%,original_filename.ilike.%${searchQuery}%`
    );
  }

  query = query.range(offset, offset + PER_PAGE - 1);

  const { data: assets, count: totalFilteredAssets } = await query;

  return (
    <GalleryView
      currentUser={userData}
      folders={folders || []}
      assets={assets || []}
      selectedFolderId={selectedFolderId}
      folderCounts={folderCounts}
      totalCount={totalCount ?? 0}
      totalAssetsCount={totalFilteredAssets ?? 0}
      page={page}
      perPage={PER_PAGE}
      searchQuery={searchQuery}
      totalStorageUsedMB={totalStorageUsedMB}
      storageQuotaMB={8000}
    />
  );
}
