"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { apiFetch, getStoredUser } from '@/lib/api';
import AudioMessage from '@/components/AudioMessage';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;   // 5 MB
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_FILE_SIZE  = 20 * 1024 * 1024;  // 20 MB

async function compressImage(file: File, maxDim = 1920, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = objectUrl;
  });
}

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types

interface Message {
  id: string;
  conversation_id: string;
  content: string;
  inbound: boolean;
  message_type: 'text' | 'image' | 'file' | 'audio';
  created_at: string;
  image?: string;
  file?: string;
}

interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  channel_identifier?: string;
}

interface Conversation {
  id: string;
  contact_id: string;
  channel: string;
  status: string;
  tag?: string;
  is_unread: boolean;
  last_message?: string;
  last_message_date?: string;
  created_at: string;
  updated_at: string;
  contact: Contact;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/chat/ws';

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Multimedia State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch Conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // Fetch Messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_URL}/chat/conversations/${conversationId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  useEffect(() => {
    fetchConversations();

    // WebSocket Connection
    let isMounted = true;
    const connectWs = () => {
      if (ws.current) ws.current.close();
      ws.current = new WebSocket(WS_URL);
      ws.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "new_message") {
            const newMsg = parsed.data as Message;
            
            // Update conversations list (optimistic sort to top)
            setConversations(prev => {
              const updated = [...prev];
              const idx = updated.findIndex(c => c.id === newMsg.conversation_id);
              if (idx > -1) {
                updated[idx].last_message = newMsg.content;
                updated[idx].last_message_date = newMsg.created_at;
                updated[idx].is_unread = newMsg.inbound;
                // Move to top
                const [conv] = updated.splice(idx, 1);
                updated.unshift(conv);
              } else {
                // If we don't have the conversation, fetch it all again
                fetchConversations();
              }
              return updated;
            });

            // If the message belongs to the active conversation, append it
            setActiveConversation(active => {
              if (active && active.id === newMsg.conversation_id) {
                setMessages(prev => {
                  if (prev.some(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                scrollToBottom();
              }
              return active;
            });
          } else if (parsed.type === "conversation_updated") {
            // Update status/tag in list
            fetchConversations();
          }
        } catch (err) {
          console.error("Error parsing WS message", err);
        }
      };
    };

    connectWs();

    return () => {
      isMounted = false;
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectConversation = async (conv: Conversation) => {
    setActiveConversation(conv);
    cancelAttachment();
    await fetchMessages(conv.id);
    
    // Mark as read
    if (conv.is_unread) {
      try {
        await apiFetch(`/chat/conversations/${conv.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ is_unread: false })
        });
        // Update local state
        setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_unread: false } : c));
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    }
  };

  // --- Multimedia Handlers ---

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > limit) {
      alert(`File too large. Maximum size is ${isImage ? '5' : '20'} MB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    setShowEmojiPicker(false);
  };

  const cancelAttachment = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onEmojiClick = (emojiData: { emoji: string }) => {
    setInput(prev => prev + emojiData.emoji);
    // setShowEmojiPicker(false); // Keep open for multiple emojis?
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        await uploadAndSendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadAndSendAudio = async (blob: Blob) => {
    if (!activeConversation) return;

    if (blob.size > MAX_AUDIO_SIZE) {
      alert('Audio recording too large. Maximum size is 10 MB.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', blob, 'recording.mp3');

      const uploadRes = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
        // No Content-Type header - browser will set it with boundary
      });

      if (!uploadRes.ok) throw new Error("Failed to upload audio");
      const { url } = await uploadRes.json();

      await sendMessageInternal({
        content: "Audio message",
        message_type: 'audio',
        file: url
      });
    } catch (err) {
      console.error("Error sending audio:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedFile) || !activeConversation) return;
    
    let content = input;
    let type: 'text' | 'image' | 'file' = 'text';
    let fileUrl = '';
    let imageUrl = '';

    setLoading(true);
    try {
      if (selectedFile) {
        const fileToUpload = selectedFile.type.startsWith('image/')
          ? await compressImage(selectedFile)
          : selectedFile;

        const formData = new FormData();
        formData.append('file', fileToUpload);

        const uploadRes = await fetch(`${API_URL.replace('/api/v1', '')}/api/v1/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload file");
        const { url } = await uploadRes.json();

        if (selectedFile.type.startsWith('image/')) {
          type = 'image';
          imageUrl = url;
          if (!content) content = "Image";
        } else {
          type = 'file';
          fileUrl = url;
          if (!content) content = `File: ${selectedFile.name}`;
        }
      }

      await sendMessageInternal({
        content,
        message_type: type,
        image: imageUrl,
        file: fileUrl
      });

      setInput('');
      cancelAttachment();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessageInternal = async (payload: any) => {
    if (!activeConversation) return;

    const user = getStoredUser<{id: string}>();
    
    // Optimistic UI Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: activeConversation.id,
      content: payload.content,
      inbound: false,
      message_type: payload.message_type,
      created_at: new Date().toISOString(),
      image: payload.image,
      file: payload.file
    };

    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();
    
    try {
      const res = await apiFetch(`/chat/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: activeConversation.id,
          owner_id: user?.id,
          ...payload
        })
      });
      
      if (!res.ok) throw new Error('Failed to send message');
      const realMessage = await res.json();
      
      setMessages(prev => {
        if (prev.some(m => m.id === realMessage.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map(m => m.id === tempId ? realMessage : m);
      });
    } catch (err) {
      console.error("Error in sendMessageInternal:", err);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-16 border-b border-[#E9ECEF] bg-white shrink-0 flex items-center px-6">
        <span className="text-[18px] font-semibold text-slate-900">Inbox</span>
      </header>

      {/* Main Workspace (3-Column Layout) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversation List (Fixed 320px) */}
        <aside className="w-[320px] h-full flex flex-col bg-surface-container-lowest border-r border-outline-variant shrink-0">
          <div className="p-md border-surface-variant">
            <div className="relative flex items-center w-full h-10 rounded-DEFAULT bg-[#F1F3F5] text-on-surface-variant focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-container transition-all">
              <span className="material-symbols-outlined ml-sm text-outline">search</span>
              <input className="w-full h-full bg-transparent border-none text-body-sm focus:ring-0 pl-sm pr-sm outline-none" placeholder="Search conversations..." type="text" />
            </div>
          </div>
          
          {/* List */}
          <div className="flex-1 overflow-y-auto p-sm space-y-sm">
            {conversations.length === 0 && <div className="p-4 text-center text-sm text-gray-500">No conversations yet</div>}
            {conversations.map((conv) => (
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
                  {conv.is_unread && (
                    <div className={cn("absolute bottom-0 right-0 w-3 h-3 border-2 border-surface-container-lowest rounded-full bg-green-500")}></div>
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
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      {conv.last_message_date ? new Date(conv.last_message_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
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
                      <span className="material-symbols-outlined text-[16px]">{activeConversation.channel === 'TELEGRAM' ? 'send' : 'chat'}</span>
                      <span className="capitalize">{activeConversation.channel.toLowerCase()}</span>
                    </div>
                  </div>
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
                          : "bg-surface-container-lowest border border-outline-variant rounded-tl-sm text-on-surface"
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
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-md bg-surface-container-lowest border-t border-outline-variant relative">
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
                      <textarea 
                        className="flex-1 bg-transparent border-none text-body-md text-on-surface focus:ring-0 outline-none resize-none py-sm pl-sm min-h-[40px] max-h-[120px] overflow-y-auto" 
                        placeholder="Type a message..." 
                        rows={1}
                        value={input}
                        onFocus={() => setShowEmojiPicker(false)}
                        onChange={(e) => {
                          setInput(e.target.value);
                          e.target.style.height = 'auto';
                          e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
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
            <div className="p-lg flex flex-col gap-md">
              <h3 className="font-body-sm text-body-sm font-semibold text-on-surface uppercase tracking-wider">Contact Details</h3>
              <div className="flex flex-col gap-sm font-body-sm text-body-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Name</span>
                  <span className="text-on-surface font-medium ml-2">{activeConversation.contact.name || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Identifier</span>
                  <span className="text-on-surface font-medium truncate ml-2" title={activeConversation.contact.channel_identifier}>{activeConversation.contact.channel_identifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Status</span>
                  <span className="text-on-surface font-medium capitalize">{activeConversation.status.toLowerCase()}</span>
                </div>
              </div>
            </div>
          ) : (
             <div className="p-lg flex flex-col gap-md opacity-50">
                <h3 className="font-body-sm text-body-sm font-semibold text-on-surface uppercase tracking-wider">Contact Details</h3>
                <p className="text-sm">No contact selected.</p>
             </div>
          )}
        </aside>
      </main>
    </div>
  );
}
