import { createClient } from "@/lib/supabase/client";

export async function getProfile(userId: string) {
  const supabase = createClient();

  return await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
}

export async function getCurrentProfile() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  console.log("USER AUTH:", user);
  console.log("AUTH ERROR:", authError);

  if (!user) {
    console.log("USER TIDAK ADA");
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  console.log("PROFILE DATA:", data);
  console.log("PROFILE ERROR:", error);

  if (error) {
    return null;
  }

  return data;
}