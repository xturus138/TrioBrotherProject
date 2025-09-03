// app/gallery/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryView } from "@/components/gallery-view";

export default async function GalleryPage({
  searchParams,
}: {
  // ⬇️ Next.js 15: searchParams wajib Promise lalu di-await
  searchParams: Promise<{ folder?: string }>;
}) {
  const supabase = await createClient();

  // ✅ await dulu baru akses propertinya
  const { folder: selectedFolderId } = await searchParams;

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

  // ⛔️ .group() nggak ada di supabase-js
  // ✅ Tarik folder_id lalu agregasi di JS
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

  // Filter aset by selectedFolderId
  let query = supabase
    .from("assets")
    .select(
      `
      *,
      uploaded_by_user:users!assets_uploaded_by_fkey(name),
      folder:folders(name)
    `
    )
    .order("created_at", { ascending: false });

  if (selectedFolderId) {
    query = query.eq("folder_id", selectedFolderId);
  }

  const { data: assets } = await query;

  return (
    <GalleryView
      currentUser={userData}
      folders={folders || []}
      assets={assets || []}
      selectedFolderId={selectedFolderId}
      folderCounts={folderCounts}
      totalCount={totalCount ?? 0}
    />
  );
}
