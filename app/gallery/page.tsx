// app/gallery/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryView } from "@/components/gallery-view";

const PER_PAGE = 6; // Tetapkan berapa banyak aset yang akan dimuat per halaman

export default async function GalleryPage({
  searchParams,
}: {
  // ⬇️ Next.js 15: searchParams wajib Promise lalu di-await
  searchParams: Promise<{ folder?: string; page?: string; search?: string }>;
}) {
  const supabase = await createClient();

  // ✅ await dulu baru akses propertinya
  const {
    folder: selectedFolderId,
    page: pageParam,
    search: searchQuery,
  } = await searchParams;
  const page = parseInt(pageParam || "1", 10);
  const offset = (page - 1) * PER_PAGE;

  // Cek login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Data user (pakai id yang kamu simpan di user_metadata)
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.user_metadata?.user_id)
    .single();

  // Semua folder
  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .order("name");

  // Total semua aset (pakai head + count biar ringan)
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

  // Query untuk aset
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

  // Terapkan filter folder jika ada
  if (selectedFolderId) {
    query = query.eq("folder_id", selectedFolderId);
  }

  // Terapkan filter pencarian jika ada
  if (searchQuery) {
    query = query.or(
      `caption.ilike.%${searchQuery}%,original_filename.ilike.%${searchQuery}%`
    );
  }

  // Terapkan pagination
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
    />
  );
}
