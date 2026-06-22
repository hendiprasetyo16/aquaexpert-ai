// features/aquariums/constants/aquarium-options.ts

export const TANK_TYPES = [
  "Community",
  "Species Only",
  "Shrimp",
  "Breeding",
  "Paludarium"
] as const;

export const AQUASCAPE_STYLES = [
  "Bebas",
  "Nature",
  "Dutch",
  "Iwagumi",
  "Biotope",
  "Blackwater"
] as const;

export const SUBSTRATE_TYPES = [
  "Aquasoil",
  "Sand",
  "Gravel",
  "Bare Bottom",
  "Mixed"
] as const;

// FIX V1.1: Menambahkan daftar hardscape untuk form UI
export const HARDSCAPE_TYPES = [
  "Driftwood (Kayu)",
  "Seiryu Stone",
  "Dragon Stone",
  "Lava Rock",
  "River Stones",
  "Mixed",
  "None"
] as const;

export const FILTER_TYPES = [
  "Canister",
  "Hang on Back (HOB)",
  "Sponge",
  "Undergravel",
  "Sump",
  "Internal",
  "None"
] as const;

export const LIGHT_TYPES = [
  "WRGB LED",
  "RGB LED",
  "White LED",
  "T5 / T8 Fluorescent",
  "Halogen",
  "Natural Sunlight",
  "Mixed (Sunlight + Artificial)", 
  "None"
] as const;

export const CO2_TYPES = [
  "Pressurized Cylinder",
  "DIY (Yeast/Citric)",
  "Liquid Carbon",
  "None"
] as const;

export const FERTILIZER_TYPES = [
  "Estimative Index (EI)",
  "PPS-Pro",
  "All-in-One (Liquid)",
  "Root Tabs Only",
  "Custom",
  "None"
] as const;