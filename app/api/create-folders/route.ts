import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Pindahkan array 120 slug ke server, UI tidak perlu tahu daftar ini.
const plantSlugs: string[] = [
  "alternanthera-reineckii-mini", "amazon-frogbit", "amazon-sword", "ammannia-gracilis", 
  "ammannia-pedicellata", "anubias-barteri", "anubias-coffeefolia", "anubias-nana", 
  "anubias-nana-petite", "aponogeton-madagascariensis", "bacopa-caroliniana", "blyxa-japonica", 
  "bolbitis-heudelotii", "bucephalandra-brownie", "bucephalandra-green-wavy", "bucephalandra-kedagang", 
  "bucephalandra-skeleton-king", "cabomba-caroliniana", "cabomba-furcata", "cardinal-plant", 
  "ceratophyllum-demersum", "christmas-moss", "corkscrew-vallisneria", "crinum-calamistratum", 
  "cryptocoryne-balansae", "cryptocoryne-beckettii", "cryptocoryne-flamingo", "cryptocoryne-lutea", 
  "cryptocoryne-parva", "cryptocoryne-spiralis", "cryptocoryne-wendtii-brown", "cryptocoryne-wendtii-green", 
  "cyperus-helferi", "didiplis-diandra", "dwarf-hairgrass", "egeria-densa", "elatine-hydropiper", 
  "eleocharis-parvula", "eriocaulon-cinereum", "fissidens-fontanus", "flame-moss", "giant-hygro", 
  "glossostigma-elatinoides", "hc-cuba", "helanthium-tenellum", "hydrocotyle-tripartita-japan", 
  "hygrophila-corymbosa", "hygrophila-difformis", "hygrophila-pinnatifida", "hygrophila-polysperma", 
  "java-fern", "java-fern-narrow", "java-fern-trident", "java-fern-windelov", "java-moss", 
  "lagenandra-meeboldii-red", "lilaeopsis-brasiliensis", "limnophila-aromatica", "limnophila-hippuridoides", 
  "limnophila-sessiliflora", "ludwigia-arcuata", "ludwigia-brevipes", "ludwigia-glandulosa", 
  "ludwigia-inclinata", "ludwigia-palustris", "ludwigia-repens", "ludwigia-super-red", "marsilea-crenata", 
  "marsilea-hirsuta", "micranthemum-umbrosum", "mini-pellia", "monte-carlo", "murdannia-keisak", 
  "myriophyllum-mattogrossense", "myriophyllum-tuberculatum", "pogostemon-erectus", "pogostemon-helferi", 
  "proserpinaca-palustris", "red-root-floater", "red-tiger-lotus", "rotala-blood-red", "rotala-colorata", 
  "rotala-green", "rotala-hra", "rotala-indica", "rotala-macrandra", "rotala-nanjenshan", 
  "rotala-orange-juice", "rotala-rotundifolia", "rotala-wallichii", "sagittaria-subulata", "salvinia-natans", 
  "staurogyne-repens", "syngonanthus-belem", "taiwan-moss", "tonina-fluviatilis", "utricularia-graminifolia", 
  "vallisneria-nana", "vallisneria-spiralis", "water-lettuce", "weeping-moss", "bacopa-monnieri", 
  "echinodorus-ozelot", "pearl-weed", "riccia-fluitans", "lemna-minor", "hydrocotyle-verticillata", 
  "bucephalandra-catherinae", "anubias-nana-pangolino", "ludwigia-rubin", "rotala-bonsai", 
  "hygrophila-araguaia", "eriocaulon-polaris", "cryptocoryne-undulata", "bucephalandra-deep-blue", 
  "blyxa-aubertii", "rotala-macrandra-mini", "staurogyne-porto-velho", "limnobium-spongia", "fissidens-nobilis"
];

export async function GET(request: Request) {
  // 1. KEAMANAN: Membaca secret dari Header, BUKAN dari URL params
  const secret = request.headers.get("x-admin-secret");

  if (secret !== "aquaexpert-sinkron-2024") {
    return NextResponse.json({ error: "Akses Ditolak." }, { status: 401 });
  }

  // 2. Inisialisasi Supabase Server-Side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Di Node.js Server, kita gunakan Blob sebagai pengganti File browser
    const emptyFile = new Blob([""], { type: "text/plain" });
    let createdCount = 0;

    for (const slug of plantSlugs) {
      const filePath = `${slug}/.keep`;

      const { error } = await supabase.storage
        .from("plant-images")
        .upload(filePath, emptyFile, { cacheControl: "3600", upsert: true });

      if (!error) {
        createdCount++;
      } else {
        console.error(`Gagal membuat folder ${slug}:`, error.message);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Selesai! ${createdCount} Folder berhasil dibuat di Supabase Storage.` 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}