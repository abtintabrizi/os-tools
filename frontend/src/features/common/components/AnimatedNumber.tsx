import { AnimatePresence, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const str = String(value);

  return (
    <span className={`inline-flex ${className ?? ""}`}>
      {str.split("").map((digit, i) => (
        <span
          key={str.length - 1 - i}
          className="relative overflow-hidden inline-flex leading-none"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              className="block"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.4, ease: [0.25, 0, 0.25, 1] }}
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}
