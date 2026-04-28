"use client";

import { useState, useCallback, useRef } from "react";
import { conversationsApi, uploadApi } from "@/lib/api/index";
import { getStoredUser } from "@/lib/api";
import type { Message, MessageType, SendMessageRequest } from "@/types/chat";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
const MAX_FILE_SIZE  = 20 * 1024 * 1024;

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
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
        "image/jpeg", quality
      );
    };
    img.onerror = () => resolve(file);
    img.src = objectUrl;
  });
}

export interface UseMessagesReturn {
  messages: Message[];
  sending: boolean;
  fetchMessages: (conversationId: string) => Promise<void>;
  sendText: (conversationId: string, content: string) => Promise<void>;
  sendFile: (conversationId: string, file: File) => Promise<void>;
  sendAudio: (conversationId: string, blob: Blob) => Promise<void>;
  /** Append a message received via WebSocket (deduplicates + keeps order) */
  appendMessage: (msg: Message) => void;
}

export function useMessages(scrollToBottom: () => void): UseMessagesReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data } = await conversationsApi.getMessages(conversationId);
      const sorted = [...data].sort((a, b) => a.conversation_sequence - b.conversation_sequence);
      setMessages(sorted);
      scrollToBottom();
    } catch (err) {
      console.error("fetchMessages:", err);
    }
  }, [scrollToBottom]);

  const appendMessage = useCallback((msg: Message) => {
    setMessages(prev => {
      if (prev.some(m => m.id === msg.id)) return prev;
      return [...prev, msg].sort((a, b) => a.conversation_sequence - b.conversation_sequence);
    });
    scrollToBottom();
  }, [scrollToBottom]);

  // ── Core send ──────────────────────────────────────────────────────────────

  const sendCore = useCallback(async (
    conversationId: string,
    payload: Omit<SendMessageRequest, "conversation_id">
  ) => {
    const user = getStoredUser<{ id: string }>();
    const tempId = `temp-${Date.now()}`;

    const optimistic: Message = {
      id: tempId,
      conversation_id: conversationId,
      content: payload.content,
      inbound: false,
      message_type: payload.message_type,
      conversation_sequence: Date.now(),
      created_at: new Date().toISOString(),
      image: payload.image,
      file: payload.file,
    };

    setMessages(prev => [...prev, optimistic]);
    scrollToBottom();

    try {
      const real = await conversationsApi.sendMessage(conversationId, {
        ...payload,
        owner_id: user?.id,
        inbound: false,
      });
      setMessages(prev => {
        if (prev.some(m => m.id === real.id)) return prev.filter(m => m.id !== tempId);
        return prev
          .map(m => (m.id === tempId ? real : m))
          .sort((a, b) => a.conversation_sequence - b.conversation_sequence);
      });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    }
  }, [scrollToBottom]);

  // ── Public send actions ────────────────────────────────────────────────────

  const sendText = useCallback(async (conversationId: string, content: string) => {
    setSending(true);
    try {
      await sendCore(conversationId, { content, message_type: "text" });
    } finally { setSending(false); }
  }, [sendCore]);

  const sendFile = useCallback(async (conversationId: string, file: File) => {
    const isImage = file.type.startsWith("image/");
    const limit = isImage ? MAX_IMAGE_SIZE : MAX_FILE_SIZE;
    if (file.size > limit) {
      alert(`File too large. Maximum is ${isImage ? 5 : 20} MB.`);
      return;
    }
    setSending(true);
    try {
      const toUpload = isImage ? await compressImage(file) : file;
      const url = await uploadApi.uploadFile(toUpload);
      const type: MessageType = isImage ? "image" : "file";
      await sendCore(conversationId, {
        content: isImage ? "Image" : `File: ${file.name}`,
        message_type: type,
        image: isImage ? url : undefined,
        file: !isImage ? url : undefined,
      });
    } finally { setSending(false); }
  }, [sendCore]);

  const sendAudio = useCallback(async (conversationId: string, blob: Blob) => {
    if (blob.size > MAX_AUDIO_SIZE) {
      alert("Audio too large. Maximum is 10 MB.");
      return;
    }
    setSending(true);
    try {
      const url = await uploadApi.uploadFile(blob, "recording.mp3");
      await sendCore(conversationId, {
        content: "Audio message",
        message_type: "audio",
        file: url,
      });
    } finally { setSending(false); }
  }, [sendCore]);

  return { messages, sending, fetchMessages, sendText, sendFile, sendAudio, appendMessage };
}
