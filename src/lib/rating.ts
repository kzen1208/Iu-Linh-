// Gương thần chỉ khen — không có mức "xấu" trong danh sách, chỉ có nhiều cấp độ
// xinh/đẹp/cuốn hút khác nhau, khớp với tông giọng của COMPLIMENTS/RATING_NOTES
// trong phần soi gương webcam phía trên.
export const RATING_LEVELS = ["Dễ thương", "Xinh xắn", "Cuốn hút", "Xinh xỉu", "Thần thái đỉnh cao", "Cực phẩm nhan sắc"];

// Đọc file ảnh người dùng upload rồi thu nhỏ về tối đa 768px cạnh dài — vẫn đủ nét để
// AI đánh giá nhưng không gửi nguyên ảnh gốc (có thể vài MB) lên server.
export function downscaleImageFile(file: File, maxSize = 768): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải ảnh hợp lệ."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Trình duyệt không hỗ trợ canvas."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Gửi ảnh lên server/index.js (proxy /api/rate) — server giữ OPENROUTER_API_KEY, gọi
// model vision trên OpenRouter rồi trả về đúng 1 trong các mức của RATING_LEVELS.
export async function rateImage(image: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch("/api/rate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
    signal,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Lỗi chấm điểm ảnh (${res.status})`);
  }

  const data = await res.json();
  return RATING_LEVELS.includes(data?.level) ? data.level : RATING_LEVELS[0];
}
