import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      
      {/* Memanggil Komponen Sidebar yang Baru dari folder layout */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col h-screen overflow-hidden">
        <header className="flex h-16 shrink-0 items-center border-b border-slate-800 bg-slate-950/50 px-6">
          <h2 className="text-lg font-semibold text-slate-200">Panel Kontrol</h2>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </div>
      </main>
      
    </div>
  );
}