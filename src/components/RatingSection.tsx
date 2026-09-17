import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { LoopingWords } from "./ui/looping-words-with-gsap";
import { downscaleImageFile, rateImage, RATING_LEVELS } from "../lib/rating";

export function RatingSection() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setResult(null);
    setErrorMsg(null);
    setLoading(true);
    try {
      const dataUrl = await downscaleImageFile(file);
      setPreview(dataUrl);
      const level = await rateImage(dataUrl);
      setResult(level);
    } catch (e: any) {
      setErrorMsg(e?.message || "Không chấm điểm được ảnh này, thử lại nha.");
    } finally {
      setLoading(false);
    }
  }, []);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => handleFile(e.target.files?.[0]);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  return (
    <section id="cham-diem" className="mx-auto max-w-[1080px] px-5 py-16">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={
            "relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[22px] border border-[#F8E3EB] bg-gradient-to-br from-[#FFE3EC] to-[#FFF6EC] text-center shadow-[0_16px_36px_rgba(255,61,119,0.14)] transition-transform hover:scale-[1.01]" +
            (!preview ? " ft-recording" : "")
          }
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onInputChange} />
          {preview ? (
            <img src={preview} alt="Ảnh bạn đã tải lên" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <>
              <Sparkles className="ft-sparkle-drift absolute left-6 top-6 text-[#FF9EBF]" size={18} />
              <Sparkles className="ft-sparkle-drift absolute bottom-8 right-8 text-[#FF6B9B]" size={14} style={{ animationDelay: "0.9s" }} />
              <span className="grid h-14 w-14 place-items-center rounded-full border border-white/80 bg-white/60 text-[#2B2230]">
                <Upload size={26} />
              </span>
              <span className="text-[15px] font-semibold text-[#2B2230]">Bấm hoặc kéo ảnh vào đây</span>
              <span className="max-w-[80%] text-xs text-[#7A7180]">Chọn một tấm ảnh của bạn, gương thần sẽ tự chấm nha</span>
            </>
          )}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-white/75 text-sm font-semibold text-[#2B2230]">
              <Loader2 className="animate-spin" size={18} />
              Đang chấm điểm…
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="flex flex-wrap items-baseline gap-2 text-[22px] font-extrabold text-[#2B2230]">
            <span>Gương thần thấy bạn</span>
            <LoopingWords words={RATING_LEVELS} />
          </h2>
          <p className="text-sm leading-relaxed text-[#7A7180]">
            Tải một tấm ảnh lên, AI sẽ tự ngắm và chấm cho bạn một lời khen — gương thần chỉ khen thôi, không có mức
            "xấu" đâu nha.
          </p>

          {result && (
            <div className="ft-meme-pop inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-[#FF6B9B] to-[#FF3D77] px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(255,61,119,0.35)]">
              <Sparkles size={16} />
              {result}
            </div>
          )}
          {errorMsg && <div className="text-sm font-semibold text-[#7A2B24]">{errorMsg}</div>}
        </div>
      </div>
    </section>
  );
}
