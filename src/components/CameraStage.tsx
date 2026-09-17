import type { RefObject } from "react";
import { S } from "../styles";
import { IconCamera } from "./icons";
import { LiquidMetalButton } from "./ui/liquid-metal-button";
import { TextGenerateEffect } from "./ui/text-generate-effect";

export function CameraStage({
  videoRef,
  canvasRef,
  tracking,
  cameraError,
  modelsLoaded,
  unsupported,
  onToggle,
  compliment,
}: {
  videoRef: RefObject<HTMLVideoElement>;
  canvasRef: RefObject<HTMLCanvasElement>;
  tracking: boolean;
  cameraError: boolean;
  modelsLoaded: boolean;
  unsupported: string | null;
  onToggle: () => void;
  compliment?: string | null;
}) {
  return (
    <div>
      <div style={S.stage}>
        <video ref={videoRef} style={S.video} muted playsInline />
        <canvas ref={canvasRef} style={S.overlay} />

        {tracking && compliment && (
          <div key={compliment} className="ft-compliment" style={S.complimentBadge}>
            <TextGenerateEffect as="span" staggerDuration={0.06} transition={{ duration: 0.35 }}>
              {compliment}
            </TextGenerateEffect>
          </div>
        )}

        {!tracking && (
          <div style={S.stageEmpty}>
            <span style={S.stageEmptyIcon}><IconCamera size={30} /></span>
            <span style={S.stageEmptyText}>
              {cameraError ? "Không truy cập được webcam" : "Bấm nút bên dưới để gương thần ngắm bạn nha"}
            </span>
          </div>
        )}
      </div>

      <div style={S.stageControls}>
        {tracking ? (
          <LiquidMetalButton label="Tắt cam" onClick={onToggle} />
        ) : (
          <LiquidMetalButton label="Bật cam" onClick={onToggle} disabled={!modelsLoaded} />
        )}
      </div>
    </div>
  );
}
