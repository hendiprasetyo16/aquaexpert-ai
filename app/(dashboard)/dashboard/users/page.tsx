"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUsers, updateUserRole } from "@/features/users/repositories/user.repository";
import { UserProfile, UserRole } from "@/features/users/types/user.types";

import { 
  Loader2, 
  ShieldAlert, 
  User as UserIcon, 
  Mail, 
  Users, 
  Shield, 
  ShieldCheck 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast"; 

export default function UsersPage() {
  // Ambil `user` untuk mendeteksi ID yang sedang login
  const { user: currentUserAuth, role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      const data = await getUsers();
      setUsers(data);
      setLoading(false);
    }
    
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      loadUsers();
    }
  }, [currentUserRole]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const confirmChange = window.confirm(`Yakin ingin mengubah hak akses pengguna ini menjadi ${newRole.toUpperCase()}?`);
    if (!confirmChange) return;

    // Simpan data lama untuk keperluan rollback
    const previousUsers = [...users];

    try {
      // Optimistic Update menggunakan callback (prev state)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      
      const success = await updateUserRole(userId, newRole);
      
      if (!success) {
        throw new Error("Database menolak perubahan.");
      }

      toast.success("Role pengguna berhasil diubah!");
      
    } catch (error) {
      console.error(error);
      // Rollback jika gagal
      setUsers(previousUsers);
      toast.error("Gagal mengubah role pengguna.");
    }
  };

  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmin: users.filter(u => u.role === "super_admin").length,
      admin: users.filter(u => u.role === "admin").length,
      user: users.filter(u => u.role === "user").length,
    };
  }, [users]);

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <p className="text-slate-400">Anda tidak memiliki akses ke halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-100">Manajemen Pengguna</h2>
        <p className="mt-1 text-slate-400">Kelola akses dan jabatan pengguna AquaExpert.</p>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-950/50 text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Total Akun</p>
                <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-800 bg-slate-900/60 shadow-sm">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-950/50 text-red-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Super Admin</p>
                  <p className="text-2xl font-bold text-slate-100">{stats.superAdmin}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-800 bg-slate-900/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-950/50 text-yellow-400">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">Admin</p>
                <p className="text-2xl font-bold text-slate-100">{stats.admin}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-950/50 text-teal-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">User Biasa</p>
                <p className="text-2xl font-bold text-slate-100">{stats.user}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {users
            .filter((user) => {
              if (currentUserRole === "super_admin") return true;
              return user.role !== "super_admin";
            })
            .map((user) => (
              <Card key={user.id} className="border-slate-800 bg-slate-900/60 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 overflow-hidden">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="truncate font-semibold text-slate-200">{user.full_name}</h3>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <ShieldAlert className="h-4 w-4" />
                      <span>Jabatan:</span>
                    </div>
                    
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      
                      // PROTEKSI BARU: Cegah Admin mengubah dirinya sendiri ATAU Super Admin bunuh diri
                      disabled={
                        user.id === currentUserAuth?.id || 
                        (user.role === "super_admin" && stats.superAdmin === 1)
                      } 
                      
                      className={`rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors ${
                        user.role === "super_admin" 
                          ? "border-red-900 bg-red-950/30 text-red-400" 
                          : user.role === "admin"
                          ? "border-yellow-900 bg-yellow-950/30 text-yellow-400"
                          : "border-teal-900 bg-teal-950/30 text-teal-400"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="user" className="bg-slate-900 text-slate-200">User Biasa</option>
                      <option value="admin" className="bg-slate-900 text-slate-200">Admin</option>
                      
                      {currentUserRole === "super_admin" && (
                        <option value="super_admin" className="bg-slate-900 text-slate-200">Super Admin</option>
                      )}
                    </select>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}