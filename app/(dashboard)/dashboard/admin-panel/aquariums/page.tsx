// app/dashboard/admin-panel/aquariums/page.tsx
import AdminAquariumList from "@/features/admin/components/AdminAquariumList";

export const metadata = {
  title: "All Aquariums (Admin) | AquaExpert AI",
  description: "Superadmin dashboard to view all user aquariums.",
};

export default function AdminAquariumsPage() {
  return <AdminAquariumList />;
}