"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Download } from "lucide-react"

interface AnimatedDownloadButtonProps {
  /** URL (thường là data URL của ảnh đã chụp) sẽ được tải về khi bấm */
  href: string
  /** Tên file khi lưu xuống thiết bị */
  fileName?: string
  /** Nhãn hiện ra khi hover/mở rộng */
  label?: string
  /** Đường kính khi thu gọn (px) */
  size?: number
  /** Độ rộng khi mở rộng lúc hover (px) */
  expandedWidth?: number
  /** Màu nền nút — mặc định theo tông hồng của app */
  color?: string
  className?: string
}

export default function AnimatedDownloadButton({
  href,
  fileName = "download",
  label = "Tải về",
  size = 64,
  expandedWidth = 220,
  color = "#FF3D77",
  className,
}: AnimatedDownloadButtonProps) {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <a href={href} download={fileName} className={className} aria-label={label}>
      <motion.div
        initial={{ width: size, height: size }}
        whileHover={{ width: expandedWidth }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-center overflow-hidden relative shadow-lg"
        style={{ borderRadius: size / 2, height: size, background: color }}
      >
        <motion.div
          className="absolute"
          animate={{
            opacity: isHovered ? 0 : 1,
            scale: isHovered ? 0.8 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          <Download color="#fff" size={Math.round(size * 0.4)} strokeWidth={2.4} />
        </motion.div>

        <motion.div
          className="w-full flex justify-center items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2, delay: isHovered ? 0.1 : 0 }}
        >
          <span className="text-white text-sm font-bold whitespace-nowrap px-2">
            {label}
          </span>
        </motion.div>
      </motion.div>
    </a>
  )
}
