import { S } from "../styles";
import { EMOTION_LABELS, type Emotion, type MemeItem } from "../lib/memes";

export function MemePanel({ meme, emotion, error }: { meme: MemeItem | null; emotion: Emotion | null; error?: string | null }) {
  return (
    <div style={S.memePanel}>
      {meme ? (
        <div key={meme.src} className="ft-meme-pop" style={S.memeReveal}>
          <img src={meme.src} alt={meme.alt} style={S.memeRevealImg} />
          <span style={S.memeRevealLabel}>{emotion ? EMOTION_LABELS[emotion] : ""}</span>
        </div>
      ) : error ? (
        <div style={S.memeEmpty}>
          <span style={S.memeEmptyText}>{error}</span>
          <span style={S.memeEmptyHint}>Gương thần vẫn đang cố nhận diện, không cần bấm lại đâu nha.</span>
        </div>
      ) : (
        <div style={S.memeEmpty}>
          <span style={S.memeEmptyText}>Chưa nhận diện cảm xúc</span>
          <span style={S.memeEmptyHint}>Bật cam và đưa mặt vào khung hình, gương thần sẽ tự chọn meme đúng cảm xúc của bạn.</span>
        </div>
      )}
    </div>
  );
}
