// features/inventory/actions/inventory.actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";

export interface InventoryItemDto {
  id: string;
  user_id: string;
  medication_id: string | null;
  item_name: string;
  category: string;
  stock_quantity: number;
  unit: string;
  notes: string | null;
  medication?: {
    name_id: string;
    name_en: string;
  } | null;
}

// 1. Fungsi untuk menarik daftar barang di gudang user
export async function getUserInventoryAction() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("user_inventory")
      .select(`
        *,
        medication:medications(name_id, name_en)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Casting tipe data dengan aman (tanpa any)
    return { success: true, data: data as unknown as InventoryItemDto[] };
  } catch (error: unknown) {
    console.error("Error fetching inventory:", error);
    return { success: false, error: "Gagal memuat inventaris." };
  }
}

// 2. Fungsi untuk menambah barang baru ke gudang
export async function addInventoryItemAction(payload: {
  itemName: string;
  category: string;
  stockQuantity: number;
  unit: string;
  medicationId?: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { success: false, error: "Unauthorized" };

    const { error } = await supabase
      .from("user_inventory")
      .insert({
        user_id: user.id,
        item_name: payload.itemName,
        category: payload.category,
        stock_quantity: payload.stockQuantity,
        unit: payload.unit,
        medication_id: payload.medicationId || null,
        notes: payload.notes || null
      });

    if (error) throw error;
    return { success: true };
  } catch (error: unknown) {
    console.error("Error adding inventory item:", error);
    return { success: false, error: "Gagal menambah barang." };
  }
}