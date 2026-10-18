"use client";

import React, { useState } from "react";
import { BlockFeature } from "../lib/audioAnalysis";

// Keyframe generation uses the free Pollinations image endpoint directly
// (no key needed) — the same approach as the standalone image generator:
// a fresh random seed per generation, loaded straight into <img>
// (no fetch, so no CORS issues at all).
function pollinationsUrl(prompt: string) {
  const seed = Math.floor(Math.random() * 1000000);
  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`
  );
}

export default function BlockCard({
  block,
  index,
  globalStyle,
  continuity,
  onUpdate,
}: {
  block: BlockFeature;
  index: number;
  globalStyle: string;
  continuity: any;
  onUpdate: (b: BlockFeature) => void;
}) {
  const [loading, setLoading] = useState(false);

  function generateImage() {
    // Fresh random seed each time, so Regenerate gives a new image.
    setLoading(true);
    onUpdate({ ...block, imageUrl: pollinationsUrl(block.imagePrompt || "") });
  }

  async function downloadImage() {
    if (!block.imageUrl) return;
    try {
      const resp = await fetch(block.imageUrl);
      if (!resp.ok) throw new Error("download failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `block-${index}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // cross-origin fetch blocked — just open the image in a new tab
      window.open(block.imageUrl, "_blank");
    }
  }

  return (
    <div className="p-4 bg-gray-800 rounded grid grid-cols-4 gap-4">
      <div className="col-span-1">
        <div className="text-sm text-gray-400">#{index}</div>
        <div className="text-sm">
          {formatTime(block.start)}–{formatTime(block.end)}
        </div>
        <select
          className="mt-2 bg-gray-700 px-2 py-1 rounded"
          value={block.section || ""}
          onChange={(e) => onUpdate({ ...block, section: e.target.value })}
        >
          <option value="">—</option>
          <option>Intro</option>
          <option>Verse 1</option>
          <option>Pre-Chorus</option>
          <option>Chorus</option>
          <option>Verse 2</option>
          <option>Bridge</option>
          <option>Outro</option>
        </select>
        <div className="mt-2 text-xs text-gray-400">Shot Type</div>
        <div className="flex gap-1 mt-1">
          {["Keyframe", "Motion", "B-roll", "Lip sync"].map((s) => (
            <button
              key={s}
              className={`px-2 py-1 rounded ${block.shotType?.includes(s) ? "bg-blue-600" : "bg-gray-700"}`}
              onClick={() => {
                const types = new Set(block.shotType || []);
                if (types.has(s)) types.delete(s);
                else types.add(s);
                onUpdate({ ...block, shotType: Array.from(types) });
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-3 space-y-2">
        <div>
          <div className="text-xs text-gray-400">Image Prompt</div>
          <textarea
            className="w-full bg-gray-900 p-2 rounded text-sm"
            value={block.imagePrompt || ""}
            onChange={(e) => onUpdate({ ...block, imagePrompt: e.target.value })}
          />
          <div className="flex gap-2 mt-2">
            <button className="bg-indigo-600 px-3 py-1 rounded" onClick={generateImage}>
              {loading ? "Generating..." : "Generate keyframe"}
            </button>
            <button
              className="bg-gray-700 px-3 py-1 rounded"
              onClick={() => navigator.clipboard.writeText(block.imagePrompt || "")}
            >
              Copy
            </button>
            <button
              className="bg-gray-700 px-3 py-1 rounded"
              onClick={() =>
                onUpdate({ ...block, imagePrompt: generateImagePromptPreview(block, globalStyle, continuity) })
              }
            >
              Auto-generate
            </button>
            {block.imageUrl && (
              <button className="bg-green-600 px-3 py-1 rounded" onClick={downloadImage}>
                Download
              </button>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs text-gray-400">Video Prompt</div>
          <textarea
            className="w-full bg-gray-900 p-2 rounded text-sm"
            value={block.videoPrompt || ""}
            onChange={(e) => onUpdate({ ...block, videoPrompt: e.target.value })}
          />
          <div className="flex gap-2 mt-2">
            <button
              className="bg-gray-700 px-3 py-1 rounded"
              onClick={() => navigator.clipboard.writeText(block.videoPrompt || "")}
            >
              Copy
            </button>
            <button
              className="bg-gray-700 px-3 py-1 rounded"
              onClick={() => onUpdate({ ...block, videoPrompt: generateVideoPromptPreview(block) })}
            >
              Auto-generate
            </button>
          </div>
        </div>

        {block.imageUrl && (
          <img
            src={block.imageUrl}
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
            className="w-64 h-64 object-cover rounded mt-2"
            alt="generated keyframe"
          />
        )}
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

// lightweight internal fallbacks (same logic as promptGenerator, but local)
function generateImagePromptPreview(block: any, globalStyle: string, continuity: any) {
  return `${continuity.character} in ${continuity.outfit}, ${continuity.setting}, high visual contrast, warm amber and deep navy shadows, cinematic rim light, wet textures, shallow depth, 85mm, photorealistic, ${globalStyle}`;
}
function generateVideoPromptPreview(block: any) {
  return block.tempo > 110
    ? "fast dolly and 90° spin over 10s, brisk walk across frame, end on tight close-up"
    : "slow crane forward over 10s, subtle head-turn, end on tight close-up";
}
