"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getUsers } from "@/features/users/repositories/user.repository";
import {
  createUser,
  toggleUserStatus,
  resetUserPassword,
  updateUserProfile,
  hardDeleteUser,
  updateUserRoleAction,
} from "@/features/users/actions/user.actions";
import type { UserProfile, UserRole } from "@/features/users/types/user.types";
import {
  Loader2,
  ShieldAlert,
  User as UserIcon,
  Mail,
  Users,
  Shield,
  ShieldCheck,
  UserPlus,
  X,
  KeyRound,
  Power,
  PowerOff,
  Search,
  Filter,
  Pencil,
  Trash2,
  CalendarDays,
  Activity,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

type RoleFilter = UserRole | "all";
type StatusFilter = "active" | "inactive" | "all";

export default function UsersPage() {
  const { user: currentUserAuth, role: currentUserRole } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userToToggle, setUserToToggle] = useState<UserProfile | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [roleChangeData, setRoleChangeData] = useState<{
    user: UserProfile;
    newRole: UserRole;
  } | null>(null);

  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user" as UserRole,
  });

  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [editNameValue, setEditNameValue] = useState("");

  const loadUsersData = async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserRole === "super_admin" || currentUserRole === "admin") {
      loadUsersData();
    }
  }, [currentUserRole]);

  const getAccessToken = async () => {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw new Error(error.message);
    }

    const token = session?.access_token ?? null;

    if (!token) {
      throw new Error("Sesi login tidak ditemukan. Harap login ulang.");
    }

    return token;
  };

  const executeRoleChange = async () => {
    if (!roleChangeData) return;

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();

      const result = await updateUserRoleAction(
        roleChangeData.user.id,
        roleChangeData.newRole,
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal mengubah role.");
      }

      toast.success(result.message || "Role berhasil diubah.");
      await loadUsersData();
      setRoleChangeData(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mengubah role.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeToggleStatus = async () => {
    if (!userToToggle) return;

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();

      const result = await toggleUserStatus(
        userToToggle.id,
        userToToggle.is_active,
        userToToggle.role,
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal mengubah status pengguna.");
      }

      toast.success(result.message || "Status pengguna berhasil diperbarui.");
      await loadUsersData();
      setUserToToggle(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memproses status pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeHardDelete = async () => {
    if (!userToDelete) return;

    if (deleteConfirmText.trim() !== userToDelete.email) {
      toast.error("Email konfirmasi tidak sesuai.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();

      const result = await hardDeleteUser(
        userToDelete.id,
        userToDelete.role,
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal menghapus pengguna.");
      }

      toast.success(result.message || "Pengguna berhasil dihapus.");
      await loadUsersData();
      setUserToDelete(null);
      setDeleteConfirmText("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menghapus pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();

      const result = await updateUserProfile(
        selectedUser.id,
        editNameValue,
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal memperbarui profil.");
      }

      toast.success(result.message || "Profil berhasil diperbarui.");
      await loadUsersData();
      setIsEditModalOpen(false);
      setSelectedUser(null);
      setEditNameValue("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal memperbarui profil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (currentUserRole === "admin" && formData.role !== "user") {
        throw new Error("Admin hanya dapat membuat user biasa.");
      }

      const token = await getAccessToken();

      const result = await createUser(
        {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
        },
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal menambahkan pengguna.");
      }

      toast.success(result.message || "Pengguna berhasil ditambahkan.");
      setIsAddModalOpen(false);
      setFormData({
        email: "",
        password: "",
        full_name: "",
        role: "user",
      });
      setShowAddPassword(false);
      await loadUsersData();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal menambahkan pengguna.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const token = await getAccessToken();

      const result = await resetUserPassword(
        selectedUser.id,
        resetPasswordValue,
        selectedUser.role,
        token
      );

      if (!result.success) {
        throw new Error(result.error || "Gagal mereset password.");
      }

      toast.success(result.message || "Password berhasil di-reset.");
      setIsResetModalOpen(false);
      setSelectedUser(null);
      setResetPasswordValue("");
      setShowResetPassword(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Gagal mereset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const visibleUsers =
      currentUserRole === "admin"
        ? users.filter((u) => u.role === "user")
        : users;

    return {
      total: visibleUsers.length,
      superAdmin: visibleUsers.filter((u) => u.role === "super_admin").length,
      admin: visibleUsers.filter((u) => u.role === "admin").length,
      user: visibleUsers.filter((u) => u.role === "user").length,
    };
  }, [users, currentUserRole]);

  const filteredUsers = useMemo(() => {
    let visibleUsers = users;

    if (currentUserRole === "admin") {
      visibleUsers = users.filter((user) => user.role === "user");
    }

    const roleWeights: Record<UserRole, number> = {
      super_admin: 1,
      admin: 2,
      user: 3,
    };

    return visibleUsers
      .filter((user) => {
        const name = user.full_name || "";
        const email = user.email || "";

        const matchesSearch =
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole =
          roleFilter === "all" ? true : user.role === roleFilter;

        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
            ? user.is_active
            : !user.is_active;

        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => {
        if (roleWeights[a.role] !== roleWeights[b.role]) {
          return roleWeights[a.role] - roleWeights[b.role];
        }
        return (a.full_name || "").localeCompare(b.full_name || "");
      });
  }, [users, currentUserRole, searchQuery, roleFilter, statusFilter]);

  if (currentUserRole !== "super_admin" && currentUserRole !== "admin") {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-10 pt-6 text-slate-900 sm:px-6 lg:px-8 dark:text-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
            Manajemen Pengguna
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Kelola akses, aktivitas, dan jabatan pengguna.
          </p>
        </div>

        <button
          onClick={() => {
            setIsAddModalOpen(true);
            setShowAddPassword(false);
          }}
          className="flex items-center justify-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500"
        >
          <UserPlus className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      {!loading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Akun
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stats.total}
                </p>
              </div>
            </CardContent>
          </Card>

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Super Admin
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {stats.superAdmin}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {currentUserRole === "super_admin" && (
            <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-950/50 dark:text-yellow-400">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Admin
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {stats.admin}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  User
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-slate-100">
                  {stats.user}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Cari nama atau email pengguna..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">Semua Role</option>
              <option value="user">User</option>
              {currentUserRole === "super_admin" && <option value="admin">Admin</option>}
              {currentUserRole === "super_admin" && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
          </div>

          <div className="relative w-full sm:w-40">
            <Activity className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full appearance-none rounded-md border border-slate-300 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="all">Izin Akses</option>
              <option value="active">Diizinkan</option>
              <option value="inactive">Diblokir</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <Search className="mb-2 h-8 w-8 opacity-40" />
          <p>Tidak ada pengguna yang cocok.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user, index) => {
            const disableManage =
              user.id === currentUserAuth?.id ||
              (currentUserRole === "admin" && user.role !== "user");

            const disableRoleSelect =
              currentUserRole !== "super_admin" ||
              user.id === currentUserAuth?.id;

            const disableSuperAdminDanger =
              user.role === "super_admin" && stats.superAdmin <= 1;

            return (
              <Card
                key={user.id}
                className={`relative border-slate-200 bg-white shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900/60 ${
                  !user.is_active ? "opacity-60 grayscale-[0.4]" : ""
                }`}
              >
                <div className="pointer-events-none absolute right-3 top-2 z-0 select-none text-4xl font-black text-slate-200/60 transition-colors dark:text-slate-800/50">
                  {index + 1}
                </div>

                <CardContent className="relative z-10 p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex w-full gap-3 overflow-hidden">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          user.is_active
                            ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-500"
                        }`}
                      >
                        <UserIcon className="h-5 w-5" />
                      </div>

                      <div className="w-full overflow-hidden">
                        <div className="mr-6 flex items-center justify-between gap-2">
                          <h3
                            className="truncate font-semibold text-gray-900 dark:text-slate-200"
                            title={user.full_name || "-"}
                          >
                            <span className="mr-1.5 font-mono text-slate-400 dark:text-slate-500">
                              {index + 1}.
                            </span>
                            {user.full_name || "-"}
                          </h3>

                          {user.is_active ? (
                            <span className="shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              AKUN AKTIF
                            </span>
                          ) : (
                            <span className="shrink-0 rounded border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 dark:border-red-800 dark:bg-red-900/50 dark:text-red-400">
                              DIBLOKIR
                            </span>
                          )}
                        </div>

                        <div className="mt-2 flex flex-col gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            <span className="truncate" title={user.email}>
                              {user.email}
                            </span>
                          </div>

                          {user.created_at && (
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                              <span className="truncate">
                                Terdaftar{" "}
                                {new Date(user.created_at).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Activity className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                            {user.last_login_at ? (
                              <span className="truncate font-medium text-teal-600 dark:text-teal-400">
                                Login{" "}
                                {new Date(user.last_login_at).toLocaleString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : (
                              <span className="truncate italic text-yellow-600 dark:text-yellow-500">
                                Belum pernah login
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        setRoleChangeData({
                          user,
                          newRole: e.target.value as UserRole,
                        })
                      }
                      disabled={disableRoleSelect || disableSuperAdminDanger}
                      className={`cursor-pointer rounded-md border px-2 py-1 text-xs font-medium outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.role === "super_admin"
                          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                          : user.role === "admin"
                          ? "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-400"
                          : "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-400"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      {currentUserRole === "super_admin" && (
                        <option value="super_admin">Super Admin</option>
                      )}
                    </select>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setEditNameValue(user.full_name || "");
                          setIsEditModalOpen(true);
                        }}
                        disabled={disableManage}
                        title="Edit Nama Lengkap"
                        className="rounded-md bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(user);
                          setIsResetModalOpen(true);
                          setShowResetPassword(false);
                        }}
                        disabled={disableManage}
                        title="Reset Kata Sandi"
                        className="rounded-md bg-slate-100 p-1.5 text-slate-600 transition hover:bg-slate-200 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-white"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setUserToToggle(user)}
                        disabled={disableManage || disableSuperAdminDanger}
                        title={user.is_active ? "Blokir Akun Ini" : "Izinkan Akses Akun Ini"}
                        className={`rounded-md p-1.5 transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          user.is_active
                            ? "bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900 dark:hover:text-red-300"
                            : "bg-red-100 text-red-700 hover:bg-teal-100 hover:text-teal-700 dark:bg-red-900/50 dark:text-red-400 dark:hover:bg-teal-900 dark:hover:text-teal-300"
                        }`}
                      >
                        {user.is_active ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteConfirmText("");
                        }}
                        disabled={disableManage || disableSuperAdminDanger}
                        title="Hapus Akun Permanen"
                        className="rounded-md bg-slate-100 p-1.5 text-slate-600 transition hover:bg-red-100 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-red-900 dark:hover:text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {userToToggle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`rounded-full p-2 ${
                  userToToggle.is_active
                    ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                    : "bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-400"
                }`}
              >
                <Power className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Ubah Status Akun</h3>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Anda yakin ingin{" "}
              <strong>
                {userToToggle.is_active ? "memblokir" : "mengaktifkan"}
              </strong>{" "}
              akses login untuk{" "}
              <strong className="text-gray-900 dark:text-slate-200">
                {userToToggle.full_name}
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setUserToToggle(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeToggleStatus}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  userToToggle.is_active
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-teal-600 hover:bg-teal-500"
                }`}
              >
                {isSubmitting
                  ? "Memproses..."
                  : userToToggle.is_active
                  ? "Ya, Blokir"
                  : "Ya, Aktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {roleChangeData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Ubah Hak Akses</h3>
            </div>

            <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Anda yakin ingin mengubah tingkat hak akses{" "}
              <strong className="text-gray-900 dark:text-slate-200">
                {roleChangeData.user.full_name}
              </strong>{" "}
              menjadi{" "}
              <strong className="uppercase text-teal-600 dark:text-teal-400">
                {roleChangeData.newRole}
              </strong>
              ?
            </p>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setRoleChangeData(null)}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={executeRoleChange}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "Ya, Ubah Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 shadow-xl dark:border-red-900/50 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-900/50 dark:text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
                Hapus Permanen
              </h3>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Tindakan ini <strong>tidak dapat dibatalkan</strong>. Ketik email{" "}
              <strong className="select-all text-gray-900 dark:text-slate-200">
                {userToDelete.email}
              </strong>{" "}
              untuk mengonfirmasi.
            </p>

            <input
              required
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Ketik email pengguna..."
              className="mb-6 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900 outline-none transition-colors focus:border-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            />

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteConfirmText("");
                }}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || deleteConfirmText.trim() !== userToDelete.email}
                onClick={executeHardDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Menghapus..." : "Hapus Akun"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Tambah Pengguna Baru
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    required
                    minLength={6}
                    type={showAddPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showAddPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Jabatan Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value as UserRole,
                    }))
                  }
                  disabled={currentUserRole === "admin"}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-teal-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  <option value="user">User</option>
                  {currentUserRole === "super_admin" && <option value="admin">Admin</option>}
                  {currentUserRole === "super_admin" && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Ubah Profil Pengguna
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditNameValue("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mengubah data profil untuk akun <br />
                <strong className="text-gray-900 dark:text-slate-200">
                  {selectedUser.email}
                </strong>
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nama Lengkap Baru
                </label>
                <input
                  required
                  type="text"
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditNameValue("");
                  }}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm dark:bg-slate-950/90">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">
                Reset Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsResetModalOpen(false);
                  setResetPasswordValue("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Masukkan password baru untuk{" "}
                <strong className="text-gray-900 dark:text-slate-200">
                  {selectedUser.full_name}
                </strong>
                .
              </p>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    required
                    minLength={6}
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={resetPasswordValue}
                    onChange={(e) => setResetPasswordValue(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 outline-none transition-colors focus:border-teal-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetPasswordValue("");
                  }}
                  className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-500 disabled:opacity-50"
                >
                  {isSubmitting ? "Memproses..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};