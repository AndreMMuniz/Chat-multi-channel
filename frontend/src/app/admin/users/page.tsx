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
}

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  user_type_id: string;
  user_type: UserType;
}

interface CreateForm {
  full_name: string;
  email: string;
  password: string;
  user_type_id: string;
}

interface EditForm {
  full_name: string;
  user_type_id: string;
  is_active: boolean;
}

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-50 text-purple-700 border border-purple-200",
  MANAGER: "bg-blue-50 text-blue-700 border border-blue-200",
  USER: "bg-slate-50 text-slate-600 border border-slate-200",
};

const inputCls = "w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400";
const selectCls = inputCls + " cursor-pointer";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

type Tab = "active" | "pending";

export default function UsersPage() {
  const [tab, setTab] = useState<Tab>("active");
  const [users, setUsers] = useState<User[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [userTypes, setUserTypes] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>({ full_name: "", email: "", password: "", user_type_id: "" });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ full_name: "", user_type_id: "", is_active: true });
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, pendingRes, typesRes] = await Promise.all([
        apiFetch("/admin/users"),
        apiFetch("/admin/users/pending"),
        apiFetch("/admin/user-types"),
      ]);
      if (usersRes.ok) setUsers(await usersRes.json());
      else setError("Failed to load users. Check your permissions.");
      if (pendingRes.ok) setPendingUsers(await pendingRes.json());
      if (typesRes.ok) setUserTypes(await typesRes.json());
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userTypes.length > 0 && !createForm.user_type_id) {
      setCreateForm((f) => ({ ...f, user_type_id: userTypes[0].id }));
    }
  }, [userTypes, createForm.user_type_id]);

  useEffect(() => { loadData(); }, [loadData]);

  const openCreate = () => {
    setCreateForm({ full_name: "", email: "", password: "", user_type_id: userTypes[0]?.id || "" });
    setCreateError("");
    setShowCreate(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      const res = await apiFetch("/admin/users", { method: "POST", body: JSON.stringify(createForm) });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        setCreateError(errorMsg || "Failed to create user.");
        return;
      }
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      setCreateError("Connection error: " + (err.message || "Unknown error"));
    } finally {
      setCreateLoading(false);
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setEditForm({ full_name: u.full_name, user_type_id: u.user_type_id, is_active: u.is_active });
    setEditError("");
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${editingUser.id}`, { method: "PATCH", body: JSON.stringify(editForm) });
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        setEditError(errorMsg || "Failed to update user.");
        return;
      }
      setEditingUser(null);
      loadData();
    } catch (err: any) {
      setEditError("Connection error: " + (err.message || "Unknown error"));
    } finally {
      setEditLoading(false);
    }
  };

  const toggleStatus = async (u: User) => {
    const endpoint = u.is_active ? `/admin/users/${u.id}/disable` : `/admin/users/${u.id}/enable`;
    const res = await apiFetch(endpoint, { method: "POST" });
    if (res.ok) loadData();
  };

  const handleApprove = async (userId: string) => {
    setApprovalLoading(userId);
    try {
      const res = await apiFetch(`/admin/users/${userId}/approve`, { method: "POST" });
      if (res.ok) loadData();
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Reject and permanently delete this user request?")) return;
    setApprovalLoading(userId);
    try {
      const res = await apiFetch(`/admin/users/${userId}/reject`, { method: "POST" });
      if (res.ok) loadData();
    } finally {
      setApprovalLoading(null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    setDeleteLoading(userId);
    try {
      const res = await apiFetch(`/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        loadData();
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <div className="flex items-center gap-6">
          <h1 className="text-[18px] font-semibold text-slate-900">Users</h1>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setTab("active")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "active" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Active
            </button>
            <button
              onClick={() => setTab("pending")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "pending" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            >
              Pending approval
              {pendingUsers.length > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#7C4DFF] text-white text-[10px] font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>
          </div>
        </div>
        {tab === "active" && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 h-9 px-4 bg-[#7C4DFF] hover:bg-[#632ce5] text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            New User
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="flex items-center gap-2 p-4 mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* ── Active users tab ── */}
        {tab === "active" && (
          <>
            <div className="relative mb-4 max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-[#E9ECEF] text-sm text-slate-900 outline-none focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all"
              />
            </div>

            <div className="bg-white rounded-xl border border-[#E9ECEF] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E9ECEF] bg-slate-50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">User</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Role</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Status</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3.5">Created</th>
                    <th className="px-4 py-3.5 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                        <span className="material-symbols-outlined text-3xl animate-spin block mb-2">progress_activity</span>
                        Loading users...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                        {search ? "No users match your search." : "No users yet. Create the first one."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="border-b border-[#F1F3F5] last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.full_name} className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-purple-100 text-[#632ce5] flex items-center justify-center text-xs font-bold shrink-0">
                                {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-900">{u.full_name}</p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[u.user_type?.base_role] || ROLE_BADGE.USER}`}>
                            {u.user_type?.name || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-green-50 text-green-700 border border-green-200" : "bg-slate-50 text-slate-500 border border-slate-200"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-green-500" : "bg-slate-400"}`} />
                            {u.is_active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-slate-500">
                          {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </td>
                           <td className="px-4 py-3.5">
                           <div className="flex items-center gap-1 justify-end">
                             <button onClick={() => openEdit(u)} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#7C4DFF] hover:bg-purple-50 transition-colors">
                               <span className="material-symbols-outlined text-[18px]">edit</span>
                             </button>
                             <button
                               onClick={() => toggleStatus(u)}
                               title={u.is_active ? "Disable" : "Enable"}
                               className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${u.is_active ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}`}
                             >
                               <span className="material-symbols-outlined text-[18px]">{u.is_active ? "block" : "check_circle"}</span>
                             </button>
                             <button
                               onClick={() => {
                                 if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
                                   deleteUser(u.id);
                                 }
                               }}
                               title="Delete"
                               className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-slate-400 hover:text-red-500 hover:bg-red-50"
                               disabled={deleteLoading === u.id}
                             >
                               {deleteLoading === u.id ? (
                                 <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                               ) : (
                                 <span className="material-symbols-outlined text-[18px]">delete</span>
                               )}
                             </button>
                           </div>
                         </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-400 mt-3">{filtered.length} {filtered.length === 1 ? "user" : "users"}</p>
          </>
        )}

        {/* ── Pending approval tab ── */}
        {tab === "pending" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-slate-400">
                <span className="material-symbols-outlined text-3xl animate-spin block mr-3">progress_activity</span>
                Loading...
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-green-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
                <p className="text-sm font-medium text-slate-700 mb-1">No pending requests</p>
                <p className="text-xs text-slate-400">All signup requests have been reviewed.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingUsers.map((u) => (
                  <div key={u.id} className="bg-white rounded-xl border border-[#E9ECEF] p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {u.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{u.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Requested {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleReject(u.id)}
                        disabled={approvalLoading === u.id}
                        className="h-9 px-4 rounded-lg border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(u.id)}
                        disabled={approvalLoading === u.id}
                        className="h-9 px-4 rounded-lg bg-[#7C4DFF] hover:bg-[#632ce5] text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
                      >
                        {approvalLoading === u.id ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px]">check</span>
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="New User" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <FieldGroup label="Full Name">
              <input type="text" required value={createForm.full_name} onChange={(e) => setCreateForm((f) => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Email">
              <input type="email" required value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Password">
              <input type="password" required minLength={8} value={createForm.password} onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 chars with uppercase, number & symbol" className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Role">
              <select value={createForm.user_type_id} onChange={(e) => setCreateForm((f) => ({ ...f, user_type_id: e.target.value }))} required className={selectCls}>
                <option value="">Select a role...</option>
                {userTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </FieldGroup>
            {createError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <span className="material-symbols-outlined text-[15px] mt-0.5">error</span>
                {createError}
              </div>
            )}
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => setShowCreate(false)} className="flex-1 h-10 rounded-lg border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={createLoading} className="flex-1 h-10 rounded-lg bg-[#7C4DFF] hover:bg-[#632ce5] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {createLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Create User
              </button>
            </div>
          </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingUser && (
          <Modal title="Edit User" onClose={() => setEditingUser(null)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <FieldGroup label="Full Name">
              <input type="text" required value={editForm.full_name} onChange={(e) => setEditForm((f) => ({ ...f, full_name: e.target.value }))} className={inputCls} />
            </FieldGroup>
            <FieldGroup label="Role">
              <select required value={editForm.user_type_id} onChange={(e) => setEditForm((f) => ({ ...f, user_type_id: e.target.value }))} className={selectCls}>
                {userTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
              </select>
            </FieldGroup>
            <div className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-[#E9ECEF]">
              <div>
                <p className="text-sm font-medium text-slate-900">Active account</p>
                <p className="text-xs text-slate-500">Disabled users cannot sign in</p>
              </div>
              <button
                type="button"
                onClick={() => setEditForm((f) => ({ ...f, is_active: !f.is_active }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${editForm.is_active ? "bg-[#7C4DFF]" : "bg-slate-300"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${editForm.is_active ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {editError && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                <span className="material-symbols-outlined text-[15px] mt-0.5">error</span>
                {editError}
              </div>
            )}
            <div className="flex gap-2.5 pt-1">
              <button type="button" onClick={() => setEditingUser(null)} className="flex-1 h-10 rounded-lg border border-[#E9ECEF] text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
              <button type="submit" disabled={editLoading} className="flex-1 h-10 rounded-lg bg-[#7C4DFF] hover:bg-[#632ce5] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                {editLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
      </AnimatePresence>
    </>
  );
}
