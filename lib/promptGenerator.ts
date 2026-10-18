// Deterministic prompt templates: image <75 words, video <50 words, never
// reference audio, and describe only what is seen. Generates consistent
// continuity context across blocks.

export function generateImagePrompt(block: any, globalStyle: string, continuity: any) {
  // Compose a vivid, specific image prompt under 75 words.
  // Use energy/centroid/tempo to tweak adjectives and color palettes.
  const intensity = block.energy > 0.05 ? "high visual contrast" : "soft contrast";
  const palette =
    block.centroid > 2500
      ? "neon magenta and electric blue highlights"
      : "warm amber and deep navy shadows";
  const subject = `${continuity.character} in ${continuity.outfit}`;
  const setting = continuity.setting;
  // Avoid filler words like "beautiful"
  const prompt = `${subject}, ${setting}, ${subject.includes("standing") ? "" : "posed in place,"} ${intensity}, ${palette}, cinematic rim light, wet textures, shallow depth, 85mm, photorealistic, ${globalStyle}`;
  return trimToWords(prompt, 75);
}

export function generateVideoPrompt(block: any) {
  // 50 words max. Describe camera motion and visible action for the 10s clip.
  // Use tempo/energy to choose motion speed
  const speed = block.tempo > 110 || block.energy > 0.06 ? "energetic" : "slow";
  const camera = speed === "energetic" ? "fast dolly and 90° spin" : "slow crane forward";
  const action =
    speed === "energetic"
      ? "urgent walk across frame with brisk arm gestures"
      : "subtle head-turn and lingering gaze";
  const prompt = `${camera} over 10s, ${action}, subtle handheld micro-shake, end on a tight close-up reveal`;
  return trimToWords(prompt, 50);
}

export function generatePromptsForBlocks(blocks: any[], globalStyle: string, continuity: any) {
  // If blocks is a plain number (reapplication), handle gracefully
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b, i) => {
    const img = b.imagePrompt || generateImagePrompt(b, globalStyle, continuity);
    const vid = b.videoPrompt || generateVideoPrompt(b);
    return { ...b, imagePrompt: img, videoPrompt: vid, shotType: b.shotType || ["Keyframe", "Motion"] };
  });
}

function trimToWords(text: string, maxWords: number) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}
