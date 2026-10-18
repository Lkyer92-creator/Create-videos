"use client";

import React, { useState } from "react";
import AudioUploader from "../components/AudioUploader";
import BlockCard from "../components/BlockCard";
import { analyzeAudioBuffer, BlockFeature } from "../lib/audioAnalysis";
import { generatePromptsForBlocks } from "../lib/promptGenerator";

export default function Page() {
  const [blocks, setBlocks] = useState<BlockFeature[]>([]);
  const [globalStyle, setGlobalStyle] = useState("cinematic dark fantasy, photorealistic");
  const [continuity, setContinuity] = useState({
    character: "lead singer",
    outfit: "black velvet coat",
    setting: "rainy cobblestone bridge",
  });

  async function onAudioLoaded(buffer: AudioBuffer) {
    const features = await analyzeAudioBuffer(buffer, 10); // 10s blocks
    // generate default prompts
    const blocksWithPrompts = generatePromptsForBlocks(features, globalStyle, continuity);
    setBlocks(blocksWithPrompts);
  }

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Music Video Prompt Studio</h1>
        <div className="space-x-2">
          <input
            className="rounded px-2 py-1 text-black"
            value={globalStyle}
            onChange={(e) => setGlobalStyle(e.target.value)}
          />
          <button
            className="bg-blue-600 px-3 py-1 rounded"
            onClick={() => setBlocks(generatePromptsForBlocks(blocks, globalStyle, continuity))}
          >
            Apply style
          </button>
        </div>
      </header>

      <AudioUploader onAudioReady={onAudioLoaded} />

      <section className="space-y-4">
        {blocks.map((b, i) => (
          <BlockCard
            key={b.id}
            block={b}
            index={i + 1}
            globalStyle={globalStyle}
            continuity={continuity}
            onUpdate={(updated) => {
              const copy = [...blocks];
              copy[i] = updated;
              setBlocks(copy);
            }}
          />
        ))}
      </section>

      <footer>
        <button
          className="bg-green-600 px-4 py-2 rounded"
          onClick={() => {
            // copy all prompts to clipboard
            const text = blocks
              .map(
                (b, idx) =>
                  `${idx + 1}) ${formatTime(b.start)}–${formatTime(b.end)} — ${b.section || "—"}\nIMAGE: ${b.imagePrompt}\nVIDEO: ${b.videoPrompt}\n`
              )
              .join("\n");
            navigator.clipboard.writeText(text);
            alert("Copied all prompts to clipboard");
          }}
        >
          Copy all prompts
        </button>
      </footer>
    </div>
  );
}

function formatTime(s: number) {
  const mm = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = Math.floor(s % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}
