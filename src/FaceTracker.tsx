import { useCallback, useEffect, useRef, useState } from "react";
import { useSequentialScripts } from "./hooks/useSequentialScripts";
import { AI_SCRIPTS } from "./lib/aiScripts";
import { COMPLIMENTS } from "./lib/compliments";
import { captureFrame, detectEmotion } from "./lib/emotion";
import { pickMeme, type Emotion, type MemeItem } from "./lib/memes";
import { S } from "./styles";
import { IconWarning, IconCamera, IconChevronDown } from "./components/icons";
import { Hero } from "./components/Hero";
import { CameraStage } from "./components/CameraStage";
import { MemePanel } from "./components/MemePanel";
import { RatingSection } from "./components/RatingSection";
import { MascotWidget } from "./components/MascotWidget";
import { LampDemo } from "./components/LampDemo";
import { FloatingRoses } from "./components/FloatingRoses";
import BubbleMenu from "./components/ui/BubbleMenu";
import Rating02 from "./components/ui/rating-02";

const NAV_ITEMS = [
  { label: "trang chủ", href: "#", ariaLabel: "Trang chủ", rotation: -8, hoverStyles: { bgColor: "#FF3D77", textColor: "#ffffff" } },
  { label: "soi gương", href: "#camera", ariaLabel: "Soi gương", rotation: 8, hoverStyles: { bgColor: "#2B2230", textColor: "#ffffff" } },
  { label: "khoảnh khắc", href: "#cham-diem", ariaLabel: "Khoảnh khắc", rotation: -8, hoverStyles: { bgColor: "#FF9EBF", textColor: "#2B2230" } },
];

const RATING_LABELS = ["Xạo quá", "Chưa đúng lắm", "Tạm ổn", "Đúng á", "Xỉu ngang"];
const RATING_NOTES = [
  "Gương thần sẽ khen nhiệt tình hơn nữa nha!",
  "Để gương thần chỉnh lại độ ngọt nha!",
  "Cảm ơn bạn đã ghé gương thần!",
  "Yeah, gương thần nói thật lòng đó!",
  "Chuẩn không cần chỉnh luôn á!",
];

// ============================================================================
// Face Tracking Studio — nhận diện khuôn mặt real-time, chạy hoàn toàn trong
// trình duyệt (không backend, không lưu ảnh).
//
// - BlazeFace: phát hiện khuôn mặt + 6 landmark (2 mắt, mũi, miệng, 2 tai)
// - Vòng lặp requestAnimationFrame: khung + điểm mốc BÁM THEO mặt liên tục
// ============================================================================

export default function FaceTracker() {
  const { ready: libsReady, error: libsError } = useSequentialScripts(AI_SCRIPTS);

  const detectorRef = useRef<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const trackingRef = useRef(false);
  const lastFaceSeenAtRef = useRef<number | null>(null);

  const [unsupported, setUnsupported] = useState<string | null>(null);

  const [status, setStatus] = useState("Đang tải thư viện…");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [fps, setFps] = useState(0);
  const [compliment, setCompliment] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [emotion, setEmotion] = useState<Emotion | null>(null);
  const [meme, setMeme] = useState<MemeItem | null>(null);
  const [emotionError, setEmotionError] = useState<string | null>(null);
  const lastEmotionRef = useRef<Emotion | null>(null);

  // kiểm tra tương thích trình duyệt: WebGL + getUserMedia
  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setUnsupported("Trình duyệt không hỗ trợ getUserMedia (truy cập camera). Hãy dùng Chrome, Edge hoặc Firefox bản mới.");
      return;
    }
    const testCanvas = document.createElement("canvas");
    const gl = testCanvas.getContext("webgl") || testCanvas.getContext("experimental-webgl");
    if (!gl) {
      setUnsupported("Trình duyệt không hỗ trợ WebGL — cần thiết để chạy model AI trong trang này.");
    }
  }, []);

  // báo lỗi rõ ràng nếu không tải được thư viện AI qua CDN (vd. mất mạng)
  useEffect(() => {
    if (libsError) setStatus("Lỗi tải thư viện AI: " + libsError);
  }, [libsError]);

  // init model
  useEffect(() => {
    if (!libsReady || modelsLoaded || unsupported || libsError) return;
    const tf = (window as any).tf;
    (async () => {
      try {
        setStatus("Đang khởi tạo TensorFlow…");
        await tf.ready();
        setStatus("Đang tải bộ nhận diện khuôn mặt…");
        // scoreThreshold mặc định của blazeface là 0.75 — khá gắt, dễ bỏ sót mặt khi
        // ánh sáng yếu hoặc góc mặt hơi nghiêng. Hạ xuống 0.5 để bắt mặt dễ hơn.
        detectorRef.current = await (window as any).blazeface.load({ maxFaces: 10, scoreThreshold: 0.5 });
        setModelsLoaded(true);
        setStatus("Sẵn sàng. Bật webcam để bắt đầu tracking.");
      } catch (e: any) {
        setStatus("Lỗi tải model: " + (e?.message || e));
      }
    })();
  }, [libsReady, modelsLoaded, unsupported, libsError]);

  // ---- VÒNG LẶP TRACKING ----
  const trackLoop = useCallback(async () => {
    // dừng hẳn vòng lặp khi đã tắt cam — tránh trường hợp một khung hình
    // cuối vẫn kịp vẽ mesh xanh SAU khi canvas đã được clear, khiến mesh bị
    // kẹt lại trên màn hình dù đang ở trạng thái chưa tracking
    if (!trackingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const detector = detectorRef.current;
    if (!video || !canvas || !detector || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(trackLoop);
      return;
    }

    const t0 = performance.now();
    const faces = await detector.estimateFaces(video, false);

    // tắt cam ngay trong lúc đang chờ estimateFaces (bất đồng bộ) — bỏ qua,
    // không vẽ mesh của khung hình này nữa để tránh kẹt lại trên canvas
    if (!trackingRef.current) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // BlazeFace thỉnh thoảng bỏ sót mặt 1-2 khung hình dù mặt vẫn ở trong khung (do góc
    // nghiêng nhẹ, chớp mắt…) — nếu setFaceCount thẳng theo faces.length mỗi khung hình,
    // hai effect nhận diện cảm xúc/khen phía dưới (phụ thuộc faceCount) sẽ liên tục bị hủy
    // và reset ngay khi vừa gọi API xong, khiến meme/lời khen không bao giờ kịp hiển thị.
    // Chỉ báo "mất mặt" sau khi thật sự không thấy mặt liên tục quá 700ms.
    const now = performance.now();
    if (faces.length > 0) {
      lastFaceSeenAtRef.current = now;
      setFaceCount(faces.length);
    } else if (lastFaceSeenAtRef.current === null || now - lastFaceSeenAtRef.current > 700) {
      setFaceCount(0);
    }

    for (const face of faces) {
      const [x1, y1] = face.topLeft as number[];
      const [x2, y2] = face.bottomRight as number[];
      const w = x2 - x1, h = y2 - y1;

      // khung bám mặt — kích thước & vị trí bám sát khung mặt phát hiện được mỗi khung hình,
      // nên tự động to/nhỏ theo khoảng cách mặt tới camera
      ctx.save();
      ctx.shadowColor = "rgba(57,255,106,0.6)";
      ctx.shadowBlur = 10;
      ctx.strokeStyle = "#39FF6A";
      ctx.lineWidth = Math.max(1.5, w * 0.006);
      ctx.strokeRect(x1, y1, w, h);
      ctx.restore();
    }

    const dt = performance.now() - t0;
    setFps(Math.round(1000 / Math.max(dt, 1)));
    rafRef.current = requestAnimationFrame(trackLoop);
  }, []);

  const startWebcam = useCallback(async () => {
    if (unsupported) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      videoRef.current!.srcObject = stream;
      await videoRef.current!.play();
      setCameraError(false);
      trackingRef.current = true;
      setTracking(true);
      setStatus("Đang tracking khuôn mặt…");
      rafRef.current = requestAnimationFrame(trackLoop);
    } catch (e: any) {
      setCameraError(true);
      if (e?.name === "NotAllowedError" || e?.name === "PermissionDeniedError" || e?.name === "SecurityError") {
        setStatus("Quyền truy cập camera bị từ chối. Mở cài đặt trình duyệt → Quyền riêng tư → cấp quyền Camera cho trang này rồi thử lại.");
      } else if (e?.name === "NotFoundError" || e?.name === "DevicesNotFoundError") {
        setStatus("Không tìm thấy webcam trên thiết bị này.");
      } else if (e?.name === "NotReadableError") {
        setStatus("Không thể mở webcam — có thể đang được ứng dụng khác sử dụng.");
      } else {
        setStatus("Không truy cập được webcam: " + (e?.message || e));
      }
    }
  }, [trackLoop, unsupported]);

  const stopWebcam = useCallback(() => {
    trackingRef.current = false;
    cancelAnimationFrame(rafRef.current);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    const c = canvasRef.current;
    if (c) c.getContext("2d")!.clearRect(0, 0, c.width, c.height);
    lastFaceSeenAtRef.current = null;
    setTracking(false);
    setFaceCount(0);
    setStatus("Đã dừng tracking.");
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  // khen ngẫu nhiên mỗi khi đang tracking và bắt được mặt — đổi câu vài giây một lần
  useEffect(() => {
    if (!tracking || faceCount === 0) {
      setCompliment(null);
      return;
    }
    const pick = () => {
      setCompliment((prev) => {
        const options = COMPLIMENTS.filter((c) => c !== prev);
        return options[Math.floor(Math.random() * options.length)];
      });
    };
    pick();
    const id = window.setInterval(pick, 3200);
    return () => window.clearInterval(id);
  }, [tracking, faceCount]);

  // nhận diện cảm xúc qua AI (OpenRouter, proxy ở server/index.js) mỗi ~2.2s khi đang
  // tracking và bắt được mặt — chỉ đổi meme khi NHÓM cảm xúc thay đổi, tránh nhấp nháy
  // liên tục vì mỗi lượt poll độc lập với lượt trước
  useEffect(() => {
    if (!tracking || faceCount === 0) {
      setEmotion(null);
      setMeme(null);
      setEmotionError(null);
      lastEmotionRef.current = null;
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const tick = async () => {
      if (inFlight) return;
      const video = videoRef.current;
      if (!video) return;
      const frame = captureFrame(video);
      if (!frame) return;

      inFlight = true;
      try {
        const result = await detectEmotion(frame);
        if (cancelled) return;
        setEmotion(result);
        setEmotionError(null);
        if (lastEmotionRef.current !== result) {
          lastEmotionRef.current = result;
          setMeme(pickMeme(result));
        }
      } catch (e: any) {
        // Lỗi 1 lượt poll (vd. mất mạng, server chưa cấu hình key, hết credit OpenRouter…) —
        // hiện thông báo thân thiện cho người dùng biết thay vì im lặng trông như tính năng bị
        // đứng, còn chi tiết lỗi gốc (vd. JSON lỗi từ OpenRouter) chỉ log ra console để debug,
        // không phơi ra UI. Vẫn tự thử lại ở lượt kế tiếp.
        console.error("[emotion] lỗi nhận diện cảm xúc:", e);
        if (!cancelled) setEmotionError("Gương thần đang bận xíu, thử lại sau nha.");
      } finally {
        inFlight = false;
      }
    };

    tick();
    const id = window.setInterval(tick, 2200);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [tracking, faceCount]);

  return (
    <div style={S.page}>
      <FloatingRoses />
      <style>{`
        @keyframes ft-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,61,119,0.45); } 100% { box-shadow: 0 0 0 12px rgba(255,61,119,0); } }
        .ft-recording { animation: ft-pulse 1.6s ease-out infinite; }
        .ft-grid { display: grid; grid-template-columns: 1.7fr 1fr; gap: 16px; align-items: stretch; }
        @media (max-width: 760px) { .ft-grid { grid-template-columns: 1fr; } }
        @keyframes ft-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
        .ft-scroll-hint { animation: ft-bounce 1.6s ease-in-out infinite; }
        @keyframes ft-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .ft-rose-float { animation-name: ft-bob; animation-timing-function: ease-in-out; animation-iteration-count: infinite; will-change: transform; }
        @keyframes ft-pop { 0% { opacity: 0; transform: translate(-50%, 10px) scale(0.92); } 55% { opacity: 1; transform: translate(-50%, -3px) scale(1.04); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        .ft-compliment { animation: ft-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes ft-meme-pop { 0% { opacity: 0; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
        .ft-meme-pop { animation: ft-meme-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; height: 100%; }
        @keyframes ft-sparkle-drift { 0%, 100% { transform: translateY(0) scale(0.85); opacity: 0.5; } 50% { transform: translateY(-6px) scale(1.15); opacity: 1; } }
        .ft-sparkle-drift { animation: ft-sparkle-drift 2.4s ease-in-out infinite; }
      `}</style>

      <MascotWidget />

      <BubbleMenu
        logo={<IconCamera size={20} />}
        items={NAV_ITEMS}
        menuAriaLabel="Bật/tắt menu"
        menuBg="#ffffff"
        menuContentColor="#2B2230"
        useFixedPosition
      />

      <LampDemo />

      <div style={S.content}>
        <div style={S.wrap}>
          {(unsupported || libsError) && (
            <div style={S.unsupportedBanner}>
              <IconWarning size={16} />
              <span>{unsupported ?? libsError}</span>
            </div>
          )}

          <Hero />

          <div className="ft-grid" id="camera">
            <CameraStage
              videoRef={videoRef}
              canvasRef={canvasRef}
              tracking={tracking}
              cameraError={cameraError}
              modelsLoaded={modelsLoaded}
              unsupported={unsupported}
              onToggle={tracking ? stopWebcam : startWebcam}
              compliment={compliment}
            />
            <MemePanel meme={meme} emotion={emotion} error={emotionError} />
          </div>

          <div style={S.ratingCard}>
            <p style={S.ratingCardTitle}>Gương thần khen vậy, bạn thấy sao nè?</p>
            <Rating02
              value={rating}
              onValueChange={setRating}
              size="md"
              labels={RATING_LABELS}
            />
            {rating > 0 && <p style={S.ratingCardNote}>{RATING_NOTES[rating - 1]}</p>}
          </div>

          <div className="ft-scroll-hint" style={S.scrollHint}>
            <span>Cuộn xuống xem tiếp nha</span>
            <IconChevronDown size={18} />
          </div>
        </div>
      </div>

      <RatingSection />
    </div>
  );
}
