"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { apiFetch } from "@/lib/api";
import Modal from "@/components/shared/Modal";

interface UserType {
  id: string;
  name: string;
  base_role: "ADMIN" | "MANAGER" | "USER";
  is_system: boolean;
  can_view_all_conversations: boolean;
  can_delete_conversations: boolean;
  can_edit_messages: boolean;
  can_delete_messages: boolean;
  can_manage_users: boolean;
  can_assign_roles: boolean;
  can_disable_users: boolean;
  can_change_user_password: boolean;
  can_change_settings: boolean;
  can_change_branding: boolean;
  can_change_ai_model: boolean;
  can_view_audit_logs: boolean;
  can_create_user_types: boolean;
  created_at: string;
}

type PermKey = keyof Omit<UserType, "id" | "name" | "base_role" | "is_system" | "created_at">;

const PERMISSION_GROUPS: { label: string; items: { key: PermKey; label: string }[] }[] = [
  {
    label: "Conversations",
    items: [
      { key: "can_view_all_conversations", label: "View all conversations" },
      { key: "can_delete_conversations", label: "Delete conversations" },
    ],
  },
  {
    label: "Messages",
    items: [
      { key: "can_edit_messages", label: "Edit messages" },
      { key: "can_delete_messages", label: "Delete messages" },
    ],
  },
  {
    label: "Users & Access",
    items: [
      { key: "can_manage_users", label: "Manage users (CRUD)" },
      { key: "can_assign_roles", label: "Assign roles" },
      { key: "can_disable_users", label: "Disable / enable users" },
      { key: "can_change_user_password", label: "Reset user passwords" },
    ],
  },
  {
    label: "System",
    items: [
      { key: "can_change_settings", label: "Change system settings" },
      { key: "can_change_branding", label: "Change branding" },
      { key: "can_change_ai_model", label: "Change AI model" },
      { key: "can_view_audit_logs", label: "View audit logs" },
      { key: "can_create_user_types", label: "Create user types" },
    ],
  },
];

const ALL_PERM_KEYS: PermKey[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

const EMPTY_PERMS: Record<PermKey, boolean> = Object.fromEntries(
  ALL_PERM_KEYS.map((k) => [k, false])
) as Record<PermKey, boolean>;

const BASE_ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border border-purple-200",
  MANAGER: "bg-blue-50 text-blue-700 border border-blue-200",
  USER: "bg-slate-50 text-slate-600 border border-slate-200",
};

type FormState = { name: string; base_role: "ADMIN" | "MANAGER" | "USER" } & Record<PermKey, boolean>;

function buildForm(t?: UserType): FormState {
  const perms = t
    ? (Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, !!(t as unknown as Record<string, unknown>)[k]])) as Record<PermKey, boolean>)
    : { ...EMPTY_PERMS };
  return { name: t?.name || "", base_role: t?.base_role || "USER", ...perms };
}

export default function UserTypesPage() {
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<UserType | null>(null);
  const [form, setForm] = useState<FormState>(buildForm());
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<UserType | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/admin/user-types");
      if (res.ok) setUserTypes(await res.json());
      else setError("Failed to load user types.");
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingType(null);
    setForm(buildForm());
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (t: UserType) => {
    setEditingType(t);
    setForm(buildForm(t));
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      const url = editingType ? `/admin/user-types/${editingType.id}` : "/admin/user-types";
      const method = editingType ? "PATCH" : "POST";
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.detail || "Operation failed."); return; }
      setShowModal(false);
      load();
    } catch (err: any) {
      setFormError("Connection error: " + (err.message || "Unknown error"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (t: UserType) => {
    const res = await apiFetch(`/admin/user-types/${t.id}`, { method: "DELETE" });
    if (res.ok) { setDeleteConfirm(null); load(); }
    else {
      const d = await res.json();
      alert(d.detail || "Cannot delete this user type.");
    }
  };

  const togglePerm = (key: PermKey) => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
  };

  const permCount = (t: UserType) =>
    ALL_PERM_KEYS.filter((k) => !!(t as unknown as Record<string, unknown>)[k]).length;

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900">User Types</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 h-9 px-4 bg-[#7C4DFF] hover:bg-[#632ce5] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Role
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin mr-2">progress_activity</span>
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {userTypes.map((t) => (
              <div key={t.id} className="bg-white rounded-xl border border-[#E9ECEF] p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 text-[15px]">{t.name}</h3>
                      {t.is_system && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">System</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BASE_ROLE_BADGE[t.base_role]}`}>
                      {t.base_role.charAt(0) + t.base_role.slice(1).toLowerCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#7C4DFF] hover:bg-purple-50 transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {!t.is_system && (
                      <button onClick={() => setDeleteConfirm(t)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Permission pills */}
                <div>
                  <p className="text-xs text-slate-500 mb-2">{permCount(t)} of {ALL_PERM_KEYS.length} permissions enabled</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#7C4DFF] transition-all"
                      style={{ width: `${(permCount(t) / ALL_PERM_KEYS.length) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ALL_PERM_KEYS.filter((k) => !!(t as unknown as Record<string, unknown>)[k]).slice(0, 4).map((k) => {
                    const item = PERMISSION_GROUPS.flatMap((g) => g.items).find((i) => i.key === k);
                    return (
                      <span key={k} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 text-purple-700">
                        {item?.label}
                      </span>
                    );
                  })}
                  {permCount(t) > 4 && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-500">
                      +{permCount(t) - 4} more
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 mt-auto pt-1">
                  Created {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            title={editingType ? `Edit: ${editingType.name}` : "New User Type"}
            onClose={() => setShowModal(false)}
            maxWidth="max-w-lg"
          >
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Senior Agent"
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Base Role</label>
              <select
                value={form.base_role}
                onChange={(e) => setForm((f) => ({ ...f, base_role: e.target.value as "ADMIN" | "MANAGER" | "USER" }))}
                className="w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all cursor-pointer"
              >
                <option value="USER">User</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-slate-700">Permissions</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, ...Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, true])) }))} className="text-xs text-[#7C4DFF] hover:underline">All</button>
                  <span className="text-slate-300">·</span>
                  <button type="button" onClick={() => setForm((f) => ({ ...f, ...Object.fromEntries(ALL_PERM_KEYS.map((k) => [k, false])) }))} className="text-xs text-slate-500 hover:underline">None</button>
                </div>
              </div>
              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{group.label}</p>
                    <div className="space-y-0.5">
                      {group.items.map(({ key, label }) => (
                        <label key={key} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 cursor-pointer group">
                          <div
                            onClick={(e) => { e.preventDefault(); togglePerm(key); }}
                            className={`w-9 h-5 rounded-full transition-colors shrink-0 relative ${form[key] ? "bg-[#7C4DFF]" : "bg-slate-200"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-[18px]" : "left-0.5"}`} />
                          </div>
                          <span className={`text-sm transition-colors ${form[key] ? "text-slate-900 font-medium" : "text-slate-500"}`}>{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {formError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <span className="material-symbols-outlined text-[15px] mt-0.5">error</span>
                {formError}
              </div>
            )}

            <div className="flex gap-2.5 pt-1 pb-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 h-10 rounded-lg border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={formLoading} className="flex-1 h-10 rounded-lg bg-[#7C4DFF] hover:bg-[#632ce5] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {formLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {editingType ? "Save Changes" : "Create Role"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteConfirm && (
          <Modal title="Confirm Delete" onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm">
            <div className="py-2">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-red-500 text-[24px]">delete</span>
              </div>
              <h3 className="text-center font-semibold text-slate-900 mb-2">Delete "{deleteConfirm.name}"?</h3>
              <p className="text-center text-sm text-slate-500 mb-6">This action cannot be undone. Users with this role will need to be reassigned.</p>
              <div className="flex gap-2.5">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 rounded-lg border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-10 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors">Delete</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </>
  );
}
