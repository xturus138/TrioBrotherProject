import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryView } from "@/components/gallery-view";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const selectedFolderId = params.folder;

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user data from our custom users table
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.user_metadata?.user_id)
    .single();

  // Get all folders
  const { data: folders } = await supabase
    .from("folders")
    .select("*")
    .order("name");

  // Filter assets based on selectedFolderId
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
    />
  );
}
