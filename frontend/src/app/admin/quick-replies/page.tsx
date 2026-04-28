"use client";

import { useState } from "react";
import { useQuickRepliesAdmin } from "@/hooks/useQuickReplies";
import type { QuickReply } from "@/types/quickReply";

const inputCls =
  "w-full h-10 px-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400";
const textareaCls =
  "w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm outline-none focus:bg-white focus:border-[#7C4DFF] focus:ring-2 focus:ring-[#7C4DFF]/15 transition-all placeholder:text-slate-400 resize-none";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

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

  return (
    <>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-[#E9ECEF] bg-white shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900">Quick Replies</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 h-9 px-4 bg-[#7C4DFF] hover:bg-[#632ce5] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Shortcut
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <span className="material-symbols-outlined text-3xl animate-spin mr-2">progress_activity</span>
            Loading…
          </div>
        ) : quickReplies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
            <span className="material-symbols-outlined text-5xl opacity-40">quick_phrases</span>
            <p className="text-sm">No quick replies yet. Create your first shortcut.</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {quickReplies.map(qr => (
              <div key={qr.id} className="bg-white rounded-xl border border-[#E9ECEF] px-5 py-4 flex items-start gap-4">
                {editingId === qr.id ? (
                  <form onSubmit={handleEdit} className="flex-1 flex flex-col gap-3">
                    <div className="flex gap-3">
                      <input
                        className={inputCls + " w-40"}
                        value={editShortcut}
                        onChange={e => setEditShortcut(e.target.value)}
                        placeholder="/shortcut"
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
                      <button type="submit" disabled={editLoading} className="h-8 px-4 bg-[#7C4DFF] text-white rounded-lg text-sm font-medium hover:bg-[#632ce5] disabled:opacity-50">
                        {editLoading ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="h-8 px-4 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="text-sm font-mono text-[#7C4DFF] bg-purple-50 px-2.5 py-1 rounded-lg shrink-0 mt-0.5">
                      {qr.shortcut}
                    </span>
                    <span className="flex-1 text-sm text-slate-700 leading-relaxed">{qr.content}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => { setEditingId(qr.id); setEditShortcut(qr.shortcut); setEditContent(qr.content); setEditError(""); }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(qr)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">New Quick Reply</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <FieldGroup label="Shortcut">
                <input
                  className={inputCls}
                  value={newShortcut}
                  onChange={e => setNewShortcut(e.target.value)}
                  placeholder="/hello"
                  autoFocus
                />
                <p className="text-xs text-slate-400 mt-1">Start with / — e.g. /hello, /thanks</p>
              </FieldGroup>
              <FieldGroup label="Reply Content">
                <textarea
                  className={textareaCls}
                  rows={3}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Hello! How can I help you today?"
                />
              </FieldGroup>
              {createError && <p className="text-sm text-red-600">{createError}</p>}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={createLoading || !newShortcut || !newContent}
                  className="flex-1 h-10 bg-[#7C4DFF] hover:bg-[#632ce5] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
                >
                  {createLoading ? "Creating…" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(""); }}
                  className="flex-1 h-10 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
            <span className="material-symbols-outlined text-4xl text-red-400 mb-3 block">delete</span>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Delete shortcut?</h2>
            <p className="text-sm text-slate-500 mb-6">
              <code className="text-[#7C4DFF]">{deleteConfirm.shortcut}</code> will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => { await remove(deleteConfirm.id); setDeleteConfirm(null); }}
                className="flex-1 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 border border-slate-200 rounded-xl text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
