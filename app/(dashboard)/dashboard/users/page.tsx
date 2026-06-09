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
  Shield, ShieldCheck, UserPlus, X, KeyRound, Power, PowerOff, Search, Filter, Pencil, Trash2, CalendarDays, Activity, Eye, EyeOff, AlertTriangle
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

  // States Kendali Modal Standar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States Modal Kustom
  const [userToToggle, setUserToToggle] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [roleChangeData, setRoleChangeData] = useState<{user: UserProfile, newRole: UserRole} | null>(null);
  
  // States Toggle Ikon Mata
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "", full_name: "", role: "user" as UserRole });
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");

  const loadUsersData = async () => {
    const data = await getUsers();
    setUsers(data);
    loading && setLoading(false);
  };

  useEffect(() => {
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      loadUsersData();
    }
  }, [currentUserRole]);

  // ===================================================================================
  // PERBAIKAN BUG MOBILE: SEMUA FUNGSI EKSEKUSI KINI MENGGUNAKAN FORM EVENT NATIVE
  // ===================================================================================

  const executeRoleChange = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman bawaan form
    if (!roleChangeData) return;
    setIsSubmitting(true);
    
    try {
      const success = await updateUserRole(roleChangeData.user.id, roleChangeData.newRole);
      if (!success) throw new Error("Database menolak perubahan.");
      
      setUsers(prev => prev.map(u => u.id === roleChangeData.user.id ? { ...u, role: roleChangeData.newRole } : u));
      toast.success("Role berhasil diubah!");
      setRoleChangeData(null); // Tutup modal otomatis jika sukses
    } catch (error: any) {
      console.error(error);
      toast.error("Gagal mengubah role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault(); // Wajib agar tombol submit di dalam form tidak me-refresh HP
    if (!userToToggle) return;
    setIsSubmitting(true);
    
    try {
      const result = await toggleUserStatus(userToToggle.id, userToToggle.is_active, userToToggle.role);
      if (!result.success) throw new Error(result.error || "Gagal mengubah status dari database.");
      
      setUsers(prev => prev.map(u => u.id === userToToggle.id ? { ...u, is_active: !userToToggle.is_active } : u));
      toast.success(result.message || "Status izin akun berhasil diubah.");
      setUserToToggle(null); // Tutup modal jika eksekusi benar-benar berhasil
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memproses perubahan status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const result = await updateUserProfile(selectedUser.id, editNameValue);
      if (result.success) {
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, full_name: editNameValue } : u));
        toast.success(result.message || "Nama pengguna berhasil diperbarui!");
        setIsEditModalOpen(false); 
      } else {
        throw new Error(result.error || "Gagal memperbarui nama pengguna.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeHardDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToDelete) return;
    if (deleteConfirmText !== userToDelete.email) {
      toast.error("Email konfirmasi tidak sesuai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await hardDeleteUser(userToDelete.id, userToDelete.role);
      if (!result.success) throw new Error(result.error || "Error saat menghapus permanen.");
      
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      toast.success(result.message || "Pengguna berhasil dihapus permanen.");
      setUserToDelete(null); 
      setDeleteConfirmText("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menghapus pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================================================================================

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
      setShowAddPassword(false);
      await loadUsersData();
    } else {
      toast.error(result.error || "Gagal menambahkan pengguna."); 
    }
    
    setIsSubmitting(false);
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
      setShowResetPassword(false);
    } else {
      toast.error(result.error || "Gagal mereset password.");
    }
    
    setIsSubmitting(false);
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

  const filteredUsers = useMemo(() => {
    let visibleUsers = users;

    if (currentUserRole === "admin") {
      visibleUsers = users.filter((user) => user.role === "user");
    }

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
        if (roleWeights[a.role] !== roleWeights[b.role]) {
          return roleWeights[a.role] - roleWeights[b.role];
        }
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, currentUserRole, searchQuery, roleFilter, statusFilter]);

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Manajemen Pengguna</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Kelola akses, aktivitas, dan jabatan pengguna AquaExpert.</p>
        </div>
        
        <button 
          onClick={() => { setIsAddModalOpen(true); setShowAddPassword(false); }}
          className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 shadow-md shadow-teal-600/10 dark:shadow-teal-900/20"
        >
          <UserPlus className="h-4 w-4" /> Tambah Pengguna
        </button>
      </div>

      {/* STATISTIK */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Akun</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Super Admin</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.superAdmin}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Admin</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.admin}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-colors duration-300">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">User</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.user}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BILAH ALAT (BAR PENCARIAN & FILTER) */}
      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors"
            />
          </div>
          
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="w-full appearance-none rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Semua Role</option>
              <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">User</option>
              {currentUserRole === "super_admin" && (
                <>
                  <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Admin</option>
                  <option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Super Admin</option>
                </>
              )}
            </select>
          </div>

          <div className="relative w-full sm:w-40">
            <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full appearance-none rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors"
            >
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Izin Akses</option>
              <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Diizinkan</option>
              <option value="inactive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Diblokir</option>
            </select>
          </div>
        </div>
      )}

      {/* GRIDS KARTU PENGGUNA */}
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <Search className="mb-2 h-8 w-8 opacity-40" />
          <p>Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user, index) => (
            <Card key={user.id} className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-all relative ${!user.is_active ? 'opacity-60 grayscale-[40%]' : ''}`}>
              
              {/* WATERMARK NOMOR URUT */}
              <div className="absolute top-2 right-3 text-4xl font-black text-slate-200/60 dark:text-slate-800/50 pointer-events-none select-none z-0 transition-colors">
                #{index + 1}
              </div>

              <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3 overflow-hidden w-full">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${user.is_active ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-500'}`}>
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div className="overflow-hidden w-full">
                      
                      <div className="flex items-center justify-between gap-2 mr-6">
                        <h3 className="truncate font-semibold text-gray-900 dark:text-slate-200" title={user.full_name}>
                          <span className="text-slate-400 dark:text-slate-500 font-mono mr-1.5">{index + 1}.</span>
                          {user.full_name}
                        </h3>
                        
                        {/* BADGE IZIN AKSES ADAPTIF */}
                        {user.is_active ? (
                          <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">AKUN AKTIF</span>
                        ) : (
                          <span className="shrink-0 rounded bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">DIBLOKIR</span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span className="truncate" title={user.email}>{user.email}</span>
                        </div>

                        {user.created_at && (
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span className="truncate">Terdaftar: {new Date(user.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          {user.last_login_at ? (
                            <span className="truncate text-teal-600 dark:text-teal-400 font-medium">
                              Login: {new Date(user.last_login_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="truncate text-yellow-600 dark:text-yellow-500 font-medium italic">
                              Belum pernah login
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* AREA HAK AKSES DAN ACTION BUTTONS */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                  <select
                    value={user.role}
                    onChange={(e) => {
                      setRoleChangeData({ user, newRole: e.target.value as UserRole });
                    }}
                    disabled={
                      currentUserRole !== "super_admin" || 
                      user.id === currentUserAuth?.id || 
                      (user.role === "super_admin" && stats.superAdmin === 1)
                    } 
                    className={`rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors ${
                      user.role === "super_admin" 
                        ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" 
                        : user.role === "admin" 
                        ? "border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400" 
                        : "border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                  >
                    <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">User</option>
                    <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Admin</option>
                    {currentUserRole === "super_admin" && <option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Super Admin</option>}
                  </select>

                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => { setSelectedUser(user); setEditNameValue(user.full_name); setIsEditModalOpen(true); }}
                      disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user")} 
                      title="Edit Nama Lengkap"
                      className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); setShowResetPassword(false); }}
                      disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user")}
                      title="Reset Kata Sandi"
                      className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setUserToToggle(user)} // Memicu Modal Custom
                      disabled={
                        user.id === currentUserAuth?.id || 
                        (currentUserRole === "admin" && user.role !== "user") ||
                        (user.role === "super_admin" && stats.superAdmin === 1)
                      }
                      title={user.is_active ? "Blokir Akun Ini" : "Izinkan Akses Akun Ini"}
                      className={`rounded-md p-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                        user.is_active 
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-red-300' 
                          : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 hover:bg-teal-100 dark:hover:bg-teal-900 hover:text-teal-700 dark:hover:text-teal-300'
                      }`}
                    >
                      {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>

                    <button 
                      type="button"
                      onClick={() => { setUserToDelete(user); setDeleteConfirmText(""); }} // Memicu Modal Custom
                      disabled={
                        user.id === currentUserAuth?.id || 
                        (currentUserRole === "admin" && user.role !== "user") ||
                        (user.role === "super_admin" && stats.superAdmin === 1)
                      }
                      title="Hapus Akun Permanen"
                      className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* ====================================================================== */}
      {/* 🛑 MODAL-MODAL KUSTOM (DIJAMIN 100% BEKERJA DI MOBILE/PWA/WEBVIEW) 🛑 */}
      {/* ====================================================================== */}

      {/* 1. MODAL KONFIRMASI UBAH STATUS (AKTIF/BLOKIR) */}
      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${userToToggle.is_active ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400'}`}>
                <Power className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Ubah Status Akun</h3>
            </div>
            
            {/* KINI MEMAKAI FORM UNTUK MENCEGAH BUG MOBILE */}
            <form onSubmit={executeToggleStatus}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Anda yakin ingin <strong>{userToToggle.is_active ? "memblokir" : "mengaktifkan"}</strong> akses login untuk akun atas nama <strong className="text-gray-900 dark:text-slate-200">{userToToggle.full_name}</strong>?
              </p>
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={isSubmitting} onClick={() => setUserToToggle(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${userToToggle.is_active ? 'bg-red-600 hover:bg-red-500' : 'bg-teal-600 hover:bg-teal-500'}`}>
                  {isSubmitting ? "Memproses..." : "Ya, Lanjutkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL KONFIRMASI HAPUS PERMANEN */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Hapus Permanen</h3>
            </div>
            
            {/* KINI MEMAKAI FORM UNTUK MENCEGAH BUG MOBILE */}
            <form onSubmit={executeHardDelete}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                Tindakan ini <strong>tidak dapat dibatalkan</strong>. Ketik email <strong className="text-gray-900 dark:text-slate-200 select-all">{userToDelete.email}</strong> untuk mengkonfirmasi penghapusan:
              </p>
              <input 
                required 
                type="text" 
                value={deleteConfirmText} 
                onChange={(e) => setDeleteConfirmText(e.target.value)} 
                placeholder="Ketik email pengguna..."
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-red-500 transition-colors mb-6" 
              />
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={isSubmitting} onClick={() => {setUserToDelete(null); setDeleteConfirmText("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting || deleteConfirmText !== userToDelete.email} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? "Menghapus..." : "Hapus Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL KONFIRMASI UBAH ROLE */}
      {roleChangeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all scale-in-95">
            <div className="mb-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Ubah Hak Akses</h3>
            </div>
            
            {/* KINI MEMAKAI FORM UNTUK MENCEGAH BUG MOBILE */}
            <form onSubmit={executeRoleChange}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Anda yakin ingin mengubah tingkat hak akses <strong className="text-gray-900 dark:text-slate-200">{roleChangeData.user.full_name}</strong> menjadi <strong className="text-teal-600 dark:text-teal-400 uppercase">{roleChangeData.newRole}</strong>?
              </p>
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={isSubmitting} onClick={() => setRoleChangeData(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-50">
                  {isSubmitting ? "Memproses..." : "Ya, Ubah Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ====================================================================== */}
      {/* MODAL BAWAAN YANG SUDAH ADA (TAMBAH, EDIT, RESET PASSWORD) */}
      {/* ====================================================================== */}

      {/* MODAL: TAMBAH PENGGUNA */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Tambah Pengguna Baru</h3>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input required type="text" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <div className="relative">
                  <input 
                    required 
                    minLength={6} 
                    type={showAddPassword ? "text" : "password"} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Jabatan (Role)</label>
                <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as UserRole})} disabled={currentUserRole === "admin"} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 disabled:opacity-50 transition-colors">
                  <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">User</option>
                  {currentUserRole === "super_admin" && (
                    <>
                      <option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Admin</option>
                      <option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">Super Admin</option>
                    </>
                  )}
                </select>
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 transition-colors">{isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UBAH PROFIL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Ubah Profil Pengguna</h3>
              <button type="button" onClick={() => { setIsEditModalOpen(false); setEditNameValue(""); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleEditProfile} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Mengubah data profil untuk akun: <br/><strong className="text-gray-900 dark:text-slate-200">{selectedUser.email}</strong></p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap Baru</label>
                <input required type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setEditNameValue(""); }} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 transition-colors">{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">Reset Password</h3>
              <button type="button" onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">Masukkan password baru untuk <strong className="text-gray-900 dark:text-slate-200">{selectedUser.full_name}</strong>.</p>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password Baru</label>
                <div className="relative">
                  <input 
                    required 
                    minLength={6} 
                    type={showResetPassword ? "text" : "password"} 
                    placeholder="Minimal 6 karakter" 
                    value={resetPasswordValue} 
                    onChange={(e) => setResetPasswordValue(e.target.value)} 
                    className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50 transition-colors">{isSubmitting ? "Memproses..." : "Reset Password"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}