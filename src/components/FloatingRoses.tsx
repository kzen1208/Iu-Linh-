import type { CSSProperties } from "react";

// Hoa hồng trôi nổi mờ ảo phía sau nội dung — tạo cảm giác dễ thương, nhẹ nhàng.
type RoseSpec = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: number;
  blur: number;
  opacity: number;
  duration: number;
  delay: number;
  rotate: number;
};

const ROSES: RoseSpec[] = [
  { top: "-4%", left: "-4%", size: 150, blur: 3, opacity: 0.45, duration: 9, delay: 0, rotate: -10 },
  { top: "6%", right: "-5%", size: 110, blur: 4, opacity: 0.32, duration: 11, delay: 1.2, rotate: 14 },
  { top: "18%", left: "18%", size: 70, blur: 6, opacity: 0.16, duration: 10.5, delay: 0.4, rotate: -8 },
  { top: "12%", left: "62%", size: 84, blur: 5, opacity: 0.18, duration: 9.5, delay: 2.4, rotate: 12 },
  { top: "34%", left: "4%", size: 96, blur: 5, opacity: 0.2, duration: 11.5, delay: 1.8, rotate: -18 },
  { top: "30%", right: "10%", size: 78, blur: 6, opacity: 0.16, duration: 10, delay: 0.9, rotate: 20 },
  { top: "40%", left: "46%", size: 64, blur: 6, opacity: 0.18, duration: 8, delay: 1.6, rotate: 22 },
  { bottom: "34%", left: "28%", size: 88, blur: 5, opacity: 0.18, duration: 12.5, delay: 3, rotate: -12 },
  { bottom: "30%", right: "30%", size: 72, blur: 6, opacity: 0.15, duration: 9, delay: 2.2, rotate: 16 },
  { bottom: "8%", left: "1%", size: 90, blur: 5, opacity: 0.3, duration: 10, delay: 0.6, rotate: -16 },
  { bottom: "18%", right: "16%", size: 100, blur: 4, opacity: 0.24, duration: 11, delay: 1.4, rotate: -6 },
  { bottom: "-6%", right: "5%", size: 170, blur: 2, opacity: 0.42, duration: 12, delay: 2, rotate: 8 },
];

const wrapStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  zIndex: 0,
};

export function FloatingRoses() {
  return (
    <div style={wrapStyle} aria-hidden="true">
      {ROSES.map((r, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: r.top,
            left: r.left,
            right: r.right,
            bottom: r.bottom,
            transform: `rotate(${r.rotate}deg)`,
          }}
        >
          <img
            src="/images/rose.png"
            alt=""
            className="ft-rose-float"
            style={{
              display: "block",
              width: r.size,
              height: r.size,
              filter: `blur(${r.blur}px)`,
              opacity: r.opacity,
              animationDuration: `${r.duration}s`,
              animationDelay: `${r.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
