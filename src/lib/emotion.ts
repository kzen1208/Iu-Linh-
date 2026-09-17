import type { Emotion } from "./memes";

const VALID_EMOTIONS: Emotion[] = ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"];

// Chụp khung hình hiện tại của video — giữ độ phân giải đủ cao (mặc định 640px cạnh dài,
// gần với độ phân giải webcam gốc 640x480) để model nhìn rõ chi tiết biểu cảm khuôn mặt
// (nếp nhăn mắt, khoé miệng…), tránh nhận diện sai vì ảnh quá nhỏ/mờ.
export function captureFrame(video: HTMLVideoElement, maxSize = 640): string | null {
  if (video.readyState < 2 || !video.videoWidth) return null;

  const scale = Math.min(1, maxSize / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

// Gửi khung hình lên server/index.js (proxy /api/emotion) — server giữ OPENROUTER_API_KEY
// và gọi model vision trên OpenRouter, trả về đúng 1 trong 7 nhãn cảm xúc.
export async function detectEmotion(image: string, signal?: AbortSignal): Promise<Emotion> {
  const res = await fetch("/api/emotion", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Lỗi nhận diện cảm xúc (${res.status})`);
  }

  const data = await res.json();
  return VALID_EMOTIONS.includes(data?.emotion) ? data.emotion : "neutral";
}
