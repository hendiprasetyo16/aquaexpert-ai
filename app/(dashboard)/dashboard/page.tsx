import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-50">Ringkasan Tank</h1>
        <p className="text-slate-400">Pantau kondisi aquarium dan jadwal perawatan Anda.</p>
      </div>

      {/* Grid untuk Kartu Informasi */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="border-slate-800 bg-slate-900/50 text-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Status Air</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-400">Optimal</div>
            <p className="text-xs text-slate-500">Suhu 26°C | pH 6.8</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 text-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Jumlah Ikan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24 Ekor</div>
            <p className="text-xs text-slate-500">3 Spesies</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 text-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Koleksi Tanaman</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8 Jenis</div>
            <p className="text-xs text-slate-500">Didominasi Stem Plants</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50 text-slate-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Perawatan Terdekat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">Water Change</div>
            <p className="text-xs text-slate-500">Besok (30%)</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}