// Built using Hyperiux Vault (Harmonic Wave Edition - Fixed URLs)
"use client";

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionValueEvent,
  type MotionValue,
} from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconCamera } from "../icons";
import AnimatedDownloadButton from "./download-hover-button";

const SCALE: Partial<Record<number, number>> = {
  1: 0.88,
  2: 0.78,
  3: 0.88,
  4: 0.78,
  5: 0.78,
  6: 0.88,
  7: 0.88,
  8: 0.68,
};
const s = (i: number) => SCALE[i] ?? 1;

// Vị trí trải bài theo hình sóng — mỗi ô sẽ được lấp bằng ảnh người dùng tự
// chụp ở phần soi gương phía trên (xem HarmonicWave bên dưới), không còn dùng
// ảnh xe mẫu cố định nữa.
type CardLayout = Omit<StackSpreadCard, "item">;

const LAYOUT: CardLayout[] = [
  {
    waveOffset: { x: -36, y: -12 },
    waveRotate: -6,
    target: { x: -22, y: -36, rotate: -4, scale: s(8), w: 16, h: 21 },
    targetSm: { x: -22, y: -40 },
    z: 2,
  },
  {
    waveOffset: { x: -26, y: 12 },
    waveRotate: -3,
    target: { x: 34, y: -32, rotate: 6, scale: s(7), w: 17, h: 30 },
    targetSm: { x: 22, y: -40 },
    z: 3,
  },
  {
    waveOffset: { x: -16, y: -16 },
    waveRotate: 0,
    target: { x: -38, y: -4, rotate: -2, scale: s(6), w: 14, h: 30 },
    targetSm: { x: -22, y: -19 },
    z: 4,
  },
  {
    waveOffset: { x: -6, y: 14 },
    waveRotate: 3,
    target: { x: 4, y: -34, rotate: 3, scale: s(5), w: 24, h: 28 },
    targetSm: { x: 22, y: -19 },
    z: 5,
  },
  {
    waveOffset: { x: 4, y: -14 },
    waveRotate: -3,
    target: { x: 38, y: 8, rotate: -3, scale: s(4), w: 17, h: 30 },
    targetSm: { x: -22, y: 20 },
    z: 6,
  },
  {
    waveOffset: { x: 14, y: 16 },
    waveRotate: 2,
    target: { x: -26, y: 36, rotate: 5, scale: s(3), w: 21, h: 24 },
    targetSm: { x: 22, y: 20 },
    z: 7,
  },
  {
    waveOffset: { x: 24, y: -12 },
    waveRotate: 5,
    target: { x: 2, y: 38, rotate: -2, scale: s(2), w: 19, h: 25 },
    targetSm: { x: -22, y: 40 },
    z: 8,
  },
  {
    waveOffset: { x: 34, y: 10 },
    waveRotate: 7,
    target: { x: 32, y: 36, rotate: 4, scale: s(1), w: 15, h: 19 },
    targetSm: { x: 22, y: 40 },
    z: 9,
  },
];

const SCATTER_START = 0.12;
const SCATTER_END = 0.85;
const PARALLAX_INTENSITY = 3.0;
const SPRING_CONFIG = { stiffness: 75, damping: 20, mass: 0.8 };
const PROGRESS_SPRING = { stiffness: 90, damping: 30, restDelta: 0.0001 };

const SUB = "Mỗi tấm ảnh bạn chụp ở phần soi gương sẽ trôi nhẹ vào đây như một vũ điệu ánh sáng, lưu giữ trọn khoảnh khắc lung linh của riêng bạn.";

const RESPONSIVE = {
  desktop: {
    scale: null as number | null,
    small: false,
    colX: null as number | null,
    card: null as { w: number; h: number } | null,
  },
  small: {
    scale: 0.72,
    small: true,
    colX: 22,
    card: { w: 40, h: 20 },
  },
};

function useResponsive() {
  const [r, setR] = useState(RESPONSIVE.desktop);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setR(mq.matches ? RESPONSIVE.small : RESPONSIVE.desktop);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);
  return r;
}

function usePointerParallax(active: boolean, enabled: boolean) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, SPRING_CONFIG);
  const y = useSpring(rawY, SPRING_CONFIG);

  useEffect(() => {
    if (!enabled) return;
    if (!active) {
      rawX.set(0);
      rawY.set(0);
      return;
    }

    const onMove = (event: PointerEvent) => {
      rawX.set((event.clientX / window.innerWidth - 0.5) * 2);
      rawY.set((event.clientY / window.innerHeight - 0.5) * 2);
    };
    const onLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [active, enabled, rawX, rawY]);

  return { x, y };
}

export interface StackSpreadItem {
  src?: string;
  alt?: string;
}

export interface StackSpreadTarget {
  x: number;
  y: number;
  rotate: number;
  scale?: number;
  w: number;
  h: number;
}

export interface StackSpreadCard {
  item: StackSpreadItem;
  target: StackSpreadTarget;
  targetSm?: { x: number; y: number };
  waveRotate?: number;
  waveOffset?: { x: number; y: number };
  z?: number;
}

function Card({
  card,
  progress,
  reduce,
  scaleMul,
  isSmall,
  colX,
  fixedCard,
  stackScale,
  cardRadius,
  pointer,
  index,
  total,
  isSpreadActive,
}: {
  card: StackSpreadCard;
  progress: MotionValue<number>;
  reduce: boolean | null;
  scaleMul: number | null;
  isSmall: boolean;
  colX: number | null;
  fixedCard: { w: number; h: number } | null;
  stackScale: number;
  cardRadius: number;
  pointer: { x: MotionValue<number>; y: MotionValue<number> };
  index: number;
  total: number;
  isSpreadActive: boolean;
}) {
  const { item, target } = card;

  const flat = reduce === true;
  const waveRotate = flat ? 0 : card.waveRotate ?? 0;
  const waveOffset = card.waveOffset ?? { x: 0, y: 0 };
  const restScale = scaleMul ?? target.scale ?? 1;

  const sm = isSmall && card.targetSm ? card.targetSm : null;
  const endX = sm ? (colX != null ? Math.sign(sm.x) * colX : sm.x) : target.x;
  const endY = sm ? sm.y : target.y;
  const endRotate = flat || isSmall ? 0 : target.rotate;

  const depthFactor = 0.5 + (index / (total - 1 || 1)) * 0.7;

  const translate = useTransform(
    [progress, pointer.x, pointer.y],
    ([p, px, py]: number[]) => {
      const easeP = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const tx = waveOffset.x + (endX - waveOffset.x) * easeP;
      const ty = waveOffset.y + (endY - waveOffset.y) * easeP;

      const dx = tx - px * PARALLAX_INTENSITY * depthFactor * p;
      const dy = ty - py * PARALLAX_INTENSITY * depthFactor * p;
      return `calc(-50% + ${dx}vw) calc(-50% + ${dy}vh)`;
    }
  );

  const rotate = useTransform(progress, [0, 1], [waveRotate, endRotate]);
  const scale = useTransform(progress, [0, 1], [stackScale, restScale]);
  // thẻ cha có scale hoạt ảnh riêng — nút tải cần "hủy" scale đó để luôn
  // giữ đúng kích thước cố định, không bị co giãn theo thẻ
  const downloadCounterScale = useTransform(scale, (s) => (s ? 1 / s : 1));

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 will-change-transform cursor-pointer"
      style={{
        width: `${fixedCard ? fixedCard.w : target.w}vw`,
        height: `${fixedCard ? fixedCard.h : target.h}vh`,
        zIndex: card.z ?? 1,
        translate,
        rotate,
        scale,
      }}
      whileHover={
        isSpreadActive && !isSmall
          ? { scale: restScale * 1.06, y: -12, zIndex: 100, transition: { type: "spring", stiffness: 300, damping: 20 } }
          : undefined
      }
    >
      <div
        className="relative h-full w-full overflow-hidden shadow-2xl shadow-black/20 dark:shadow-black/50 ring-1 ring-black/10 dark:ring-white/10 transition-shadow duration-300 hover:shadow-cyan-500/20 max-md:rounded-[4vw]"
        style={{ borderRadius: `${cardRadius}px` }}
      >
        {item.src ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-tr from-black/30 dark:from-black/50 via-transparent to-white/10 opacity-70 pointer-events-none z-10" />
            <img
              src={item.src}
              alt={item.alt ?? ""}
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-[0.8vw] bg-gradient-to-br from-[#FFE9F1] to-[#FFF3E6] text-[#D98AA8] max-md:gap-2">
            <div className="flex items-center justify-center rounded-full border border-dashed border-current p-[1.2vw] opacity-70 max-md:p-3">
              <IconCamera size={18} />
            </div>
            <span className="px-2 text-center text-[0.8vw] font-medium leading-snug opacity-80 max-md:text-[2.8vw]">
              Ảnh của bạn
            </span>
          </div>
        )}
      </div>

      {item.src && (
        <motion.div
          className="absolute bottom-0 right-0 z-20 origin-bottom-right"
          style={{ scale: downloadCounterScale }}
          onClick={(e) => e.stopPropagation()}
        >
          <AnimatedDownloadButton
            href={item.src}
            fileName={`guong-than-khoanh-khac-${index + 1}.jpg`}
            label="Tải"
            size={22}
            expandedWidth={78}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

interface StackSpreadStageProps {
  cards: StackSpreadCard[];
  scrollLength?: number;
  bgColor?: string;
  stackScale?: number;
  cardRadius?: number;
  textColor?: string;
  textFadeStart?: number;
  showScrollHint?: boolean;
}

function StackSpreadStage({
  cards,
  scrollLength = 380,
  bgColor,
  stackScale = 0.72,
  cardRadius = 14,
  textColor,
  textFadeStart = 0.28,
  showScrollHint = true,
}: StackSpreadStageProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scale: scaleMul, small: isSmall, colX, card: fixedCard } = useResponsive();

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, PROGRESS_SPRING);

  const progress = useTransform(
    smoothProgress,
    [0, SCATTER_START, SCATTER_END, 1],
    [0, 0, 1, 1]
  );

  const [spread, setSpread] = useState(false);
  useMotionValueEvent(progress, "change", (p) => {
    setSpread((was) => (was ? p > 0.985 : p >= 0.999));
  });

  const parallaxEnabled = reduce !== true && !isSmall;
  const pointer = usePointerParallax(spread, parallaxEnabled);

  const noScale = reduce === true;
  const copyOpacity = useTransform(progress, [textFadeStart, textFadeStart + 0.3], [0, 1]);
  const copyScale = useTransform(progress, [textFadeStart, 0.88], [0.9, 1]);
  const hintOpacity = useTransform(progress, [0, SCATTER_START], [1, 0]);

  return (
    <section
      ref={wrapRef}
      className="relative w-full select-none dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors duration-300"
      style={{ height: `${scrollLength}vh`, ...(bgColor ? { backgroundColor: bgColor } : {}) }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Ambient Dark/Light Mode Glow Background */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 dark:opacity-20 blur-[140px]">
          <div className="w-[45vw] h-[45vw] rounded-full bg-[#FF9EBF] dark:bg-indigo-900 mix-blend-multiply dark:mix-blend-screen" />
        </div>

        {/* Centre Brand Headline */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-[5] flex flex-col items-center justify-center px-6 text-center max-md:px-8"
          style={{
            opacity: copyOpacity,
            scale: noScale ? 1 : copyScale,
          }}
        >
          <h2
            className="w-full whitespace-pre-line text-[4.8vw] font-light tracking-tight max-md:text-[10vw]"
            style={textColor ? { color: textColor } : undefined}
          >
            Bộ Sưu Tập <span className="font-normal text-[#FF3D77] dark:text-indigo-400">Của Riêng Bạn</span>.
          </h2>
          <p
            className="mt-[1.4vw] w-full max-w-[40ch] text-[1.1vw] font-light leading-relaxed tracking-wide max-md:mt-3 max-md:text-[3.6vw] opacity-60"
            style={textColor ? { color: textColor } : undefined}
          >
            {SUB}
          </p>
        </motion.div>

        {/* Cards Wave Stage */}
        <div className="absolute inset-0 z-10">
          {cards.map((card, i) => (
            <Card
              key={i}
              card={card}
              progress={progress}
              reduce={reduce}
              scaleMul={scaleMul}
              isSmall={isSmall}
              colX={colX}
              fixedCard={fixedCard}
              stackScale={stackScale}
              cardRadius={cardRadius}
              pointer={pointer}
              index={i}
              total={cards.length}
              isSpreadActive={spread}
            />
          ))}
        </div>

        {/* Scroll Instruction Hint */}
        {showScrollHint && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-[4vh] z-20 flex flex-col items-center gap-[0.8vh] text-[0.75vw] font-medium uppercase tracking-[0.25em] max-md:bottom-6 max-md:gap-1 max-md:text-[2.6vw]"
            style={{
              opacity: hintOpacity,
              ...(textColor ? { color: textColor } : {}),
            }}
          >
            <span className="opacity-70">Cuộn để cảm nhận</span>
            <div className="w-[1px] h-6 bg-current opacity-30 relative overflow-hidden">
              <motion.div
                className="absolute inset-x-0 top-0 bg-[#FF3D77] dark:bg-indigo-400 h-full"
                animate={{ y: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

export interface HarmonicWaveProps {
  /** Ảnh người dùng tự chụp ở phần soi gương — lấp lần lượt vào từng ô của bố cục. Ô nào chưa có ảnh sẽ hiện placeholder "Ảnh của bạn". */
  photos?: string[];
  scrollLength?: number;
  bgColor?: string;
  stackScale?: number;
  cardRadius?: number;
  textColor?: string;
  textFadeStart?: number;
  showScrollHint?: boolean;
}

export default function HarmonicWave({
  photos,
  scrollLength = 380,
  bgColor,
  stackScale = 0.72,
  cardRadius = 14,
  textColor,
  textFadeStart = 0.28,
  showScrollHint = true,
}: HarmonicWaveProps = {}) {
  const cards: StackSpreadCard[] = useMemo(
    () =>
      LAYOUT.map((layout, i) => ({
        ...layout,
        item: {
          src: photos?.[i],
          alt: photos?.[i] ? `Khoảnh khắc soi gương ${i + 1}` : undefined,
        },
      })),
    [photos]
  );

  return (
    <StackSpreadStage
      cards={cards}
      scrollLength={scrollLength}
      bgColor={bgColor}
      stackScale={stackScale}
      cardRadius={cardRadius}
      textColor={textColor}
      textFadeStart={textFadeStart}
      showScrollHint={showScrollHint}
    />
  );
}
