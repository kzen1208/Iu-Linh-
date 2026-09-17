import { useCallback, useEffect, useState } from "react";
import { Mascot } from "page-mascot";

// Vài âm thanh dễ thương, bấm mascot phát ngẫu nhiên 1 trong số này cho đỡ nhàm.
const CLICK_SOUNDS = ["/sounds/cute-uwu.mp3", "/sounds/cute-gugu-gaga.mp3"];

// Ở hero (đầu trang) mascot đứng cố định to, canh giữa trên đầu, làm "vương miện"
// cho banner. Cuộn tới gần khu vực soi/chấm điểm (#camera), mascot thu nhỏ và
// chuyển hẳn xuống góc dưới-phải màn hình (kiểu widget chat nổi), kèm bong bóng
// hướng dẫn cách dùng phía trên đầu nó. Neo ở góc để không bao giờ đè lên tiêu đề
// canh giữa của các section phía dưới, dù cuộn tới đâu.
export function MascotWidget() {
  const [scrolled, setScrolled] = useState(false);
  // < 640px (điện thoại) — mascot to 200px choán gần hết bề ngang màn hình nhỏ, nên thu lại.
  const [isMobile, setIsMobile] = useState(false);
  // Widget neo theo VIEWPORT (fixed góc dưới-phải), nên cuộn xuống sâu tới khu vực chấm điểm
  // — nội dung chữ trên mobile chiếm gần hết bề ngang màn hình — là mascot đè lên chữ ngay.
  // Tới đó vai trò "gợi ý nổi" của nó cũng hết cần thiết rồi nên ẩn hẳn đi trên mobile.
  const [pastRating, setPastRating] = useState(false);

  const onMascotClick = useCallback(() => {
    const src = CLICK_SOUNDS[Math.floor(Math.random() * CLICK_SOUNDS.length)];
    new Audio(src).play().catch(() => {});
  }, []);

  useEffect(() => {
    // Neo theo mốc #camera trước đây khiến mascot to vẫn treo giữa-trên (che tiêu đề bên dưới,
    // vd. "Soi là mê" hay "Gương thần ơi...") suốt quãng cuộn TRƯỚC KHI tới #camera — chỉ cần
    // rời khỏi hẳn đầu trang là thu nhỏ về góc luôn, để không bao giờ đè lên nội dung phía dưới.
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      const rating = document.getElementById("cham-diem");
      setPastRating(rating ? rating.getBoundingClientRect().top < window.innerHeight * 0.6 : false);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (isMobile && pastRating) return null;

  // page-mascot tự render sẵn <button onClick> (có animation nhún + đổi biểu cảm khi bấm) bên
  // trong — bọc thêm <button> ra ngoài sẽ thành button-lồng-button (HTML không hợp lệ, trình
  // duyệt tự tách ra khiến layout/click gãy). Dùng <div onClick> để click vẫn nổi bọt lên bình
  // thường mà không đụng tới cấu trúc nút bên trong.
  return (
    <div
      className={
        "fixed z-[500] flex items-center gap-2 transition-[top,left,right,bottom] duration-300 ease-out " +
        (scrolled ? "right-4 bottom-4 flex-col-reverse" : "left-1/2 top-5 -translate-x-1/2 flex-col")
      }
    >
      {scrolled ? (
        <div
          onClick={onMascotClick}
          className="cursor-pointer rounded-full border border-[#F8E3EB] bg-white p-1 shadow-[0_10px_24px_rgba(255,61,119,0.28)]"
        >
          <Mascot directions="/mascots/ballerina-directions.webp" reactions="/mascots/ballerina-reactions.webp" size={isMobile ? 64 : 88} />
        </div>
      ) : (
        <div onClick={onMascotClick} className="cursor-pointer">
          <Mascot directions="/mascots/ballerina-directions.webp" reactions="/mascots/ballerina-reactions.webp" size={isMobile ? 132 : 200} />
        </div>
      )}
      {/* Bubble rộng tới 220px — trên màn hình điện thoại hẹp nó đè thẳng lên nội dung thẻ
          camera phía sau, nên chỉ hiện trên desktop/tablet, mobile chỉ giữ icon mascot nhỏ gọn. */}
      {scrolled && !isMobile && (
        <div className="ft-mascot-bubble ft-mascot-bubble--down relative max-w-[220px] rounded-2xl border border-[#F8E3EB] bg-white px-4 py-2.5 text-center text-[13px] font-semibold text-[#2B2230] shadow-[0_10px_24px_rgba(255,61,119,0.22)]">
          Bấm "Bật cam" hoặc tải ảnh lên để gương thần ngắm bạn nha!
        </div>
      )}
    </div>
  );
}
