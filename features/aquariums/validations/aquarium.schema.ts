// features/aquariums/validations/aquarium.schema.ts
import { z } from "zod";
import { TANK_TYPES, SUBSTRATE_TYPES, FILTER_TYPES, LIGHT_TYPES, CO2_TYPES, FERTILIZER_TYPES } from "../constants/aquarium-options";

export const createAquariumSchema = z.object({
  // Step 1: Identitas
  name: z.string().min(3, "Nama akuarium minimal 3 karakter").max(50, "Nama terlalu panjang"),
  tank_type: z.enum(TANK_TYPES as any),
  setup_date: z.string().refine((date) => new Date(date) <= new Date(), {
    message: "Tanggal setup tidak boleh di masa depan",
  }),
  is_primary: z.boolean().default(false),

  // Step 2: Dimensi (Validasi Wajib > 0)
  length_cm: z.number().min(1, "Panjang harus lebih dari 0 cm"),
  width_cm: z.number().min(1, "Lebar harus lebih dari 0 cm"),
  height_cm: z.number().min(1, "Tinggi harus lebih dari 0 cm"),
  volume_liters: z.number().min(0.1, "Volume tidak valid"),
  substrate_type: z.enum(SUBSTRATE_TYPES as any).nullable().optional(),

  // Step 3: Peralatan
  filter_type: z.enum(FILTER_TYPES as any).nullable().optional(),
  filter_capacity_lph: z.number().nullable().optional(),
  light_type: z.enum(LIGHT_TYPES as any).nullable().optional(),
  light_wattage: z.number().nullable().optional(),
  photoperiod_hours: z.number().min(0).max(24).nullable().optional(),
  co2_type: z.enum(CO2_TYPES as any).nullable().optional(),
  co2_bps: z.number().nullable().optional(),
  heater_enabled: z.boolean().default(false),

  // Step 4: Perawatan
  water_change_percent: z.number().min(0).max(100).nullable().optional(),
  water_change_interval_days: z.number().min(0).nullable().optional(),
  fertilizer_type: z.enum(FERTILIZER_TYPES as any).nullable().optional(),
  fertilizer_schedule: z.string().nullable().optional(),
});

export type CreateAquariumFormValues = z.infer<typeof createAquariumSchema>;