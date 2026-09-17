import "dotenv/config";
import express from "express";
import cors from "cors";

const PORT = process.env.PORT || 3001;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

// 7 nhóm cảm xúc chuẩn (giống face-api.js/FER) — khớp với MOOD_MEMES trong src/lib/memes.ts
const EMOTIONS = ["neutral", "happy", "sad", "angry", "fearful", "disgusted", "surprised"];

// Chỉ toàn mức khen — khớp với RATING_LEVELS trong src/lib/rating.ts (giữ đồng bộ thủ công,
// server này là JS thuần nên không import trực tiếp được file .ts phía client)
const RATING_LEVELS = ["Dễ thương", "Xinh xắn", "Cuốn hút", "Xinh xỉu", "Thần thái đỉnh cao", "Cực phẩm nhan sắc"];

if (!OPENROUTER_API_KEY) {
  console.warn("[emotion-api] Thiếu OPENROUTER_API_KEY trong .env — các endpoint AI sẽ báo lỗi.");
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "6mb" }));

// Gọi OpenRouter, yêu cầu trả về đúng 1 nhãn trong danh sách `labels` — dùng chung cho
// cả /api/emotion và /api/rate để tránh lặp code gọi API.
async function classifyImage({ image, prompt, labels, detail }) {
  const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      max_tokens: 12,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image, detail } },
          ],
        },
      ],
    }),
  });

  if (!upstream.ok) {
    const detailText = await upstream.text();
    const err = new Error(`OpenRouter lỗi ${upstream.status}: ${detailText.slice(0, 300)}`);
    err.status = 502;
    throw err;
  }

  const data = await upstream.json();
  const raw = (data?.choices?.[0]?.message?.content ?? "").toLowerCase();
  return labels.find((label) => raw.includes(label.toLowerCase())) ?? null;
}

app.post("/api/emotion", async (req, res) => {
  const { image } = req.body ?? {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    res.status(400).json({ error: "Thiếu ảnh hợp lệ (data URL base64)." });
    return;
  }
  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: "Server chưa cấu hình OPENROUTER_API_KEY." });
    return;
  }

  try {
    const emotion = await classifyImage({
      image,
      // detail: "high" — chế độ "low" của OpenAI luôn downsample ảnh về một kích thước cố
      // định rất nhỏ bất kể ảnh gửi lên to hay nhỏ, làm mất chi tiết biểu cảm (mắt, miệng)
      // nên nhận diện hay sai. "high" phân tích ảnh theo đúng độ phân giải gửi lên, chính
      // xác hơn — đổi lại tốn token/chi phí hơn mỗi lần gọi.
      detail: "high",
      prompt:
        "Look at the face in this photo and reply with EXACTLY one word describing the dominant " +
        `facial expression, chosen only from this list (no punctuation, no explanation): ${EMOTIONS.join(", ")}.`,
      labels: EMOTIONS,
    });
    res.json({ emotion: emotion ?? "neutral" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err?.message || "Lỗi không xác định." });
  }
});

app.post("/api/rate", async (req, res) => {
  const { image } = req.body ?? {};
  if (typeof image !== "string" || !image.startsWith("data:image/")) {
    res.status(400).json({ error: "Thiếu ảnh hợp lệ (data URL base64)." });
    return;
  }
  if (!OPENROUTER_API_KEY) {
    res.status(500).json({ error: "Server chưa cấu hình OPENROUTER_API_KEY." });
    return;
  }

  try {
    const level = await classifyImage({
      image,
      // ảnh upload 1 lần, không phải poll liên tục — để "auto" cho model nhìn rõ ảnh hơn
      detail: "auto",
      prompt:
        "You are a warm, encouraging photo assistant for a fun mirror app. Look at the photo and reply with " +
        "EXACTLY one phrase — no punctuation, no explanation — picking the compliment level that best fits the " +
        `person's photo, chosen only from this list: ${RATING_LEVELS.join(", ")}.`,
      labels: RATING_LEVELS,
    });
    res.json({ level: level ?? RATING_LEVELS[0] });
  } catch (err) {
    res.status(err.status || 500).json({ error: err?.message || "Lỗi không xác định." });
  }
});

app.listen(PORT, () => {
  console.log(`[emotion-api] Đang chạy tại http://localhost:${PORT}`);
});
