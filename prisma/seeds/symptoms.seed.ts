// D:\aquaexpert-ai\prisma\seeds\symptoms.seed.ts
import { Symptom } from "@/features/diseases/types/disease.types";

export const SYMPTOMS_SEED: Partial<Symptom>[] = [
  // -- GENERAL (Perilaku & Sistemik) --
  {
    id: "sym_gen_01",
    body_region: "General",
    name_id: "Napas Cepat (Megap-megap)",
    name_en: "Rapid Breathing (Gasping)",
    description_id: "Ikan bernapas sangat cepat, sering berada di permukaan air atau di dekat arus filter.",
  },
  {
    id: "sym_gen_02",
    body_region: "General",
    name_id: "Kehilangan Nafsu Makan",
    name_en: "Loss of Appetite",
    description_id: "Menolak pelet/pakan selama lebih dari 2 hari berturut-turut.",
  },
  {
    id: "sym_gen_03",
    body_region: "General",
    name_id: "Menggesekkan Badan (Flashing)",
    name_en: "Flashing / Scratching",
    description_id: "Berenang menyentak dan menggesekkan badan ke dekorasi, pasir, atau kaca.",
  },

  // -- SKIN / SCALES (Kulit & Sisik) --
  {
    id: "sym_skn_01",
    body_region: "Skin/Scales",
    name_id: "Bintik Putih Garam",
    name_en: "White Salt-like Specks",
    description_id: "Bintik-bintik putih kecil seukuran butiran garam di sekujur tubuh (Gejala khas Ich).",
  },
  {
    id: "sym_skn_02",
    body_region: "Skin/Scales",
    name_id: "Serbuk Emas / Karat",
    name_en: "Gold/Rust Dusting",
    description_id: "Lapisan seperti debu beludru berwarna emas atau karat, terlihat jelas di bawah senter.",
  },
  {
    id: "sym_skn_03",
    body_region: "Skin/Scales",
    name_id: "Sisik Berdiri (Pineconing)",
    name_en: "Raised Scales (Pineconing)",
    description_id: "Sisik membuka dan mencuat keluar seperti buah pinus saat dilihat dari atas.",
  },

  // -- FINS (Sirip) --
  {
    id: "sym_fin_01",
    body_region: "Fins",
    name_id: "Sirip Menguncup",
    name_en: "Clamped Fins",
    description_id: "Sirip dilipat rapat ke arah tubuh, ikan tampak kaku dan tegang.",
  },
  {
    id: "sym_fin_02",
    body_region: "Fins",
    name_id: "Sirip Robek / Rantas",
    name_en: "Frayed / Ragged Fins",
    description_id: "Ujung sirip terkikis, membusuk, robek, dan terkadang memiliki pinggiran berwarna putih/merah.",
  },

  // -- GILLS (Insang) --
  {
    id: "sym_gil_01",
    body_region: "Gills",
    name_id: "Insang Merah & Bengkak",
    name_en: "Red / Inflamed Gills",
    description_id: "Tutup insang terbuka lebar, bagian dalam terlihat sangat merah, berdarah, atau membengkak.",
  },

  // -- EYES (Mata) --
  {
    id: "sym_eye_01",
    body_region: "Eyes",
    name_id: "Mata Bengkak Keluar (Popeye)",
    name_en: "Bulging Eyes (Popeye)",
    description_id: "Satu atau kedua mata membengkak parah dan menonjol keluar dari rongganya.",
  },
  {
    id: "sym_eye_02",
    body_region: "Eyes",
    name_id: "Mata Berkabut / Putih",
    name_en: "Cloudy Eyes",
    description_id: "Selaput mata menjadi keruh, buram, atau dilapisi selaput putih.",
  },

  // -- BELLY (Perut) --
  {
    id: "sym_bel_01",
    body_region: "Belly",
    name_id: "Perut Sangat Buncit",
    name_en: "Bloated / Swollen Belly",
    description_id: "Pembengkakan tidak wajar pada area perut, bukan karena membawa telur.",
  },
  {
    id: "sym_bel_02",
    body_region: "Belly",
    name_id: "Perut Cekung",
    name_en: "Sunken / Hollow Belly",
    description_id: "Perut mengecil drastis ke dalam, ikan terlihat sangat kurus meski makan dengan normal.",
  },

  // -- MOUTH (Mulut) --
  {
    id: "sym_mou_01",
    body_region: "Mouth",
    name_id: "Pertumbuhan Kapas di Mulut",
    name_en: "Cottony Growth on Mouth",
    description_id: "Gumpalan putih seperti benang jamur atau kapas yang tumbuh di area bibir.",
  }
];