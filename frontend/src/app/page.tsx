"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { useQuickReplySearch } from '@/hooks/useQuickReplies';
import type { SequencedEvent } from '@/types/api';
import type { Conversation, Message } from '@/types/chat';
import AudioMessage from '@/components/AudioMessage';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ChatPage() {
  // ── UI-only state ─────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }, []);

  // ── Domain hooks ──────────────────────────────────────────────────────────
  const {
    conversations,
    activeConversation,
    activeConversationRef,
    fetchConversations,
    selectConversation,
    updateConversation,
    notifCounts,
    activeViewers,
    onNewMessage,
    onConversationNotification,
    onPresenceUpdate,
    onConversationUpdated,
  } = useConversations();

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          c.contact.name?.toLowerCase().includes(q) ||
          c.contact.channel_identifier?.toLowerCase().includes(q)
        );
      })
    : conversations;

  const {
    messages,
    sendStatus,
    sending,
    fetchMessages,
    sendText,
    sendFile,
    sendAudio,
    retryMessage,
    appendMessage,
  } = useMessages(scrollToBottom);

  const {
    suggestions,
    generating: aiGenerating,
    fetchCached: fetchAICached,
    generate: generateAI,
    clear: clearAI,
  } = useAISuggestions();

  const { matches: qrMatches, open: qrOpen, search: qrSearch, close: qrClose } = useQuickReplySearch();

  // ── WebSocket event dispatcher ─────────────────────────────────────────────
  const handleWsEvent = useCallback((event: SequencedEvent) => {
    if (event.type === 'new_message') {
      const msg = event.data as unknown as Message;
      onNewMessage(msg, fetchConversations);
      if (activeConversationRef.current?.id === msg.conversation_id) {
        appendMessage(msg);
      }
    } else if (event.type === 'conversation_notification') {
      onConversationNotification(event.conversation_id);
    } else if (event.type === 'presence_update') {
      const { conversation_id, viewers } = event.data as { conversation_id: string; viewers: string[] };
      onPresenceUpdate(conversation_id, viewers);
    } else if (event.type === 'conversation_updated') {
      onConversationUpdated();
    }
  }, [onNewMessage, onConversationNotification, onPresenceUpdate, onConversationUpdated, fetchConversations, appendMessage, activeConversationRef]);

  const { subscribe, unsubscribe, connectionState } = useWebSocket(handleWsEvent);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // ── Conversation selection ────────────────────────────────────────────────
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    if (activeConversationRef.current) unsubscribe(activeConversationRef.current.id);
    cancelAttachment();
    clearAI();
    await selectConversation(conv);
    subscribe(conv.id);
    await fetchMessages(conv.id);
    fetchAICached(conv.id);
  }, [selectConversation, fetchMessages, subscribe, unsubscribe, activeConversationRef, fetchAICached, clearAI]);

  // ── Attachment helpers ────────────────────────────────────────────────────
  const cancelAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    setShowEmojiPicker(false);
  };

  const onEmojiClick = (emojiData: { emoji: string }) =>
    setInput(prev => prev + emojiData.emoji);

  // ── Recording ─────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;
      audioChunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        if (activeConversation) await sendAudio(activeConversation.id, blob);
        stream.getTracks().forEach(t => t.stop());
      };
      rec.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration(p => p + 1), 1000);
    } catch {
      alert('Microphone access denied or not available.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    if (!activeConversation || (!input.trim() && !selectedFile)) return;
    if (selectedFile) {
      await sendFile(activeConversation.id, selectedFile);
      cancelAttachment();
    } else {
      await sendText(activeConversation.id, input.trim());
      setInput('');
    }
  };

  const loading = sending;
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b border-[#E9ECEF] bg-white shrink-0 flex items-center px-6">
        <span className="text-[18px] font-semibold text-slate-900">Inbox</span>
      </header>

      {/* Connection state banner — P0-2 */}
      {connectionState !== 'connected' && (
        <div className={cn(
          "shrink-0 flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium",
          connectionState === 'reconnecting' ? "bg-yellow-50 text-yellow-700 border-b border-yellow-200" : "bg-red-50 text-red-700 border-b border-red-200"
        )}>
          <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
          {connectionState === 'connecting' ? 'Connecting to server…' : 'Connection lost — reconnecting…'}
        </div>
      )}

      {/* Main Workspace (3-Column Layout) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversation List (Fixed 320px) */}
        <aside className="w-[320px] h-full flex flex-col bg-surface-container-lowest border-r border-outline-variant shrink-0">
          <div className="p-md border-surface-variant">
            <div className="relative flex items-center w-full h-10 rounded-DEFAULT bg-[#F1F3F5] text-on-surface-variant focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-container transition-all">
              <span className="material-symbols-outlined ml-sm text-outline">search</span>
              <input
                className="w-full h-full bg-transparent border-none text-body-sm focus:ring-0 pl-sm pr-sm outline-none"
                placeholder="Search conversations..."
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-sm space-y-sm">
            {filteredConversations.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? 'No results found' : 'No conversations yet'}
              </div>
            )}
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "relative p-sm rounded-lg border cursor-pointer flex gap-sm items-start transition-colors",
                  activeConversation?.id === conv.id
                    ? "border-outline-variant bg-surface-container"
                    : "border-transparent hover:bg-surface-container-high"
                )}
              >
                {activeConversation?.id === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-container rounded-r-full"></div>
                )}
                <div className="relative shrink-0 ml-1">
                  {conv.contact.avatar ? (
                    <img alt={conv.contact.name} className="w-10 h-10 rounded-full object-cover" src={conv.contact.avatar} />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-fixed-dim text-on-primary-fixed-variant flex items-center justify-center font-h2 text-h2 uppercase">
                      {(conv.contact.name || 'U')[0]}
                    </div>
                  )}
                  {/* Channel icon badge */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-outline-variant">
                    <span className="material-symbols-outlined text-[10px] text-slate-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {conv.channel === 'TELEGRAM' ? 'send' : conv.channel === 'WHATSAPP' ? 'chat_bubble' : conv.channel === 'EMAIL' ? 'mail' : conv.channel === 'SMS' ? 'sms' : 'language'}
                    </span>
                  </div>
                  {conv.is_unread && (
                    <div className="absolute -top-0.5 -left-0.5 w-3 h-3 border-2 border-surface-container-lowest rounded-full bg-green-500"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={cn(
                      "font-body-md text-body-md truncate",
                      conv.is_unread ? "font-semibold text-on-surface" : "font-medium text-on-surface"
                    )}>
                      {conv.contact.name || conv.contact.channel_identifier}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Notification badge — P0-3 */}
                      {notifCounts[conv.id] > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#7C4DFF] text-white text-[10px] font-bold">
                          {notifCounts[conv.id] > 99 ? '99+' : notifCounts[conv.id]}
                        </span>
                      )}
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {conv.last_message_date ? new Date(conv.last_message_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                  <p className={cn(
                    "font-body-sm text-body-sm truncate",
                    conv.is_unread ? "font-medium text-on-surface" : "text-outline"
                  )}>
                    {conv.last_message || 'No messages'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Column: Active Chat Window */}
        <section className="flex-1 flex flex-col bg-surface-container-low relative min-w-0">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[72px] px-md py-sm border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between shrink-0">
                <div className="flex items-center gap-md">
                  <div className="relative">
                    {activeConversation.contact.avatar ? (
                      <img alt={activeConversation.contact.name} className="w-12 h-12 rounded-full object-cover" src={activeConversation.contact.avatar} />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary-fixed-dim text-on-primary-fixed-variant flex items-center justify-center font-h2 text-h2 uppercase">
                        {(activeConversation.contact.name || 'U')[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-h2 text-h2 text-on-surface">{activeConversation.contact.name || activeConversation.contact.channel_identifier}</h2>
                    <div className="flex items-center gap-xs text-on-surface-variant font-body-sm text-body-sm">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {activeConversation.channel === 'TELEGRAM' ? 'send' : activeConversation.channel === 'WHATSAPP' ? 'chat_bubble' : activeConversation.channel === 'EMAIL' ? 'mail' : activeConversation.channel === 'SMS' ? 'sms' : 'language'}
                      </span>
                      <span className="capitalize">{activeConversation.channel.toLowerCase()}</span>
                      {/* Presence indicator — P0-1 */}
                      {activeViewers.length > 0 && (
                        <span className="ml-2 flex items-center gap-1 text-amber-600 font-medium">
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          {activeViewers.length === 1
                            ? `${activeViewers[0]} está visualizando`
                            : `${activeViewers.slice(0, 2).join(', ')} estão visualizando`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Header actions: status selector + mark unread */}
                <div className="flex items-center gap-sm">
                  <select
                    value={activeConversation.status}
                    onChange={e => updateConversation(activeConversation.id, { status: e.target.value as import('@/types/chat').ConversationStatus })}
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-container",
                      activeConversation.status === 'OPEN' && "bg-green-50 text-green-700 border-green-200",
                      activeConversation.status === 'PENDING' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                      activeConversation.status === 'CLOSED' && "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    <option value="OPEN">Open</option>
                    <option value="PENDING">Pending</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <button
                    title="Mark as unread"
                    onClick={() => updateConversation(activeConversation.id, { is_unread: true })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">mark_email_unread</span>
                  </button>
                </div>
              </div>
              
              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-lg flex flex-col gap-lg">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex gap-md max-w-[80%]", !msg.inbound ? "self-end flex-row-reverse" : "")}>
                    <div className={cn("flex flex-col gap-xs", !msg.inbound ? "items-end" : "")}>
                      <div className={cn("flex items-baseline gap-sm", !msg.inbound ? "flex-row-reverse" : "")}>
                        <span className="font-body-sm text-body-sm font-medium text-on-surface">
                          {msg.inbound ? activeConversation.contact.name || 'User' : 'You'}
                        </span>
                        <span className="font-label-caps text-label-caps text-on-surface-variant font-normal">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <div className={cn(
                        "p-md rounded-xl text-body-md shadow-sm",
                        !msg.inbound
                          ? "bg-primary-fixed rounded-tr-sm text-on-primary-fixed"
                          : "bg-surface-container-lowest border border-outline-variant rounded-tl-sm text-on-surface",
                        sendStatus[msg.id] === 'failed' && "opacity-60 border-red-300"
                      )}>
                        <p>{msg.content}</p>
                        {msg.image && <img src={msg.image} alt="Attachment" className="mt-2 rounded-lg max-w-xs cursor-zoom-in" />}
                        {msg.message_type === 'audio' && msg.file && (
                          <AudioMessage src={msg.file} inbound={msg.inbound} />
                        )}
                        {msg.message_type === 'file' && msg.file && (
                          <a href={msg.file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-2.5 bg-black/5 rounded-lg hover:bg-black/10 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">description</span>
                            <span className="text-sm truncate max-w-[180px]">{msg.file.split('/').pop()}</span>
                            <span className="material-symbols-outlined text-[16px] ml-auto opacity-50">download</span>
                          </a>
                        )}
                        {/* Send failure indicator + retry — P0-2 */}
                        {sendStatus[msg.id] === 'failed' && (
                          <div className="mt-1.5 flex items-center gap-2 text-red-500 text-xs">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span>Falha no envio</span>
                            <button
                              onClick={() => retryMessage(msg.conversation_id, msg.id)}
                              className="underline hover:text-red-700 transition-colors"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        )}
                        {sendStatus[msg.id] === 'sending' && (
                          <div className="mt-1 flex justify-end">
                            <span className="material-symbols-outlined text-[12px] opacity-50 animate-spin">progress_activity</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-md bg-surface-container-lowest border-t border-outline-variant relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) qrClose(); }}>
                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="absolute bottom-full mb-2 left-md z-50 shadow-2xl rounded-2xl overflow-hidden border border-outline-variant">
                    <EmojiPicker 
                      onEmojiClick={onEmojiClick} 
                      theme={Theme.LIGHT} 
                      width={320} 
                      height={400}
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}

                {/* File Preview */}
                {selectedFile && (
                  <div className="mb-2 p-2 flex items-center gap-3 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF] animate-in fade-in slide-in-from-bottom-2">
                    {previewUrl ? (
                      <img src={previewUrl} className="w-12 h-12 rounded-lg object-cover border border-white shadow-sm" alt="Preview" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center text-slate-500">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={cancelAttachment} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-xs bg-[#F1F3F5] rounded-xl p-xs border border-transparent focus-within:bg-white focus-within:border-primary-container focus-within:shadow-sm transition-all min-h-[56px]">
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 text-[#7C4DFF]">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-semibold tabular-nums">Recording: {formatDuration(recordingDuration)}</span>
                      <button onClick={() => { setIsRecording(false); if(timerRef.current) clearInterval(timerRef.current); }} className="ml-auto text-xs font-medium hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-0.5 ml-0.5">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={cn("w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors", showEmojiPicker && "text-[#7C4DFF] bg-purple-50")}>
                          <span className="material-symbols-outlined text-[22px]">mood</span>
                        </button>
                        <button onClick={handleFileSelect} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">
                          <span className="material-symbols-outlined text-[22px]">attach_file</span>
                        </button>
                      </div>
                      {/* Quick Reply autocomplete dropdown */}
                      {qrOpen && (
                        <div className="absolute bottom-full left-0 right-0 mb-2 mx-3 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                          {qrMatches.map(qr => (
                            <button
                              key={qr.id}
                              className="w-full px-4 py-2.5 flex items-start gap-3 hover:bg-slate-50 text-left border-b border-slate-100 last:border-0 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setInput(qr.content);
                                qrClose();
                              }}
                            >
                              <span className="text-xs font-mono text-[#7C4DFF] bg-purple-50 px-2 py-0.5 rounded-md shrink-0 mt-0.5">{qr.shortcut}</span>
                              <span className="text-sm text-slate-700 truncate">{qr.content}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <textarea
                        className="flex-1 bg-transparent border-none text-body-md text-on-surface focus:ring-0 outline-none resize-none py-sm pl-sm min-h-[40px] max-h-[120px] overflow-y-auto"
                        placeholder="Type a message or / for quick replies…"
                        rows={1}
                        value={input}
                        onFocus={() => setShowEmojiPicker(false)}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInput(val);
                          qrSearch(val);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') { qrClose(); return; }
                          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); qrClose(); handleSendMessage(); }
                        }}
                      />
                    </>
                  )}

                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  
                  <div className="flex items-center gap-1.5 ml-xs">
                    {!input.trim() && !selectedFile && !isRecording ? (
                      <button onClick={startRecording} className="w-10 h-10 rounded-lg text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
                        <span className="material-symbols-outlined text-[22px]">mic</span>
                      </button>
                    ) : (
                      <button 
                        onClick={isRecording ? stopRecording : handleSendMessage} 
                        disabled={loading}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all",
                          isRecording ? "bg-red-500 text-white hover:bg-red-600" : "bg-[#7C4DFF] text-white hover:bg-[#632ce5]",
                          loading && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {isRecording ? 'stop' : 'send'}
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-50">forum</span>
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Context & Details */}
        <aside className="w-[300px] h-full flex flex-col bg-surface-container-lowest border-l border-outline-variant shrink-0 overflow-y-auto">
          {activeConversation ? (
            <div className="flex flex-col gap-0">
              {/* Contact Details */}
              <div className="p-5 border-b border-outline-variant">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Contact Details</h3>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Name</span>
                    <span className="text-slate-900 font-medium ml-2">{activeConversation.contact.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Identifier</span>
                    <span className="text-slate-900 font-medium truncate ml-2" title={activeConversation.contact.channel_identifier}>{activeConversation.contact.channel_identifier}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Channel</span>
                    <span className="text-slate-900 font-medium capitalize">{activeConversation.channel.toLowerCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Tag</span>
                    <span className="text-slate-900 font-medium capitalize">{activeConversation.tag?.toLowerCase() || '-'}</span>
                  </div>
                </div>
              </div>

              {/* AI Suggestions */}
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#7C4DFF]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                    AI Suggestions
                  </h3>
                  <button
                    onClick={() => generateAI(activeConversation.id)}
                    disabled={aiGenerating}
                    className="flex items-center gap-1 text-xs text-[#7C4DFF] hover:text-[#632ce5] disabled:opacity-50 transition-colors"
                  >
                    <span className={cn("material-symbols-outlined text-[14px]", aiGenerating && "animate-spin")}>
                      {aiGenerating ? "progress_activity" : "refresh"}
                    </span>
                    {aiGenerating ? "Generating…" : "Refresh"}
                  </button>
                </div>

                {suggestions.length === 0 && !aiGenerating && (
                  <button
                    onClick={() => generateAI(activeConversation.id)}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-[#7C4DFF] hover:text-[#7C4DFF] transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    Generate suggestions
                  </button>
                )}

                {aiGenerating && (
                  <div className="flex flex-col gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}

                {!aiGenerating && suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(s)}
                    className="w-full text-left px-3 py-2.5 rounded-xl bg-purple-50 border border-purple-100 text-sm text-slate-700 hover:bg-purple-100 hover:border-[#7C4DFF] transition-all leading-snug"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
             <div className="p-5 opacity-50">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contact Details</h3>
                <p className="text-sm text-slate-400">No contact selected.</p>
             </div>
          )}
        </aside>
      </main>
    </div>
  );
}
