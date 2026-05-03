"use client";

import { useState } from "react";
import { useQuickRepliesAdmin } from "@/hooks/useQuickReplies";
import type { QuickReply } from "@/types/quickReply";
import Modal from "@/components/shared/Modal";

const inputCls =
  "w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400";
const textareaCls =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 resize-none";

export default function QuickRepliesPage() {
  const { quickReplies, loading, error, create, update, remove } = useQuickRepliesAdmin();

  const [showCreate, setShowCreate] = useState(false);
  const [newShortcut, setNewShortcut] = useState("/");
  const [newContent, setNewContent] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editShortcut, setEditShortcut] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<QuickReply | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateLoading(true);
    try {
      await create(newShortcut, newContent);
      setShowCreate(false);
      setNewShortcut("/");
      setNewContent("");
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setEditError("");
    setEditLoading(true);
    try {
      await update(editingId, { shortcut: editShortcut, content: editContent });
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await remove(deleteConfirm.id);
      setDeleteConfirm(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <div>
          <h1 className="text-[18px] font-semibold text-slate-900">Quick Replies</h1>
          <p className="text-xs text-slate-400 mt-0.5">Canned responses triggered by shortcuts</p>
        </div>
        <button
          onClick={() => { setNewShortcut("/"); setNewContent(""); setCreateError(""); setShowCreate(true); }}
          className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-200"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Shortcut
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <span className="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
            <span className="text-sm">Loading…</span>
          </div>
        ) : quickReplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <span className="material-symbols-outlined text-5xl opacity-30">quick_phrases</span>
            <p className="text-sm font-medium">No quick replies yet</p>
            <p className="text-xs text-slate-400">Create your first shortcut to speed up responses.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-2 flex items-center gap-1.5 h-9 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-sm font-semibold hover:bg-indigo-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Create first shortcut
            </button>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {quickReplies.map(qr => (
              <div key={qr.id} className="bg-white rounded-xl border border-[#E9ECEF] px-5 py-4 flex items-start gap-4 hover:border-slate-300 transition-colors">
                {editingId === qr.id ? (
                  <form onSubmit={handleEdit} className="flex-1 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <input
                        className={inputCls + " w-40"}
                        value={editShortcut}
                        onChange={e => setEditShortcut(e.target.value)}
                        placeholder="/shortcut"
                        autoFocus
                      />
                      <textarea
                        className={textareaCls + " flex-1"}
                        rows={2}
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Reply content…"
                      />
                    </div>
                    {editError && <p className="text-xs text-red-600">{editError}</p>}
                    <div className="flex gap-2">
                      <button type="submit" disabled={editLoading}
                        className="h-8 px-4 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        {editLoading ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}
                        className="h-8 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <code className="text-sm font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg shrink-0 mt-0.5 whitespace-nowrap">
                      {qr.shortcut}
                    </code>
                    <span className="flex-1 text-sm text-slate-700 leading-relaxed">{qr.content}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(qr.id); setEditShortcut(qr.shortcut); setEditContent(qr.content); setEditError(""); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(qr)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create modal — uses shared Modal (portal, never clipped) */}
      {showCreate && (
        <Modal title="New Quick Reply" onClose={() => { setShowCreate(false); setCreateError(""); }} maxWidth="max-w-lg">
          <form onSubmit={handleCreate} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Shortcut</label>
              <input
                className={inputCls}
                value={newShortcut}
                onChange={e => {
                  let v = e.target.value;
                  if (v && !v.startsWith("/")) v = "/" + v;
                  setNewShortcut(v);
                }}
                placeholder="/hello"
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1.5">Start with / — e.g. <code>/hello</code>, <code>/thanks</code></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Reply Content</label>
              <textarea
                className={textareaCls}
                rows={4}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Hello! How can I help you today?"
              />
            </div>

            {createError && (
              <p className="text-sm text-red-600 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {createError}
              </p>
            )}

            <div className="flex gap-3 pt-1 border-t border-slate-100">
              <button
                type="submit"
                disabled={createLoading || !newShortcut.trim() || !newContent.trim()}
                className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {createLoading ? "Creating…" : "Create Quick Reply"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateError(""); }}
                className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation — uses shared Modal (portal) */}
      {deleteConfirm && (
        <Modal title="Delete shortcut?" onClose={() => setDeleteConfirm(null)} maxWidth="max-w-sm">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
              <span className="material-symbols-outlined text-[28px] text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>delete</span>
            </div>
            <div>
              <p className="text-sm text-slate-600">
                The shortcut{" "}
                <code className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-mono text-[13px]">
                  {deleteConfirm.shortcut}
                </code>{" "}
                will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3 w-full pt-2 border-t border-slate-100">
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-11 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
