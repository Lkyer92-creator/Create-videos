"use client";

import React from "react";

export default function AudioUploader({
  onAudioReady,
}: {
  onAudioReady: (buffer: AudioBuffer, duration: number) => void;
}) {
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const array = await f.arrayBuffer();
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buffer = await ctx.decodeAudioData(array);
    onAudioReady(buffer, buffer.duration);
  }

  return (
    <div className="p-4 bg-gray-800 rounded">
      <label className="block text-sm text-gray-300">Upload song (MP3/WAV/M4A)</label>
      <input type="file" accept="audio/*" onChange={handleFile} />
    </div>
  );
}
