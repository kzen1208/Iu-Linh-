import Cool from "../assets/memes/Cool.jpg";
import Pretty from "../assets/memes/Pretty.jpg";
import Smile from "../assets/memes/Smile.jpg";
import Stress from "../assets/memes/Stress.jpg";
import Cute from "../assets/memes/cute.jpg";
import Imbecile from "../assets/memes/imbecile.jpg";
import Sad from "../assets/memes/sad.jpg";
import Shifty from "../assets/memes/shifty.jpg";

// 7 nhóm cảm xúc chuẩn — phải khớp với danh sách EMOTIONS trong server/index.js
export type Emotion = "neutral" | "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised";

export type MemeItem = { src: string; alt: string };

// Nhãn tiếng Việt hiển thị kèm meme khi gương thần nhận ra cảm xúc
export const EMOTION_LABELS: Record<Emotion, string> = {
  neutral: "Cool ngầu",
  happy: "Cười tươi ghê",
  sad: "Buồn xìu rồi",
  angry: "Khó ở quá à nha",
  fearful: "Căng thẳng ghê đó",
  disgusted: "Xỉu ngang luôn",
  surprised: "Ngáo ngơ chưa kìa",
};

// Mỗi cảm xúc có thể ứng với nhiều meme — khi đổi cảm xúc sẽ random 1 ảnh trong
// nhóm đó (xem pickMeme), giữ nguyên lựa chọn cũ khi cảm xúc chưa đổi để tránh
// meme nhấp nháy liên tục mỗi lần poll.
export const MOOD_MEMES: Record<Emotion, MemeItem[]> = {
  neutral: [{ src: Cool, alt: "Cool" }],
  happy: [
    { src: Smile, alt: "Smile" },
    { src: Pretty, alt: "Pretty" },
    { src: Cute, alt: "Cute" },
  ],
  sad: [{ src: Sad, alt: "Sad" }],
  angry: [{ src: Shifty, alt: "Shifty" }],
  fearful: [{ src: Stress, alt: "Stress" }],
  disgusted: [{ src: Stress, alt: "Stress" }],
  surprised: [{ src: Imbecile, alt: "Imbecile" }],
};

export function pickMeme(emotion: Emotion): MemeItem {
  const options = MOOD_MEMES[emotion];
  return options[Math.floor(Math.random() * options.length)];
}
