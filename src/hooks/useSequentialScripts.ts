import { useEffect, useState } from "react";

// BlazeFace đọc `window.tf` ngay khi thực thi, nên phải nạp TUẦN TỰ — nạp song
// song có thể khiến script chạy trước khi tf.min.js kịp gắn `window.tf`, gây
// lỗi "Cannot find TensorFlow.js".
//
// Cache theo module (không phải theo component): React.StrictMode ở dev double-invoke
// effect (mount → cleanup → mount lại), nên nếu chỉ kiểm tra "đã có thẻ <script> thì coi
// như xong", lần chạy thứ hai sẽ thấy thẻ của lần chạy đầu (đã bị huỷ) NHƯNG vẫn đang tải
// dở, và lại kích hoạt đúng race condition ban đầu. Dùng cache Promise dùng chung để mọi
// lệnh gọi trùng src đều chờ đúng một lần tải, thay vì đoán là đã xong.
const scriptPromiseCache = new Map<string, Promise<void>>();

function loadScriptSequentially(src: string): Promise<void> {
  const cached = scriptPromiseCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") { resolve(); return; }
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error(`Không tải được thư viện: ${src}`)));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => { s.dataset.loaded = "true"; resolve(); };
    s.onerror = () => reject(new Error(`Không tải được thư viện: ${src}`));
    document.body.appendChild(s);
  });

  scriptPromiseCache.set(src, promise);
  return promise;
}

export function useSequentialScripts(sources: string[]) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        for (const src of sources) {
          if (cancelled) return;
          await loadScriptSequentially(src);
        }
        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Lỗi tải thư viện AI.");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { ready, error };
}
