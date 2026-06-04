"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUsers, updateUserRole } from "@/features/users/repositories/user.repository";
import { 
  createUser, toggleUserStatus, resetUserPassword, updateUserProfile, hardDeleteUser 
} from "@/features/users/actions/user.actions";
import { UserProfile, UserRole } from "@/features/users/types/user.types";

import { 
  Loader2, ShieldAlert, User as UserIcon, Mail, Users, 
  Shield, ShieldCheck, UserPlus, X, KeyRound, Power, PowerOff, Search, Filter, Pencil, Trash2, CalendarDays, Activity
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { user: currentUserAuth, role: currentUserRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // States Pencarian & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all"); 

  // States Kendali Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({ email: "", password: "", full_name: "", role: "user" as UserRole });
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");

  const loadUsersData = async () => {
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      loadUsersData();
    }
  }, [currentUserRole]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    const confirmChange = window.confirm(`Yakin ingin mengubah hak akses pengguna ini menjadi ${newRole.toUpperCase()}?`);
    if (!confirmChange) return;

    const previousUsers = [...users];
    try {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      const success = await updateUserRole(userId, newRole);
      if (!success) throw new Error("Database menolak perubahan.");
      toast.success("Role berhasil diubah!");
    } catch (error) {
      setUsers(previousUsers);
      toast.error("Gagal mengubah role.");
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    const previousUsers = [...users];
    try {
      setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, full_name: editNameValue } : u));
      const result = await updateUserProfile(selectedUser.id, editNameValue);

      if (result.success) {
        toast.success(result.message || "Nama pengguna berhasil diperbarui!");
        setIsEditModalOpen(false);
      } else {
        throw new Error(result.error || "Gagal memperbarui nama pengguna.");
      }
    } catch (error: any) {
      console.error(error);
      setUsers(previousUsers); 
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (currentUserRole === "admin" && formData.role !== "user") {
      toast.error("Admin hanya dapat membuat user biasa.");
      setIsSubmitting(false); return;
    }
    
    const result = await createUser(formData);
    
    if (result.success) {
      toast.success(result.message || "Berhasil ditambahkan!"); 
      setIsAddModalOpen(false);
      setFormData({ email: "", password: "", full_name: "", role: "user" });
      await loadUsersData();
    } else {
      toast.error(result.error || "Gagal menambahkan pengguna."); 
    }
    
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const actionText = user.is_active ? "memblokir/menonaktifkan" : "mengaktifkan";
    const confirmAction = window.confirm(`Yakin ingin ${actionText} akses login untuk akun ${user.full_name}?`);
    if (!confirmAction) return;

    const previousUsers = [...users];
    try {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: !user.is_active } : u));
      const result = await toggleUserStatus(user.id, user.is_active, user.role);
      
      if (!result.success) throw new Error(result.error || "Error tidak dikenal.");
      toast.success(result.message || "Status izin akun berhasil diubah.");
      
    } catch (error: any) {
      setUsers(previousUsers);
      toast.error(error.message || "Gagal memproses perubahan status.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    
    const result = await resetUserPassword(selectedUser.id, resetPasswordValue, selectedUser.role);
    
    if (result.success) {
      toast.success(result.message || "Password berhasil di-reset!");
      setIsResetModalOpen(false);
      setResetPasswordValue("");
    } else {
      toast.error(result.error || "Gagal mereset password.");
    }
    
    setIsSubmitting(false);
  };

  const handleHardDelete = async (user: UserProfile) => {
    const confirmText = window.prompt(
      `PERINGATAN KRITIS!\n\nKetik email pengguna "${user.email}" untuk menghapus permanen akun ini:`
    );

    if (confirmText !== user.email) {
      toast.error("Email konfirmasi tidak sesuai. Penghapusan dibatalkan.");
      return;
    }

    const previousUsers = [...users];
    try {
      setUsers(prev => prev.filter(u => u.id !== user.id));
      const result = await hardDeleteUser(user.id, user.role);
      
      if (!result.success) throw new Error(result.error || "Error saat menghapus permanen.");
      toast.success(result.message || "Pengguna berhasil dihapus permanen.");
      
    } catch (error: any) {
      setUsers(previousUsers); 
      toast.error(error.message || "Gagal menghapus pengguna.");
    }
  };

  const stats = useMemo(() => {
    const visibleUsers = currentUserRole === "admin"
      ? users.filter(u => u.role === "user")
      : users;

    return {
      total: visibleUsers.length,
      superAdmin: visibleUsers.filter(u => u.role === "super_admin").length,
      admin: visibleUsers.filter(u => u.role === "admin").length,
      user: visibleUsers.filter(u => u.role === "user").length,
    };
  }, [users, currentUserRole]);

  // =======================================================
  // LOGIKA BARU: FILTERING SEKALIGUS PENGURUTAN HIERARKI
  // =======================================================
  const filteredUsers = useMemo(() => {
    let visibleUsers = users;

    if (currentUserRole === "admin") {
      visibleUsers = users.filter((user) => user.role === "user");
    }

    // Tentukan bobot hierarki untuk pengurutan
    const roleWeights = {
      super_admin: 1,
      admin: 2,
      user: 3,
    };

    return visibleUsers
      .filter((user) => {
        const matchesSearch =
          user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
        const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? user.is_active : !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        // 1. Urutkan berdasarkan bobot Role (Super Admin -> Admin -> User)
        if (roleWeights[a.role] !== roleWeights[b.role]) {
          return roleWeights[a.role] - roleWeights[b.role];
        }
        // 2. Jika jabatannya sama, urutkan berdasarkan Abjad Nama (A-Z)
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, currentUserRole, searchQuery, roleFilter, statusFilter]);

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") return null;

  return (
    <div className="space-y-6 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Manajemen Pengguna</h2>
          <p className="mt-1 text-slate-400">Kelola akses, aktivitas, dan jabatan pengguna AquaExpert.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500"
        >
          <UserPlus className="h-4 w-4" /> Tambah Pengguna
        </button>
      </div>

      {/* STATISTIK */}
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
          {currentUserRole === "super_admin" && (
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
          )}
          <Card className="border-slate-800 bg-slate-900/60 shadow-sm">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-950/50 text-teal-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-400">User</p>
                <p className="text-2xl font-bold text-slate-100">{stats.user}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BILAH ALAT */}
      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-teal-500"
            />
          </div>
          
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full appearance-none rounded-md border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-teal-500"
            >
              <option value="all">Semua Role</option>
              <option value="user">User</option>
              {currentUserRole === "super_admin" && (
                <>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </>
              )}
            </select>
          </div>

          <div className="relative w-full sm:w-40">
            <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full appearance-none rounded-md border border-slate-800 bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-200 outline-none focus:border-teal-500"
            >
              <option value="all">Izin Akses</option>
              <option value="active">Diizinkan</option>
              <option value="inactive">Diblokir</option>
            </select>
          </div>
        </div>
      )}

      {/* GRIDS KARTU PENGGUNA (DIROMBAK DENGAN PENOMORAN) */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-slate-400">
          <Search className="mb-2 h-8 w-8 opacity-50" />
          <p>Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* PERHATIKAN: Saya tambahkan parameter `index` di sini */}
          {filteredUsers.map((user, index) => (
            <Card key={user.id} className={`border-slate-800 bg-slate-900/60 shadow-sm transition-all relative ${!user.is_active ? 'opacity-60 grayscale-[40%]' : ''}`}>
              
              {/* NOMOR URUT DI POJOK KANAN ATAS (Watermark Transparan agar elegan) */}
              <div className="absolute top-2 right-3 text-4xl font-black text-slate-800/50 pointer-events-none select-none z-0">
                #{index + 1}
              </div>

              <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 overflow-hidden w-full">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${user.is_active ? 'bg-slate-800 text-slate-400' : 'bg-red-950 text-red-500'}`}>
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden w-full">
                      
                      <div className="flex items-center justify-between gap-2 mr-6"> {/* mr-6 memberi ruang untuk nomor urut transparan */}
                        <h3 className="truncate font-semibold text-slate-200" title={user.full_name}>
                          {/* NOMOR URUT DI SEBELAH NAMA */}
                          <span className="text-slate-500 font-mono mr-1.5">{index + 1}.</span>
                          {user.full_name}
                        </h3>
                        
                        {/* LABEL IZIN AKSES */}
                        {user.is_active ? (
                          <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700">AKUN AKTIF</span>
                        ) : (
                          <span className="shrink-0 rounded bg-red-900/50 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-800 animate-pulse">DIBLOKIR</span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="truncate" title={user.email}>{user.email}</span>
                        </div>

                        {user.created_at && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                            <span className="truncate">Terdaftar: {new Date(user.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                          {user.last_login_at ? (
                            <span className="truncate text-teal-400 font-medium">
                              Login: {new Date(user.last_login_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="truncate text-yellow-500 font-medium italic">
                              Cuma daftar (Belum login)
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={
                      currentUserRole !== "super_admin" || 
                      user.id === currentUserAuth?.id || 
                      (user.role === "super_admin" && stats.superAdmin === 1)
                    } 
                    className={`rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors ${
                      user.role === "super_admin" ? "border-red-900 bg-red-950/30 text-red-400" : user.role === "admin" ? "border-yellow-900 bg-yellow-950/30 text-yellow-400" : "border-teal-900 bg-teal-950/30 text-teal-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="user" className="bg-slate-900 text-slate-200">User</option>
                    <option value="admin" className="bg-slate-900 text-slate-200">Admin</option>
                    {currentUserRole === "super_admin" && <option value="super_admin" className="bg-slate-900 text-slate-200">Super Admin</option>}
                  </select>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setSelectedUser(user); setEditNameValue(user.full_name); setIsEditModalOpen(true); }}
                      disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user")} 
                      title="Edit Nama Lengkap"
                      className="rounded-md bg-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    
                    <button 
                      onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }}
                      disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user")}
                      title="Reset Kata Sandi"
                      className="rounded-md bg-slate-800 p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    
                    <button 
                      onClick={() => handleToggleStatus(user)}
                      disabled={
                        user.id === currentUserAuth?.id || 
                        (currentUserRole === "admin" && user.role !== "user") ||
                        (user.role === "super_admin" && stats.superAdmin === 1)
                      }
                      title={user.is_active ? "Blokir Akun Ini" : "Izinkan Akses Akun Ini"}
                      className={`rounded-md p-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${user.is_active ? 'bg-slate-800 text-slate-400 hover:bg-red-900 hover:text-red-300' : 'bg-red-900/50 text-red-400 hover:bg-teal-900 hover:text-teal-300'}`}
                    >
                      {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>

                    <button 
                      onClick={() => handleHardDelete(user)}
                      disabled={
                        user.id === currentUserAuth?.id || 
                        (currentUserRole === "admin" && user.role !== "user") ||
                        (user.role === "super_admin" && stats.superAdmin === 1)
                      }
                      title="Hapus Akun Permanen"
                      className="rounded-md bg-slate-800 p-1.5 text-slate-400 transition hover:bg-red-900 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* SISA KODE MODAL TETAP SAMA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
           <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Tambah Pengguna Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-300">Nama Lengkap</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Password</label>
                <input required minLength={6} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Jabatan (Role)</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} disabled={currentUserRole === "admin"} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 outline-none focus:border-teal-500 disabled:opacity-50">
                  <option value="user">User</option>
                  {currentUserRole === "super_admin" && (
                    <>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </>
                  )}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Ubah Profil Pengguna</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditNameValue(""); }} className="text-slate-400 hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <p className="text-sm text-slate-400">Mengubah data profil untuk akun: <br/><strong className="text-slate-200">{selectedUser.email}</strong></p>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Nama Lengkap Baru</label>
                <input required type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-teal-500 outline-none" />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditNameValue(""); }} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50">{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-100">Reset Password</h3>
              <button onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="text-slate-400 hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-400">Masukkan password baru untuk <strong className="text-slate-200">{selectedUser.full_name}</strong>.</p>
              <div>
                <label className="mb-1 block text-sm text-slate-300">Password Baru</label>
                <input required minLength={6} type="password" placeholder="Minimal 6 karakter" value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200 focus:border-teal-500 outline-none" />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-800 pt-4">
                <button type="button" onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50">{isSubmitting ? "Memproses..." : "Reset Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}