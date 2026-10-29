"use client";

import { useState, useMemo, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import {
  createUser,
  updateUser,
  type UserWithEmail,
} from "@/lib/actions/users";
import type { UserRole } from "@/lib/types/database";

interface UsersContentProps {
  initialUsers: UserWithEmail[];
  currentUserId: string;
}

type RoleFilter = "all" | "admin" | "vendor" | "inactive";

export function UsersContent({
  initialUsers,
  currentUserId,
}: UsersContentProps) {
  const [users, setUsers] = useState<UserWithEmail[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [isPending, startTransition] = useTransition();

  // Feedback banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Create Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [showCreatePass, setShowCreatePass] = useState(false);
  const [createRole, setCreateRole] = useState<UserRole>("vendor");
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Modal state
  const [editingUser, setEditingUser] = useState<UserWithEmail | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [showEditPass, setShowEditPass] = useState(false);
  const [editRole, setEditRole] = useState<UserRole>("vendor");
  const [editActive, setEditActive] = useState(true);
  const [editError, setEditError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role === "admin" && u.is_active).length;
    const vendors = users.filter(
      (u) => u.role === "vendor" && u.is_active
    ).length;
    const inactive = users.filter((u) => !u.is_active).length;
    return { total, admins, vendors, inactive };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (filter === "admin" && (u.role !== "admin" || !u.is_active))
        return false;
      if (filter === "vendor" && (u.role !== "vendor" || !u.is_active))
        return false;
      if (filter === "inactive" && u.is_active) return false;

      if (!q) return true;
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, search, filter]);

  function openCreateModal() {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setShowCreatePass(false);
    setCreateRole("vendor");
    setCreateError(null);
    setCreateOpen(true);
  }

  function openEditModal(user: UserWithEmail) {
    setEditingUser(user);
    setEditName(user.full_name);
    setEditEmail(user.email);
    setEditPassword("");
    setShowEditPass(false);
    setEditRole(user.role);
    setEditActive(user.is_active);
    setEditError(null);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    setFeedback(null);

    startTransition(async () => {
      const res = await createUser({
        full_name: createName,
        email: createEmail,
        password: createPassword,
        role: createRole,
      });

      if (!res.success || !res.data) {
        setCreateError(res.error ?? "No se pudo crear el usuario");
        return;
      }

      setUsers((prev) => [res.data!, ...prev]);
      setCreateOpen(false);
      setFeedback({
        type: "success",
        message: `Usuario "${res.data.full_name}" creado correctamente.`,
      });
    });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setFeedback(null);

    startTransition(async () => {
      const res = await updateUser({
        id: editingUser.id,
        full_name: editName,
        email: editEmail !== editingUser.email ? editEmail : undefined,
        password: editPassword.trim() !== "" ? editPassword : undefined,
        role: editRole,
        is_active: editActive,
      });

      if (!res.success || !res.data) {
        setEditError(res.error ?? "No se pudo actualizar el usuario");
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === res.data!.id ? res.data! : u))
      );
      setEditingUser(null);
      setFeedback({
        type: "success",
        message: `Usuario "${res.data.full_name}" actualizado correctamente.`,
      });
    });
  }

  function handleToggleActive(user: UserWithEmail) {
    if (user.id === currentUserId) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await updateUser({
        id: user.id,
        full_name: user.full_name,
        role: user.role,
        is_active: !user.is_active,
      });

      if (!res.success || !res.data) {
        setFeedback({
          type: "error",
          message: res.error ?? "No se pudo cambiar el estado del usuario",
        });
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === res.data!.id ? res.data! : u))
      );
      setFeedback({
        type: "success",
        message: `Usuario "${res.data.full_name}" ${
          res.data.is_active ? "activado" : "desactivado"
        } correctamente.`,
      });
    });
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary block mb-1">
            Administración y Seguridad
          </span>
          <h1 className="font-heading text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Agrega vendedores o administradores y administra sus permisos de
            acceso.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-primary-container px-5 py-3 text-sm font-heading font-bold text-white shadow-card hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Icon name="person_add" size={20} />
          Nuevo Usuario
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 text-sm font-medium border ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Icon
              name={feedback.type === "success" ? "check_circle" : "error"}
              size={20}
            />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg hover:bg-black/5"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card border border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Total Usuarios
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="group" size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-extrabold text-on-surface">
            {stats.total}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card border border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Administradores
            </span>
            <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-secondary flex items-center justify-center">
              <Icon name="shield_person" size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-extrabold text-on-surface">
            {stats.admins}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card border border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Vendedores Activos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Icon name="badge" size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-extrabold text-on-surface">
            {stats.vendors}
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card border border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-on-surface-variant">
              Inactivos
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container text-on-surface-variant flex items-center justify-center">
              <Icon name="person_off" size={18} />
            </div>
          </div>
          <p className="font-heading text-2xl font-extrabold text-on-surface">
            {stats.inactive}
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-surface-container-lowest rounded-xl p-4 shadow-card border border-outline-variant/15 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={20}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o correo electrónico..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-surface-container-low text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/25 focus:bg-surface-container-lowest transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { key: "all", label: "Todos" },
              { key: "admin", label: "Administradores" },
              { key: "vendor", label: "Vendedores" },
              { key: "inactive", label: "Inactivos" },
            ] as { key: RoleFilter; label: string }[]
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl p-10 text-center shadow-card border border-outline-variant/15">
          <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-outline mb-3">
            <Icon name="manage_accounts" size={24} />
          </div>
          <p className="font-heading font-bold text-on-surface">
            No se encontraron usuarios
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Intenta cambiar los filtros de búsqueda o agrega un nuevo usuario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isSelf = user.id === currentUserId;
            const isAdmin = user.role === "admin";

            return (
              <div
                key={user.id}
                className={`bg-surface-container-lowest rounded-xl p-5 shadow-card border transition-all flex flex-col justify-between gap-4 ${
                  user.is_active
                    ? "border-outline-variant/15"
                    : "border-rose-200/70 bg-surface-container-low/40 opacity-80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-heading font-bold text-lg shrink-0 ${
                        isAdmin
                          ? "bg-secondary-fixed text-secondary"
                          : "bg-primary-fixed/60 text-primary"
                      }`}
                    >
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading font-bold text-base text-on-surface truncate">
                          {user.full_name}
                        </h3>
                        {isSelf && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isAdmin
                          ? "bg-secondary-fixed text-secondary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      <Icon
                        name={isAdmin ? "shield_person" : "point_of_sale"}
                        size={13}
                      />
                      {isAdmin ? "Administrador" : "Vendedor"}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          user.is_active ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      {user.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>

                {/* Meta & Actions */}
                <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-on-surface-variant">
                    {user.last_sign_in_at ? (
                      <span>
                        Último acceso:{" "}
                        <strong className="font-medium text-on-surface">
                          {new Date(user.last_sign_in_at).toLocaleDateString(
                            "es-CO",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </strong>
                      </span>
                    ) : (
                      <span>Sin iniciar sesión aún</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isSelf && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(user)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          user.is_active
                            ? "text-rose-700 hover:bg-rose-50"
                            : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {user.is_active ? "Desactivar" : "Activar"}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                    >
                      <Icon name="edit" size={15} />
                      Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Crear Usuario */}
      <Modal
        open={createOpen}
        onClose={() => !isPending && setCreateOpen(false)}
        title="Agregar Nuevo Usuario"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {createError && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {createError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Nombre Completo *
            </label>
            <input
              type="text"
              required
              minLength={2}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Ej: Laura Gómez"
              className="w-full rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Correo Electrónico *
            </label>
            <input
              type="email"
              required
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              placeholder="vendedora@tobon.com"
              className="w-full rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
              Contraseña Inicial *
            </label>
            <div className="relative">
              <input
                type={showCreatePass ? "text" : "password"}
                required
                minLength={6}
                value={createPassword}
                onChange={(e) => setCreatePassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-lg bg-surface-container-low pl-3.5 pr-10 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="button"
                onClick={() => setShowCreatePass((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface"
              >
                <Icon
                  name={showCreatePass ? "visibility_off" : "visibility"}
                  size={18}
                />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Perfil / Rol de Acceso *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCreateRole("vendor")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  createRole === "vendor"
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-outline-variant/40 hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-on-surface">
                  <Icon
                    name="point_of_sale"
                    size={18}
                    className="text-primary"
                  />
                  Vendedor
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                  Acceso a POS, consulta de inventario y registro de clientes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setCreateRole("admin")}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  createRole === "admin"
                    ? "border-secondary bg-secondary-fixed/30 ring-2 ring-secondary/20"
                    : "border-outline-variant/40 hover:bg-surface-container-low"
                }`}
              >
                <div className="flex items-center gap-2 font-heading font-bold text-sm text-on-surface">
                  <Icon
                    name="shield_person"
                    size={18}
                    className="text-secondary"
                  />
                  Administrador
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                  Control total: inventario, precios, anulaciones, analíticas y
                  usuarios.
                </p>
              </button>
            </div>
          </div>

          <ModalFooter>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-heading font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isPending ? "Creando..." : "Crear Usuario"}
            </button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Modal: Editar Usuario */}
      <Modal
        open={!!editingUser}
        onClose={() => !isPending && setEditingUser(null)}
        title="Modificar Usuario"
        size="md"
      >
        {editingUser && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {editError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs font-medium text-rose-700">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg bg-surface-container-low px-3.5 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                Nueva Contraseña (Opcional)
              </label>
              <div className="relative">
                <input
                  type={showEditPass ? "text" : "password"}
                  minLength={6}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Dejar vacío para conservar la actual"
                  className="w-full rounded-lg bg-surface-container-low pl-3.5 pr-10 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface"
                >
                  <Icon
                    name={showEditPass ? "visibility_off" : "visibility"}
                    size={18}
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Perfil / Rol *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={editingUser.id === currentUserId}
                  onClick={() => setEditRole("vendor")}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    editingUser.id === currentUserId
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  } ${
                    editRole === "vendor"
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-outline-variant/40 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-2 font-heading font-bold text-sm text-on-surface">
                    <Icon
                      name="point_of_sale"
                      size={18}
                      className="text-primary"
                    />
                    Vendedor
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Operación de ventas y clientes.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setEditRole("admin")}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    editRole === "admin"
                      ? "border-secondary bg-secondary-fixed/30 ring-2 ring-secondary/20"
                      : "border-outline-variant/40 hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex items-center gap-2 font-heading font-bold text-sm text-on-surface">
                    <Icon
                      name="shield_person"
                      size={18}
                      className="text-secondary"
                    />
                    Administrador
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Acceso administrativo total.
                  </p>
                </button>
              </div>
            </div>

            {/* Estado Activo / Inactivo */}
            <div className="flex items-center justify-between rounded-xl bg-surface-container-low p-3.5">
              <div>
                <p className="text-sm font-heading font-bold text-on-surface">
                  Usuario Activo
                </p>
                <p className="text-xs text-on-surface-variant">
                  {editActive
                    ? "Puede iniciar sesión y operar en el sistema."
                    : "Acceso bloqueado temporalmente."}
                </p>
              </div>
              <input
                type="checkbox"
                disabled={editingUser.id === currentUserId}
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
                className="h-5 w-5 accent-primary rounded cursor-pointer disabled:opacity-50"
              />
            </div>

            <ModalFooter>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white text-sm font-heading font-bold hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isPending ? "Guardando..." : "Guardar Cambios"}
              </button>
            </ModalFooter>
          </form>
        )}
      </Modal>
    </div>
  );
}

