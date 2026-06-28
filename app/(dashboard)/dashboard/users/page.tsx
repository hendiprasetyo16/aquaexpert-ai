// app/(dashboard)/dashboard/users/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUsers } from "@/features/users/repositories/user.repository";
import { useLanguage } from "@/providers/LanguageProvider"; // <-- IMPORT KAMUS

import { 
  createUser, toggleUserStatus, resetUserPassword, updateUserProfile, hardDeleteUser, updateUserRoleAction 
} from "@/features/users/actions/user.actions";
import { UserProfile, UserRole } from "@/features/users/types/user.types";

import { 
  Loader2, ShieldAlert, User as UserIcon, Mail, Users, 
  Shield, ShieldCheck, UserPlus, X, KeyRound, Power, PowerOff, Search, Filter, Pencil, Trash2, CalendarDays, Activity, Eye, EyeOff, AlertTriangle, Globe
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { user: currentUserAuth, role: currentUserRole } = useAuth();
  const { dict } = useLanguage(); 
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all"); 

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userToToggle, setUserToToggle] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [roleChangeData, setRoleChangeData] = useState<{user: UserProfile, newRole: UserRole} | null>(null);
  
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

  const executeRoleChange = async () => {
    if (!roleChangeData) return;
    setIsSubmitting(true);
    
    try {
      const result = await updateUserRoleAction(roleChangeData.user.id, roleChangeData.newRole);
      if (!result.success) throw new Error(result.error || "Error");
      
      toast.success("Success!");
      await loadUsersData(); 
      setRoleChangeData(null); 
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const executeToggleStatus = async () => {
    if (!userToToggle) return;
    setIsSubmitting(true);

    try {
      const result = await toggleUserStatus(userToToggle.id, userToToggle.is_active, userToToggle.role);
      if (!result.success) throw new Error(result.error);

      toast.success("Success!");
      await loadUsersData(); 
      setUserToToggle(null);
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const executeHardDelete = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!userToDelete) return;
    if (deleteConfirmText !== userToDelete.email) { toast.error("Email mismatch"); return; }

    setIsSubmitting(true);
    try {
      const result = await hardDeleteUser(userToDelete.id, userToDelete.role);
      if (!result.success) throw new Error(result.error || "Error");
      
      toast.success("Success!");
      await loadUsersData(); 
      setUserToDelete(null); setDeleteConfirmText("");
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);

    try {
      const result = await updateUserProfile(selectedUser.id, editNameValue);
      if (!result.success) throw new Error(result.error || "Error");
      
      toast.success("Success!");
      await loadUsersData();
      setIsEditModalOpen(false); 
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (currentUserRole === "admin" && formData.role !== "user") {
      toast.error("Admin only user"); setIsSubmitting(false); return;
    }
    
    try {
      const result = await createUser(formData);
      if (result.success) {
        toast.success("Success!"); 
        setIsAddModalOpen(false);
        setFormData({ email: "", password: "", full_name: "", role: "user" });
        setShowAddPassword(false);
        await loadUsersData(); 
      } else { throw new Error(result.error || "Error"); }
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsSubmitting(true);
    
    try {
      const result = await resetUserPassword(selectedUser.id, resetPasswordValue, selectedUser.role);
      if (result.success) {
        toast.success("Success!");
        setIsResetModalOpen(false); setResetPasswordValue(""); setShowResetPassword(false);
      } else { throw new Error(result.error || "Error"); }
    } catch (error: unknown) { 
      toast.error(error instanceof Error ? error.message : "Error"); 
    } finally { setIsSubmitting(false); }
  };

  const stats = useMemo(() => {
    const visibleUsers = currentUserRole === "admin" ? users.filter(u => u.role === "user") : users;
    return {
      total: visibleUsers.length,
      superAdmin: visibleUsers.filter(u => u.role === "super_admin").length,
      admin: visibleUsers.filter(u => u.role === "admin").length,
      user: visibleUsers.filter(u => u.role === "user").length,
    };
  }, [users, currentUserRole]);

  const filteredUsers = useMemo(() => {
    let visibleUsers = users;
    if (currentUserRole === "admin") visibleUsers = users.filter((user) => user.role === "user");

    const roleWeights = { super_admin: 1, admin: 2, user: 3 };

    return visibleUsers
      .filter((user) => {
        const matchesSearch = user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || user.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
        const matchesStatus = statusFilter === "all" ? true : statusFilter === "active" ? user.is_active : !user.is_active;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (roleWeights[a.role] !== roleWeights[b.role]) return roleWeights[a.role] - roleWeights[b.role];
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, currentUserRole, searchQuery, roleFilter, statusFilter]);

  const getRoleNeonGlow = (role: UserRole) => {
    if (role === "super_admin") return "hover:border-red-400 dark:hover:border-red-500 hover:shadow-[0_0_20px_rgba(248,113,113,0.3)] dark:hover:shadow-[0_0_25px_rgba(239,68,68,0.5)]";
    if (role === "admin") return "hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] dark:hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]";
    return "hover:border-teal-400 dark:hover:border-teal-500 hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] dark:hover:shadow-[0_0_25px_rgba(20,184,166,0.5)]";
  };

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{dict.usersMgmt.title}</h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{dict.usersMgmt.subtitle}</p>
        </div>
        
        <button 
          onClick={() => { setIsAddModalOpen(true); setShowAddPassword(false); }}
          className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500 shadow-[0_0_15px_rgba(13,148,136,0.4)] dark:shadow-[0_0_20px_rgba(13,148,136,0.6)]"
        >
          <UserPlus className="h-4 w-4" /> {dict.usersMgmt.addUser}
        </button>
      </div>

      {/* STATISTIK DENGAN NEON RINGAN SAAT HOVER */}
      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-500 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"><Users className="h-6 w-6" /></div>
              <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict.usersMgmt.totalAccounts}</p><p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.total}</p></div>
            </CardContent>
          </Card>

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-500 hover:border-red-400 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"><ShieldAlert className="h-6 w-6" /></div>
                <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict.usersMgmt.superAdmin}</p><p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.superAdmin}</p></div>
              </CardContent>
            </Card>
          )}

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-500 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-950/50 text-yellow-600 dark:text-yellow-400"><ShieldCheck className="h-6 w-6" /></div>
                <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict.usersMgmt.admin}</p><p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.admin}</p></div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm transition-all duration-500 hover:border-teal-400 hover:shadow-[0_0_20px_rgba(20,184,166,0.2)]">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400"><Shield className="h-6 w-6" /></div>
              <div><p className="text-sm font-medium text-slate-500 dark:text-slate-400">{dict.usersMgmt.user}</p><p className="text-2xl font-bold text-gray-900 dark:text-slate-100">{stats.user}</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* BILAH ALAT */}
      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input type="text" placeholder={dict.usersMgmt.searchPlaceholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors shadow-sm" />
          </div>
          
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as "all" | UserRole)} className="w-full appearance-none rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors shadow-sm">
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.allRoles}</option>
              <option value="user" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.user}</option>
              {currentUserRole === "super_admin" && (
                <><option value="admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.admin}</option><option value="super_admin" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.superAdmin}</option></>
              )}
            </select>
          </div>

          <div className="relative w-full sm:w-40">
            <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")} className="w-full appearance-none rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-4 text-sm text-slate-900 dark:text-slate-200 outline-none focus:border-teal-500 transition-colors shadow-sm">
              <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.accessStatus}</option>
              <option value="active" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.allowed}</option>
              <option value="inactive" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">{dict.usersMgmt.blocked}</option>
            </select>
          </div>
        </div>
      )}

      {/* GRIDS KARTU PENGGUNA DENGAN NEON GLOW */}
      {loading ? (
        <div className="flex h-40 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-500" /></div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-slate-500 dark:text-slate-400"><Search className="mb-2 h-8 w-8 opacity-40" /><p>{dict.usersMgmt.noUsersFound}</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user, index) => (
            <Card key={user.id} className={`border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 transition-all duration-500 relative flex flex-col h-full ${!user.is_active ? 'opacity-60 grayscale-[40%]' : ''} ${getRoleNeonGlow(user.role)}`}>
              <div className="absolute top-2 right-3 text-4xl font-black text-slate-200/60 dark:text-slate-800/50 pointer-events-none select-none z-0 transition-colors">#{index + 1}</div>
              <CardContent className="p-5 relative z-10 flex-1 flex flex-col justify-between">
                
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
                        {user.is_active ? (
                          <span className="shrink-0 rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{dict.usersMgmt.statusActive}</span>
                        ) : (
                          <span className="shrink-0 rounded bg-red-50 dark:bg-red-900/50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">{dict.usersMgmt.statusBlocked}</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" /><span className="truncate" title={user.email}>{user.email}</span></div>
                        
                        {user.created_at && (
                          <div className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" /><span className="truncate">{dict.usersMgmt.registeredAt} {new Date(user.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          {user.last_login_at ? (
                            <span className="truncate text-teal-600 dark:text-teal-400 font-medium">{dict.usersMgmt.lastLogin} {new Date(user.last_login_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          ) : (
                            <span className="truncate text-yellow-600 dark:text-yellow-500 font-medium italic">{dict.usersMgmt.neverLoggedIn}</span>
                          )}
                        </div>
                        
{/* =========================================================
    KODE BARU: IP ADDRESS DENGAN ICON GLOBE (WARNA BIRU)
========================================================= */}
<div className="flex items-center gap-2 mt-0.5 text-blue-600 dark:text-blue-400">
  <Globe className="h-3.5 w-3.5 shrink-0" />
  <span className="truncate font-semibold text-xs">
    Ip address : {
      ("ip_address" in user && user.ip_address) 
      ? String(user.ip_address) 
      : ("last_sign_in_ip" in user && user.last_sign_in_ip) 
      ? String(user.last_sign_in_ip) 
      : "Belum terekam"
    }
  </span>
</div>
{/* ========================================================= */}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedUser(user); setEditNameValue(user.full_name); setIsEditModalOpen(true); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-teal-600 dark:hover:bg-slate-800 dark:hover:text-teal-400 transition-colors"><Pencil className="h-4 w-4" /></button>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors relative z-20">
                  <select 
                    value={user.role} 
                    onChange={(e) => { setRoleChangeData({ user, newRole: e.target.value as UserRole }); }} 
                    disabled={currentUserRole !== "super_admin" || user.id === currentUserAuth?.id || (user.role === "super_admin" && stats.superAdmin === 1)}
                    className={`rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors ${
                      user.role === "super_admin" 
                        ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400" 
                        : user.role === "admin"
                        ? "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                        : "border-teal-200 dark:border-teal-900 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="user">{dict.usersMgmt.user}</option>
                    <option value="admin">{dict.usersMgmt.admin}</option>
                    {currentUserRole === "super_admin" && <option value="super_admin">{dict.usersMgmt.superAdmin}</option>}
                  </select>

                  <div className="flex gap-2">
                    {/* FIX TS: Menggunakan tooltipResetPass sesuai dictionary */}
                    <button onClick={() => { setSelectedUser(user); setIsResetModalOpen(true); }} disabled={currentUserRole === "admin" && user.role !== "user"} title={dict.usersMgmt.tooltipResetPass} className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-blue-100 dark:hover:bg-blue-900 hover:text-blue-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" >
                      <KeyRound className="h-4 w-4" />
                    </button>
                    <button onClick={() => setUserToToggle(user)} disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user") || (user.role === "super_admin" && stats.superAdmin === 1)} title={user.is_active ? dict.usersMgmt.tooltipBlock : dict.usersMgmt.tooltipAllow} className={`rounded-md p-1.5 transition disabled:opacity-40 disabled:cursor-not-allowed ${user.is_active ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-yellow-100 hover:text-yellow-700 dark:hover:bg-yellow-900 dark:hover:text-yellow-400' : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900 dark:hover:text-teal-400'}`}>
                      {user.is_active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </button>
                    <button onClick={() => { setUserToDelete(user); setDeleteConfirmText(""); }} disabled={user.id === currentUserAuth?.id || (currentUserRole === "admin" && user.role !== "user") || (user.role === "super_admin" && stats.superAdmin === 1)} title={dict.usersMgmt.tooltipDelete} className="rounded-md bg-slate-100 dark:bg-slate-800 p-1.5 text-slate-600 dark:text-slate-400 transition hover:bg-red-100 dark:hover:bg-red-900 hover:text-red-700 dark:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed" >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL 1: KONFIRMASI UBAH STATUS */}
      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all">
            <div className="mb-4 flex items-center gap-3">
              <div className={`p-2 rounded-full ${userToToggle.is_active ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400' : 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400'}`}>
                <Power className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{dict.usersMgmt.modalChangeStatus}</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {dict.usersMgmt.modalChangeStatusDesc1} <strong>{userToToggle.is_active ? dict.usersMgmt.btnBlock.toLowerCase() : dict.usersMgmt.btnAllow.toLowerCase()}</strong> {dict.usersMgmt.modalChangeStatusDesc2} <strong className="text-gray-900 dark:text-slate-200">{userToToggle.email}</strong>?
            </p>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={isSubmitting} onClick={() => setUserToToggle(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
              <button type="button" onClick={executeToggleStatus} disabled={isSubmitting} className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 shadow-md ${userToToggle.is_active ? 'bg-red-600 hover:bg-red-500 shadow-red-600/20' : 'bg-teal-600 hover:bg-teal-500 shadow-teal-600/20'}`}>
                {isSubmitting ? dict.usersMgmt.processing : userToToggle.is_active ? dict.usersMgmt.btnBlock : dict.usersMgmt.btnAllow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: KONFIRMASI UBAH PERAN */}
      {roleChangeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400 p-2 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{dict.usersMgmt.modalChangeRole}</h3>
            </div>
            
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              {dict.usersMgmt.modalChangeRoleDesc1} <strong className="text-gray-900 dark:text-slate-200">{roleChangeData.user.email}</strong> {dict.usersMgmt.modalChangeRoleDesc2} <strong>{roleChangeData.user.role}</strong> {((dict.usersMgmt as unknown) as Record<string, string>).modalChangeRoleDesc3 || "menjadi"} <strong>{roleChangeData.newRole}</strong>?
            </p>
            
            <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
              <button type="button" disabled={isSubmitting} onClick={() => setRoleChangeData(null)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
              <button type="button" onClick={executeRoleChange} disabled={isSubmitting} className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-50 shadow-md shadow-amber-600/20">
                {isSubmitting ? dict.usersMgmt.processing : dict.usersMgmt.btnChangeRole}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HARD DELETE */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-900/30 bg-white dark:bg-slate-900 p-6 shadow-2xl transition-all">
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400 p-2 rounded-full">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{dict.usersMgmt.modalHardDelete}</h3>
            </div>
            
            <form onSubmit={executeHardDelete}>
              <div className="mb-4 rounded-md bg-red-50 dark:bg-red-950/30 p-4 border border-red-100 dark:border-red-900/50">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">{dict.usersMgmt.modalHardDeleteDesc1}</p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{dict.usersMgmt.modalHardDeleteDesc2}</p>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {dict.usersMgmt.modalHardDeleteDesc3} <strong className="text-gray-900 dark:text-slate-200 select-all">{userToDelete.email}</strong> {dict.usersMgmt.modalHardDeleteDesc4}
              </p>
              
              <input required type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder={dict.usersMgmt.typeUserEmail} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 outline-none focus:border-red-500 transition-colors mb-6" />
              
              <div className="flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
                <button type="button" disabled={isSubmitting} onClick={() => {setUserToDelete(null); setDeleteConfirmText("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
                <button type="submit" disabled={isSubmitting || deleteConfirmText !== userToDelete.email} className="rounded-md px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-600/20">
                  {isSubmitting ? dict.usersMgmt.deleting : dict.usersMgmt.btnDeleteAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: TAMBAH PENGGUNA BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-teal-600 dark:text-teal-400" /> {dict.usersMgmt.addUser}</h3>
              <button onClick={() => {setIsAddModalOpen(false); setFormData({ email: "", password: "", full_name: "", role: "user" });}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).emailAddress || "Alamat Email"}</label>
                <input required type="email" placeholder="example@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).fullName || "Nama Lengkap"}</label>
                <input required type="text" placeholder="John Doe" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).password || "Kata Sandi"}</label>
                <div className="relative">
                  <input required minLength={6} type={showAddPassword ? "text" : "password"} placeholder={dict.usersMgmt.min6Chars} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
                  <button type="button" onClick={() => setShowAddPassword(!showAddPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><EyeOff className="h-4 w-4" /></button>
                </div>
              </div>

              {currentUserRole === "super_admin" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{dict.usersMgmt.role}</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })} className="w-full appearance-none rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors">
                    <option value="user">{dict.usersMgmt.user}</option>
                    <option value="admin">{dict.usersMgmt.admin}</option>
                    <option value="super_admin">{dict.usersMgmt.superAdmin}</option>
                  </select>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => {setIsAddModalOpen(false); setFormData({ email: "", password: "", full_name: "", role: "user" });}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 shadow-md shadow-teal-600/20 transition-colors">{isSubmitting ? dict.usersMgmt.saving : dict.usersMgmt.btnSaveUser}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: UBAH PROFIL */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2"><Pencil className="h-5 w-5 text-teal-600 dark:text-teal-400" /> {((dict.usersMgmt as unknown) as Record<string, string>).editProfile || "Edit Profil"}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).emailAddress || "Alamat Email"}</label>
                <input disabled type="email" value={selectedUser.email} className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 text-slate-500 dark:text-slate-500 cursor-not-allowed transition-colors" />
                <p className="mt-1 text-xs text-slate-500">{((dict.usersMgmt as unknown) as Record<string, string>).emailCannotBeChanged || "Email tidak dapat diubah setelah terdaftar."}</p>
              </div>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).fullName || "Nama Lengkap"}</label>
                <input required type="text" value={editNameValue} onChange={(e) => setEditNameValue(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
                <button type="submit" disabled={isSubmitting || editNameValue === selectedUser.full_name || editNameValue.trim() === ""} className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50 shadow-md shadow-teal-600/20 transition-colors">{isSubmitting ? dict.usersMgmt.saving : dict.usersMgmt.btnSaveUser}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: RESET KATA SANDI */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 dark:bg-slate-950/90 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl transition-all">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2"><KeyRound className="h-5 w-5 text-amber-600 dark:text-amber-500" /> {((dict.usersMgmt as unknown) as Record<string, string>).resetPassword || "Reset Kata Sandi"}</h3>
              <button onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {dict.usersMgmt.modalResetPassDesc} <strong className="text-gray-900 dark:text-slate-200">{selectedUser.email}</strong>.
              </p>
              
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{((dict.usersMgmt as unknown) as Record<string, string>).newPassword || "Kata Sandi Baru"}</label>
                <div className="relative">
                  <input required minLength={6} type={showResetPassword ? "text" : "password"} placeholder={dict.usersMgmt.min6Chars} value={resetPasswordValue} onChange={(e) => setResetPasswordValue(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 pr-10 text-slate-900 dark:text-slate-200 focus:border-teal-500 outline-none transition-colors" />
                  <button type="button" onClick={() => setShowResetPassword(!showResetPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><EyeOff className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 transition-colors">
                <button type="button" onClick={() => {setIsResetModalOpen(false); setResetPasswordValue("");}} className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">{dict.usersMgmt.cancel}</button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-500 disabled:opacity-50 shadow-md shadow-yellow-600/20 transition-colors">
                  {isSubmitting ? dict.usersMgmt.processing : dict.usersMgmt.btnResetPass}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}