// Splits audio into N-second blocks, computing RMS (energy) and spectral
// centroid per block using Meyda. A simple tempo estimator (approximate).

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export type BlockFeature = {
  id: string;
  index: number;
  start: number;
  end: number;
  duration: number;
  energy: number; // RMS
  centroid: number; // spectral centroid
  tempo: number;
  section?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  shotType?: string[];
  imageUrl?: string | null;
};

export async function analyzeAudioBuffer(buffer: AudioBuffer, blockSeconds = 10): Promise<BlockFeature[]> {
  // dynamic import meyda so it's only client-side
  const Meyda = (await import("meyda")).default;
  const sr = buffer.sampleRate;
  const hopSize = 512;
  const frameSize = 1024;
  // meyda 5.x takes sample rate / buffer size as object properties,
  // not as per-call options
  Meyda.sampleRate = sr;
  Meyda.bufferSize = frameSize;
  const channelData = buffer.getChannelData(0); // mono for analysis
  const totalSec = buffer.duration;
  const blocks: BlockFeature[] = [];

  for (let start = 0, idx = 0; start < totalSec; start += blockSeconds, idx++) {
    const sSamp = Math.floor(start * sr);
    const eSamp = Math.min(Math.floor((start + blockSeconds) * sr), channelData.length);
    const slice = channelData.slice(sSamp, eSamp);
    // compute RMS and centroid on frames across the slice
    let rmsSum = 0;
    let centroidSum = 0;
    let frames = 0;
    for (let i = 0; i + frameSize < slice.length; i += hopSize) {
      const frame = slice.slice(i, i + frameSize);
      const features: any = Meyda.extract(["rms", "spectralCentroid"], frame);
      if (features) {
        rmsSum += features.rms ?? 0;
        centroidSum += features.spectralCentroid ?? 0;
        frames++;
      }
    }
    const energy = frames ? rmsSum / frames : 0;
    const centroid = frames ? centroidSum / frames : 0;
    // tempo: simple global estimator per block (very approximate)
    const tempo = estimateTempo(slice, sr) || 90;
    blocks.push({
      id: uid(),
      index: idx,
      start,
      end: Math.min(start + blockSeconds, totalSec),
      duration: Math.min(blockSeconds, totalSec - start),
      energy,
      centroid,
      tempo,
      shotType: ["Keyframe", "Motion"],
    });
  }
  return blocks;
}

// Very small approximate tempo estimator via onset envelope peaks
function estimateTempo(signal: Float32Array, sr: number): number | null {
  // build energy envelope and find peak autocorrelation lag
  const downsample = 8000;
  const factor = Math.max(1, Math.floor(sr / downsample));
  const n = Math.floor(signal.length / factor);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < factor; j++) {
      const s = signal[i * factor + j] || 0;
      sum += Math.abs(s);
    }
    env[i] = sum / factor;
  }
  // simple peak detection spacing
  const peaks: number[] = [];
  for (let i = 1; i < env.length - 1; i++) {
    if (env[i] > env[i - 1] && env[i] > env[i + 1] && env[i] > 0.01) peaks.push(i);
  }
  if (peaks.length < 2) return null;
  // average interval between peaks in seconds
  const intervals = [];
  for (let i = 1; i < peaks.length; i++) intervals.push((peaks[i] - peaks[i - 1]) * (factor / sr));
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const bpm = Math.round(60 / avgInterval);
  if (!isFinite(bpm) || bpm <= 30 || bpm > 300) return null;
  return bpm;
}
