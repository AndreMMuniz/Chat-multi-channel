"use client";

import Image from 'next/image';
import { useState, useRef, useCallback, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronLeft } from 'lucide-react';
import type { IconType } from 'react-icons';
import { FaWhatsapp, FaCommentDots } from 'react-icons/fa';
import { FaTelegram, FaGlobe } from 'react-icons/fa6';
import { MdOutlineEmail } from 'react-icons/md';
import { TbSparkles } from 'react-icons/tb';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useConversations } from '@/hooks/useConversations';
import { useMessages } from '@/hooks/useMessages';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { useQuickReplySearch } from '@/hooks/useQuickReplies';
import { conversationsApi, usersApi, quickRepliesApi } from '@/lib/api/index';
import type { SequencedEvent } from '@/types/api';
import type { ChannelType, Conversation, ConversationTag, Message } from '@/types/chat';
import AudioMessage from '@/components/AudioMessage';
import { useState as useLocalState, useEffect as useLocalEffect } from 'react';

// ── Assignment Panel (Story 3.5) ──────────────────────────────────────────────

function AssignmentPanel({ conversation, onAssign }: {
  conversation: Conversation;
  onAssign: (userId: string | null) => Promise<void>;
}) {
  const [agents, setAgents] = useLocalState<{ id: string; full_name: string }[]>([]);
  const [saving, setSaving] = useLocalState(false);

  useLocalEffect(() => {
    usersApi.listUsers(100).then(r => setAgents(r.data ?? [])).catch(() => {});
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSaving(true);
    await onAssign(e.target.value || null).catch(() => {});
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={conversation.assigned_user_id ?? ''}
        onChange={handleChange}
        disabled={saving}
        className="flex-1 h-9 px-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:border-indigo-500 outline-none cursor-pointer text-slate-700 disabled:opacity-50"
      >
        <option value="">— Unassigned —</option>
        {agents.map(a => (
          <option key={a.id} value={a.id}>{a.full_name}</option>
        ))}
      </select>
      {saving && <span className="material-symbols-outlined text-[16px] text-slate-400 animate-spin">progress_activity</span>}
    </div>
  );
}


function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const SLA_THRESHOLD_MINUTES = 60;
const TAG_OPTIONS: ConversationTag[] = ['SUPPORT', 'BILLING', 'FEEDBACK', 'SALES', 'GENERAL', 'SPAM'];

const CHANNEL_META: Record<ChannelType, {
  label: string;
  badgeClass: string;
  iconClass: string;
  icon: IconType;
}> = {
  TELEGRAM: {
    label: 'Telegram',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-100',
    iconClass: 'text-[#0088CC]',
    icon: FaTelegram,
  },
  WHATSAPP: {
    label: 'WhatsApp',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    iconClass: 'text-[#25D366]',
    icon: FaWhatsapp,
  },
  EMAIL: {
    label: 'Email',
    badgeClass: 'bg-red-50 text-red-700 border-red-100',
    iconClass: 'text-[#EA4335]',
    icon: MdOutlineEmail,
  },
  SMS: {
    label: 'SMS',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
    iconClass: 'text-[#F59E0B]',
    icon: FaCommentDots,
  },
  WEB: {
    label: 'Web Chat',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    iconClass: 'text-slate-500',
    icon: FaGlobe,
  },
};

const TAG_META: Record<ConversationTag, { label: string; className: string }> = {
  SUPPORT: { label: 'Support', className: 'bg-blue-50 text-blue-700 border-blue-100' },
  BILLING: { label: 'Billing', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  FEEDBACK: { label: 'Feedback', className: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100' },
  SALES: { label: 'Sales', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  GENERAL: { label: 'General', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  SPAM: { label: 'Spam', className: 'bg-rose-50 text-rose-700 border-rose-100' },
};

function waitingTime(lastMessageDate: string | undefined, isUnread: boolean): { label: string; color: string; slaBreached: boolean } | null {
  if (!isUnread || !lastMessageDate) return null;
  const diffMs = Date.now() - new Date(lastMessageDate).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 15) return null;
  const slaBreached = diffMin >= SLA_THRESHOLD_MINUTES;
  if (diffMin < 60) return { label: `${diffMin}m ago`, color: 'text-yellow-600', slaBreached };
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return { label: `${diffH}h ago`, color: diffH >= 2 ? 'text-red-500' : 'text-orange-500', slaBreached };
  return { label: `${Math.floor(diffH / 24)}d ago`, color: 'text-red-600', slaBreached: true };
}

function TagBadge({ tag, className }: { tag?: ConversationTag | null; className?: string }) {
  if (!tag) return null;
  const meta = TAG_META[tag];
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold', meta.className, className)}>
      {meta.label}
    </span>
  );
}

function getChannelMeta(channel: string) {
  return CHANNEL_META[channel.toUpperCase() as ChannelType] ?? CHANNEL_META['WEB'];
}

function ChannelBadge({ channel, compact = false }: { channel: ChannelType; compact?: boolean }) {
  const meta = getChannelMeta(channel);
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center border font-medium',
        compact ? 'gap-1 rounded-full px-2 py-1 text-[11px]' : 'gap-1.5 rounded-full px-2.5 py-1 text-xs',
        meta.badgeClass
      )}
    >
      <Icon className={cn(compact ? 'text-[11px]' : 'text-[12px]', meta.iconClass)} />
      <span>{meta.label}</span>
    </span>
  );
}

function TagSelect({
  value,
  onChange,
}: {
  value?: ConversationTag | null;
  onChange: (value: ConversationTag | null) => void;
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange((e.target.value || null) as ConversationTag | null)}
      className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition-all focus:border-indigo-500 focus:bg-white"
    >
      <option value="">No tag</option>
      {TAG_OPTIONS.map((tag) => (
        <option key={tag} value={tag}>
          {TAG_META[tag].label}
        </option>
      ))}
    </select>
  );
}

export default function ChatPage() {
  // ── UI-only state ─────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'ALL' | ChannelType>('ALL');
  const [selectedTag, setSelectedTag] = useState<'ALL' | ConversationTag>('ALL');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [slaAlert, setSlaAlert] = useState<{ count: number; threshold: number } | null>(null);
  const [deliveryAlert, setDeliveryAlert] = useState<{ channel: string; count: number } | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [aiSheetOpen, setAiSheetOpen] = useState(false);
  const [showAIDesktop, setShowAIDesktop] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState<'contact' | 'details' | 'history'>('contact');
  const [allQuickReplies, setAllQuickReplies] = useState<import('@/types/quickReply').QuickReply[]>([]);

  useEffect(() => {
    quickRepliesApi.listQuickReplies().then(r => setAllQuickReplies(r.data ?? [])).catch(() => {});
  }, []);

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

  // Story 3.3 — sort by SLA risk: breached first, then by wait time desc
  const sortedConversations = [...conversations].sort((a, b) => {
    const wtA = waitingTime(a.last_message_date, a.is_unread);
    const wtB = waitingTime(b.last_message_date, b.is_unread);
    if (wtA?.slaBreached && !wtB?.slaBreached) return -1;
    if (!wtA?.slaBreached && wtB?.slaBreached) return 1;
    const tA = a.last_message_date ? new Date(a.last_message_date).getTime() : 0;
    const tB = b.last_message_date ? new Date(b.last_message_date).getTime() : 0;
    return tA - tB; // oldest unread first within same risk tier
  });

  const availableChannels = Object.keys(CHANNEL_META) as ChannelType[];
  const tagCounts = TAG_OPTIONS.reduce<Record<ConversationTag, number>>((acc, tag) => {
    acc[tag] = conversations.filter((c) => c.tag === tag).length;
    return acc;
  }, {} as Record<ConversationTag, number>);
  const hasActiveFilters = Boolean(searchQuery.trim()) || selectedChannel !== 'ALL' || selectedTag !== 'ALL';
  const selectedTagLabel = selectedTag === 'ALL' ? null : TAG_META[selectedTag].label;
  const emptyStateMessage = !hasActiveFilters
    ? 'No conversations yet'
    : selectedTag !== 'ALL'
      ? `No conversations match the ${selectedTagLabel} tag with the current filters`
      : selectedChannel !== 'ALL'
        ? `No conversations match the ${getChannelMeta(selectedChannel).label} channel with the current filters`
        : 'No conversations match the current filters';

  const filteredConversations = sortedConversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      c.contact.name?.toLowerCase().includes(q) ||
      c.contact.channel_identifier?.toLowerCase().includes(q)
    );
    const matchesChannel = selectedChannel === 'ALL' || c.channel.toUpperCase() === selectedChannel;
    const matchesTag = selectedTag === 'ALL' || c.tag === selectedTag;

    return matchesSearch && matchesChannel && matchesTag;
  });

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
    source: aiSource,
    generatedAt: aiGeneratedAt,
    generating: aiGenerating,
    loading: aiLoading,
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
    } else if (event.type === 'sla_risk_alert') {
      const d = event.data as { count: number; threshold_minutes: number };
      setSlaAlert({ count: d.count, threshold: d.threshold_minutes });
    } else if (event.type === 'delivery_failure_alert') {
      const d = event.data as { channel: string; failure_count: number };
      setDeliveryAlert({ channel: d.channel, count: d.failure_count });
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
    setMobileView('chat');
  }, [selectConversation, fetchMessages, subscribe, unsubscribe, activeConversationRef, fetchAICached, clearAI]);

  const handleMobileBack = useCallback(() => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    setShowEmojiPicker(false);
    setMobileView('list');
  }, [isRecording]);

  // ── Attachment helpers ────────────────────────────────────────────────────
  function cancelAttachment() {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

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
  const effectiveMobileView = activeConversation ? mobileView : 'list';
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b border-[#E9ECEF] bg-white shrink-0 flex items-center px-6">
        <span className="text-[18px] font-semibold text-slate-900">Messages</span>
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

      {/* SLA Risk Alert banner — Story 4.5 */}
      {slaAlert && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 text-xs font-medium bg-amber-50 text-amber-800 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">schedule</span>
            <span><strong>{slaAlert.count}</strong> conversation{slaAlert.count !== 1 ? 's' : ''} unanswered for more than {slaAlert.threshold} min</span>
          </div>
          <button onClick={() => setSlaAlert(null)} className="ml-2 text-amber-600 hover:text-amber-900">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Delivery Failure Alert banner — Story 4.4 */}
      {deliveryAlert && (
        <div className="shrink-0 flex items-center justify-between gap-2 px-4 py-2 text-xs font-medium bg-red-50 text-red-800 border-b border-red-200">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">error</span>
            <span><strong>{deliveryAlert.count}</strong> delivery failures on <strong className="uppercase">{deliveryAlert.channel}</strong> in the last few minutes</span>
          </div>
          <button onClick={() => setDeliveryAlert(null)} className="ml-2 text-red-600 hover:text-red-900">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Workspace (3-Column Layout) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Conversation List */}
        <aside
          data-testid="conversation-list"
          className={cn(
            "h-full flex flex-col bg-surface-container-lowest border-r border-outline-variant",
            // Desktop: fixed 320px in flex flow
            "md:static md:w-[320px] md:shrink-0 md:translate-x-0",
            // Mobile: absolute overlay, full width, slide transition
            "absolute inset-y-0 left-0 right-0 w-full z-10",
            "transition-transform duration-300 ease-in-out",
            effectiveMobileView === 'chat' ? "-translate-x-full md:translate-x-0" : "translate-x-0"
          )}
        >
          <div className="p-md border-surface-variant">
            <div className="relative flex items-center w-full h-10 rounded-DEFAULT bg-[#F1F3F5] text-on-surface-variant focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <span className="material-symbols-outlined ml-sm text-outline">search</span>
              <input
                className="w-full h-full bg-transparent border-none text-body-sm focus:ring-0 pl-sm pr-sm outline-none"
                placeholder="Search conversations..."
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedChannel('ALL')}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    selectedChannel === 'ALL'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  )}
                >
                  All Channels
                </button>
                {availableChannels.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => setSelectedChannel(channel)}
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-1 transition-colors',
                      selectedChannel === channel
                        ? 'border-indigo-200 bg-indigo-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    )}
                  >
                    <ChannelBadge channel={channel} compact />
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedTag('ALL')}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                    selectedTag === 'ALL'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  )}
                >
                  All Tags
                </button>
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(tag)}
                    className={cn(
                      'shrink-0 rounded-full transition-all',
                      selectedTag === tag ? 'ring-2 ring-indigo-100 ring-offset-1' : '',
                      tagCounts[tag] === 0 && selectedTag !== tag ? 'opacity-45 hover:opacity-70' : ''
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <TagBadge tag={tag} className="px-2.5 py-1" />
                      <span className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                        tagCounts[tag] > 0 ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'
                      )}>
                        {tagCounts[tag]}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              {selectedTag !== 'ALL' && (
                <p className="text-[11px] text-slate-400">
                  One tag per conversation in this release. Filtering and labeling are built for operational organization, not multi-tag CRM yet.
                </p>
              )}
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-sm space-y-sm">
            {filteredConversations.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-500">
                <p>{emptyStateMessage}</p>
                {hasActiveFilters && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedChannel('ALL');
                      setSelectedTag('ALL');
                    }}
                    className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                data-testid="conversation-item"
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "relative p-sm rounded-lg border cursor-pointer flex gap-sm items-start transition-colors",
                  activeConversation?.id === conv.id
                    ? "border-outline-variant bg-surface-container"
                    : "border-transparent hover:bg-surface-container-high"
                )}
              >
                {activeConversation?.id === conv.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-500 rounded-r-full"></div>
                )}
                <div className="relative shrink-0 ml-1">
                  {conv.contact.avatar ? (
                    <Image
                      alt={conv.contact.name || 'Contact avatar'}
                      className="w-10 h-10 rounded-full object-cover"
                      src={conv.contact.avatar}
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-h2 text-h2 uppercase">
                      {(conv.contact.name || 'U')[0]}
                    </div>
                  )}
                  {/* Channel icon badge */}
                  <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm border border-outline-variant">
                    {(() => {
                      const chMeta = getChannelMeta(conv.channel);
                      const Icon = chMeta.icon;
                      return <Icon className={cn('text-[11px]', chMeta.iconClass)} />;
                    })()}
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
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                          {notifCounts[conv.id] > 99 ? '99+' : notifCounts[conv.id]}
                        </span>
                      )}
                      <span className="font-body-sm text-body-sm text-on-surface-variant">
                        {conv.last_message_date ? new Date(conv.last_message_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <ChannelBadge channel={conv.channel} compact />
                    <TagBadge tag={conv.tag ?? undefined} />
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className={cn(
                      "font-body-sm text-body-sm truncate flex-1",
                      conv.is_unread ? "font-medium text-on-surface" : "text-outline"
                    )}>
                      {conv.last_message || 'No messages'}
                    </p>
                    {/* SLA risk indicator — Stories 3.2/3.3 */}
                    {(() => {
                      const wt = waitingTime(conv.last_message_date, conv.is_unread);
                      if (!wt) return null;
                      return (
                        <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-semibold shrink-0", wt.color)}>
                          {wt.slaBreached && <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>}
                          {wt.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Column: Active Chat Window */}
        <section
          data-testid="chat-area"
          className={cn(
            "flex flex-col bg-surface-container-low min-w-0",
            // Desktop: flex-1 in flow
            "md:static md:flex-1 md:translate-x-0",
            // Mobile: absolute overlay, full width, slide transition
            "absolute inset-y-0 left-0 right-0 w-full",
            "transition-transform duration-300 ease-in-out",
            effectiveMobileView === 'list' ? "translate-x-full md:translate-x-0" : "translate-x-0"
          )}
        >
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[72px] px-md py-sm border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between shrink-0">
                <div className="flex items-center gap-md">
                  {/* Back button — mobile only */}
                  <button
                    data-testid="back-button"
                    onClick={handleMobileBack}
                    className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
                    aria-label="Back to conversations"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <div className="relative">
                    {activeConversation.contact.avatar ? (
                      <Image
                        alt={activeConversation.contact.name || 'Contact avatar'}
                        className="w-12 h-12 rounded-full object-cover"
                        src={activeConversation.contact.avatar}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-h2 text-h2 uppercase">
                        {(activeConversation.contact.name || 'U')[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-h2 text-h2 text-on-surface">{activeConversation.contact.name || activeConversation.contact.channel_identifier}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                      <ChannelBadge channel={activeConversation.channel} />
                      <TagBadge tag={activeConversation.tag} />
                      {/* Presence indicator — P0-1 */}
                      {activeViewers.length > 0 && (
                        <span className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                          <span className="text-[10px] font-semibold text-orange-700">
                            {activeViewers.length === 1
                              ? `${activeViewers[0]} is viewing`
                              : `${activeViewers.length} viewing`}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Header actions */}
                <div className="flex items-center gap-sm">
                  <select
                    value={activeConversation.status}
                    onChange={e => updateConversation(activeConversation.id, { status: e.target.value as import('@/types/chat').ConversationStatus })}
                    className={cn(
                      "text-xs font-semibold px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-100",
                      activeConversation.status === 'OPEN' && "bg-orange-50 text-orange-700 border-orange-200",
                      activeConversation.status === 'PENDING' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                      activeConversation.status === 'CLOSED' && "bg-slate-100 text-slate-500 border-slate-200"
                    )}
                  >
                    <option value="OPEN">Open</option>
                    <option value="PENDING">Pending</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  {/* AI toggle — desktop */}
                  <button
                    title="AI Suggestions"
                    onClick={() => setShowAIDesktop(v => !v)}
                    className={cn(
                      "hidden md:flex w-8 h-8 items-center justify-center rounded-lg transition-colors",
                      showAIDesktop
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    )}
                  >
                    <TbSparkles size={17} />
                  </button>
                  <button
                    title="Mark as unread"
                    onClick={() => updateConversation(activeConversation.id, { is_unread: true })}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">mark_email_unread</span>
                  </button>
                  <button
                    title="Delete conversation"
                    onClick={async () => {
                      if (!window.confirm('Delete this conversation and all its messages? This cannot be undone.')) return;
                      try {
                        await conversationsApi.deleteConversation(activeConversation.id);
                        handleMobileBack();
                        await fetchConversations();
                      } catch {
                        alert('Failed to delete conversation. Check your permissions.');
                      }
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
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
                          ? "bg-indigo-600 rounded-tr-sm text-white"
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
                        {/* Send failure indicator + retry — Stories 4.2 + 4.3 */}
                        {(sendStatus[msg.id] === 'failed' || msg.delivery_status === 'failed') && (
                          <div className="mt-1.5 flex items-center gap-2 text-red-500 text-xs">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            <span title={msg.delivery_error || 'Unknown error'}>
                              Send failed
                              {msg.delivery_error && <span className="ml-1 opacity-60 font-mono">({msg.delivery_error.split(':').pop()})</span>}
                            </span>
                            {(msg.retry_count ?? 0) < 3 && (
                              <button
                                onClick={() => retryMessage(msg.conversation_id, msg.id)}
                                className="underline hover:text-red-700 transition-colors"
                              >
                                Retry {msg.retry_count ? `(${msg.retry_count}/3)` : ''}
                              </button>
                            )}
                            {(msg.retry_count ?? 0) >= 3 && (
                              <span className="opacity-60">Retry limit reached</span>
                            )}
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

              {/* Quick Reply chip strip — desktop */}
              {allQuickReplies.length > 0 && (
                <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white border-t border-outline-variant overflow-x-auto [&::-webkit-scrollbar]:hidden">
                  {allQuickReplies.slice(0, 4).map(qr => (
                    <button
                      key={qr.id}
                      onClick={() => setInput(qr.content)}
                      className="shrink-0 flex items-center gap-1.5 h-7 px-3 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                    >
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 rounded px-1 py-0.5 text-[9px] font-bold">{qr.shortcut}</span>
                      {qr.shortcut.replace('/', '').charAt(0).toUpperCase() + qr.shortcut.replace('/', '').slice(1)}
                    </button>
                  ))}
                  {allQuickReplies.length > 4 && (
                    <button className="shrink-0 flex items-center gap-1 h-7 px-3 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-[14px]">more_horiz</span>
                      More
                    </button>
                  )}
                </div>
              )}

              {/* Input Area */}
              <div
                className="p-md bg-surface-container-lowest border-t border-outline-variant relative"
                style={{ paddingBottom: 'max(var(--spacing-md, 12px), env(safe-area-inset-bottom))' }}
                onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) qrClose(); }}
              >
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

                <div className="flex items-center gap-xs bg-[#F1F3F5] rounded-xl p-xs border border-transparent focus-within:bg-white focus-within:border-indigo-200 focus-within:shadow-sm transition-all min-h-[56px]">
                  {isRecording ? (
                    <div className="flex-1 flex items-center gap-3 px-3 py-2 text-indigo-600">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-sm font-semibold tabular-nums">Recording: {formatDuration(recordingDuration)}</span>
                      <button onClick={() => { setIsRecording(false); if(timerRef.current) clearInterval(timerRef.current); }} className="ml-auto text-xs font-medium hover:underline">Cancel</button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-0.5 ml-0.5">
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={cn("w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 transition-colors", showEmojiPicker && "text-indigo-600 bg-indigo-50")}>
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
                              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0 mt-0.5">{qr.shortcut}</span>
                              <span className="text-sm text-slate-700 truncate">{qr.content}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      <textarea
                        data-testid="message-input"
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
                    {/* Sparkles button — mobile only, triggers AI suggestions Sheet */}
                    <button
                      data-testid="ai-sparkles-button"
                      type="button"
                      onClick={() => {
                        if (activeConversation && suggestions.length === 0 && !aiGenerating && !aiLoading) {
                          generateAI(activeConversation.id);
                        }
                        setAiSheetOpen(true);
                      }}
                      disabled={aiGenerating || aiLoading}
                      className={cn(
                        "md:hidden w-9 h-9 flex items-center justify-center rounded-lg transition-all",
                        aiGenerating || aiLoading
                          ? "text-indigo-600 opacity-100"
                          : "text-indigo-600 opacity-40 hover:opacity-100"
                      )}
                      aria-label="Get AI suggestion"
                    >
                      {aiGenerating || aiLoading
                        ? <span className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        : <TbSparkles size={18} />
                      }
                    </button>
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
                          isRecording ? "bg-red-500 text-white hover:bg-red-600" : "bg-indigo-600 text-white hover:bg-indigo-700",
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

              {/* AI Panel — desktop, below composer */}
              {showAIDesktop && (
                <div className="hidden md:block border-t border-outline-variant bg-white">
                  <div className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#7C3AED] to-indigo-600 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[11px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                      </div>
                      <span className="text-[11px] font-bold text-[#7C3AED] uppercase tracking-wider">AI Suggestions</span>
                      {(aiGenerating || aiLoading) && (
                        <span className="w-3 h-3 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
                      )}
                      {aiSource && aiGeneratedAt && (
                        <span className="text-[10px] text-slate-400">
                          {aiSource === 'generated' ? 'Generated' : 'Cached'} · {aiGeneratedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => generateAI(activeConversation!.id)}
                      disabled={aiGenerating || aiLoading}
                      className="flex items-center gap-1.5 h-6 px-2.5 rounded-lg border border-[#e9d5ff] bg-white text-[11px] font-semibold text-[#7C3AED] hover:bg-[#f5f3ff] disabled:opacity-50 transition-colors"
                    >
                      <span className={cn("material-symbols-outlined text-[13px]", (aiGenerating || aiLoading) && "animate-spin")}>
                        {(aiGenerating || aiLoading) ? "progress_activity" : "refresh"}
                      </span>
                      {(aiGenerating || aiLoading) ? 'Generating…' : 'Generate'}
                    </button>
                  </div>
                  <div className="px-3 pb-3 flex flex-col gap-2">
                    {(aiGenerating || aiLoading) && (
                      [1,2].map(i => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)
                    )}
                    {!aiGenerating && !aiLoading && suggestions.length === 0 && (
                      <button
                        onClick={() => generateAI(activeConversation!.id)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-xs text-slate-400 hover:border-[#7C3AED] hover:text-[#7C3AED] transition-colors flex items-center justify-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                        Generate AI suggestions
                      </button>
                    )}
                    {!aiGenerating && !aiLoading && suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-[#faf5ff] border border-[#ede9fe] text-xs text-slate-700 leading-relaxed hover:bg-[#ede9fe] hover:border-[#c4b5fd] transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile AI Suggestions Sheet — bottom drawer, md:hidden */}
              {aiSheetOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                  {/* Backdrop */}
                  <div
                    className="absolute inset-0 bg-black/40 transition-opacity"
                    onClick={() => setAiSheetOpen(false)}
                  />
                  {/* Sheet panel */}
                  <div
                    data-testid="ai-suggestions-sheet"
                    className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl overflow-y-auto"
                    style={{ maxHeight: '50vh', paddingBottom: 'env(safe-area-inset-bottom)' }}
                  >
                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-1">
                      <div className="w-10 h-1 rounded-full bg-slate-200" />
                    </div>
                    <div className="px-4 pb-4">
                      {/* Header */}
                      <div className="flex items-center gap-2 py-3 border-b border-slate-100 mb-3">
                        <TbSparkles size={16} className="text-indigo-600" />
                        <span className="text-sm font-semibold text-indigo-600">AI Suggestions</span>
                        <button
                          onClick={() => setAiSheetOpen(false)}
                          className="ml-auto w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                      {/* Suggestions list */}
                      <div className="space-y-2">
                        {(aiGenerating || aiLoading) && (
                          <div className="flex flex-col gap-2">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                          </div>
                        )}
                        {!aiGenerating && !aiLoading && suggestions.length === 0 && (
                          <p className="text-sm text-slate-400 text-center py-4">No suggestions available</p>
                        )}
                        {!aiGenerating && !aiLoading && suggestions.map((s, i) => (
                          <button
                            key={i}
                            data-testid="ai-suggestion-item"
                            onClick={() => { setInput(s); setAiSheetOpen(false); }}
                            className="w-full text-left px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 text-sm text-slate-700 hover:bg-indigo-100 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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

        {/* Right Column — Tabbed panel, hidden on mobile */}
        <aside className="hidden md:flex w-[280px] h-full flex-col bg-white border-l border-outline-variant shrink-0 overflow-hidden">
          {activeConversation ? (
            <>
              {/* Tab bar */}
              <div className="flex border-b border-outline-variant shrink-0">
                {([
                  ['contact', 'person', 'Contact'],
                  ['details', 'info', 'Details'],
                  ['history', 'history', 'History'],
                ] as const).map(([t, icon, label]) => (
                  <button
                    key={t}
                    onClick={() => setRightPanelTab(t)}
                    className={cn(
                      "flex-1 h-11 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer transition-all",
                      rightPanelTab === t
                        ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
                        : "text-slate-400 hover:text-slate-600"
                    )}
                    style={{ borderBottom: rightPanelTab === t ? '2px solid #7C3AED' : '2px solid transparent' }}
                  >
                    <span className="material-symbols-outlined text-[16px]" style={rightPanelTab === t ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                    <span className="text-[10px] font-semibold">{label}</span>
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {/* ── Contact tab ── */}
                {rightPanelTab === 'contact' && (
                  <div className="p-4">
                    <div className="flex flex-col items-center gap-2 pb-4 mb-4 border-b border-outline-variant">
                      <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-base font-bold">
                        {(activeConversation.contact.name || activeConversation.contact.channel_identifier || 'U')[0].toUpperCase()}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-900">{activeConversation.contact.name || '-'}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[220px]">{activeConversation.contact.channel_identifier}</p>
                      </div>
                      <ChannelBadge channel={activeConversation.channel} compact />
                    </div>
                    <div className="space-y-2.5 text-xs">
                      {[
                        { label: 'Name', value: activeConversation.contact.name || '-' },
                        { label: 'Identifier', value: activeConversation.contact.channel_identifier },
                        { label: 'Channel', value: getChannelMeta(activeConversation.channel).label },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-medium text-slate-900 text-right max-w-[160px] truncate">{value}</span>
                        </div>
                      ))}
                      {activeConversation.first_response_at && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">First Response</span>
                          <span className="font-medium text-slate-900">
                            {Math.round((new Date(activeConversation.first_response_at).getTime() - new Date(activeConversation.created_at).getTime()) / 60000)}m
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Details tab ── */}
                {rightPanelTab === 'details' && (
                  <div className="p-4 space-y-5">
                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
                      <div className="flex gap-1.5">
                        {(['OPEN', 'PENDING', 'CLOSED'] as const).map(s => {
                          const styles = {
                            OPEN: { active: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Open' },
                            PENDING: { active: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
                            CLOSED: { active: 'bg-slate-100 text-slate-600 border-slate-300', label: 'Closed' },
                          };
                          const isActive = activeConversation.status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => updateConversation(activeConversation.id, { status: s })}
                              className={cn(
                                "flex-1 py-1.5 rounded-lg border text-[11px] font-semibold transition-all",
                                isActive ? styles[s].active : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                              )}
                            >
                              {styles[s].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Assigned Agent */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned Agent</p>
                      <AssignmentPanel
                        conversation={activeConversation}
                        onAssign={async (userId) => {
                          await conversationsApi.assignConversation(activeConversation.id, userId);
                          fetchConversations();
                        }}
                      />
                    </div>

                    {/* Tag */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Conversation Tag</p>
                        {activeConversation.tag && <TagBadge tag={activeConversation.tag} />}
                      </div>
                      <TagSelect
                        value={activeConversation.tag}
                        onChange={(tag) => updateConversation(activeConversation.id, { tag })}
                      />
                      <p className="mt-1.5 text-[10px] text-slate-400">One tag per conversation in this release.</p>
                    </div>
                  </div>
                )}

                {/* ── History tab ── */}
                {rightPanelTab === 'history' && (
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Other Conversations</p>
                    {(() => {
                      const otherConvs = conversations.filter(
                        c => c.contact_id === activeConversation.contact_id && c.id !== activeConversation.id
                      );
                      if (otherConvs.length === 0) return (
                        <p className="text-xs text-slate-400 text-center py-6">No previous conversations</p>
                      );
                      return (
                        <div className="flex flex-col divide-y divide-slate-100">
                          {otherConvs.map(c => (
                            <button
                              key={c.id}
                              onClick={() => handleSelectConversation(c)}
                              className="flex flex-col gap-1.5 py-3 text-left hover:bg-slate-50 transition-colors px-1 rounded-lg"
                            >
                              <div className="flex items-center justify-between">
                                <ChannelBadge channel={c.channel} compact />
                                <span className="text-[10px] text-slate-400">
                                  {c.last_message_date ? new Date(c.last_message_date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 truncate">{c.last_message || 'No messages'}</p>
                              <span className={cn(
                                "text-[10px] font-semibold",
                                c.status === 'CLOSED' ? "text-emerald-600" : "text-slate-400"
                              )}>
                                {c.status === 'CLOSED' ? '✓ Resolved' : c.status}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-5 opacity-50">
              <p className="text-sm text-slate-400">No contact selected.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
