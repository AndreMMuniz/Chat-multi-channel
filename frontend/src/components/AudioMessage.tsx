"use client";

import { useState, useEffect, useRef } from 'react';

const BARS = 40;

interface AudioMessageProps {
  src: string;
  inbound: boolean;
}

export default function AudioMessage({ src, inbound }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [bars, setBars] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function decodeWaveform() {
      try {
        const res = await fetch(src);
        const arrayBuffer = await res.arrayBuffer();
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        const channelData = audioBuffer.getChannelData(0);
        const samplesPerBar = Math.floor(channelData.length / BARS);
        const amplitudes: number[] = [];

        for (let i = 0; i < BARS; i++) {
          let sum = 0;
          for (let j = 0; j < samplesPerBar; j++) {
            sum += Math.abs(channelData[i * samplesPerBar + j]);
          }
          amplitudes.push(sum / samplesPerBar);
        }

        const max = Math.max(...amplitudes, 0.001);
        if (!cancelled) {
          setBars(amplitudes.map(v => v / max));
          setDuration(audioBuffer.duration);
        }
        audioCtx.close();
      } catch {
        if (!cancelled) {
          // Fallback: placeholder bars with pseudo-random heights
          setBars(Array.from({ length: BARS }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.7)) * 0.8));
        }
      }
    }
    decodeWaveform();
    return () => { cancelled = true; };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.pause(); } else { audio.play(); }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  };

  const playedBars = Math.floor(progress * BARS);
  const activeColor = inbound ? 'bg-slate-600' : 'bg-white';
  const inactiveColor = inbound ? 'bg-slate-300' : 'bg-white/40';
  const timeColor = inbound ? 'text-slate-500' : 'text-white/70';
  const btnColor = inbound
    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
    : 'bg-white/20 hover:bg-white/30 text-white';

  return (
    <div className="flex items-center gap-2 mt-2 min-w-[220px] max-w-[280px]">
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${btnColor}`}
      >
        <span
          className="material-symbols-outlined text-[18px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      <div className="flex-1 flex flex-col gap-1">
        <div
          className="flex items-end gap-[2px] h-8 cursor-pointer"
          onClick={handleSeek}
        >
          {bars.length > 0
            ? bars.map((amp, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-colors duration-75 ${i < playedBars ? activeColor : inactiveColor}`}
                  style={{ height: `${Math.max(15, amp * 100)}%` }}
                />
              ))
            : Array.from({ length: BARS }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-full animate-pulse ${inactiveColor}`}
                  style={{ height: '40%' }}
                />
              ))}
        </div>
        <span className={`text-[10px] tabular-nums ${timeColor}`}>
          {formatTime(isPlaying ? currentTime : duration)}
        </span>
      </div>
    </div>
  );
}
