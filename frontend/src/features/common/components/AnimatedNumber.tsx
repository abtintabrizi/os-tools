import { useRef, useLayoutEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

const digitVariants = {
  initial: (animate: boolean) => ({ y: animate ? "100%" : 0 }),
  animate: { y: 0 },
  exit: (animate: boolean) => ({ y: animate ? "-100%" : 0 }),
};

export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const prevRef = useRef(value);
  const shouldAnimate =
    prevRef.current !== value && Math.abs(prevRef.current - value) === 1;

  useLayoutEffect(() => {
    prevRef.current = value;
  }, [value]);

  const str = String(value);

  return (
    <span className={`inline-flex ${className ?? ""}`}>
      {str.split("").map((digit, i) => (
        <span
          key={str.length - 1 - i}
          className="relative overflow-hidden inline-flex leading-none"
        >
          <AnimatePresence mode="popLayout" initial={false} custom={shouldAnimate}>
            <motion.span
              key={digit}
              className="block"
              custom={shouldAnimate}
              variants={digitVariants}
              initial="initial"
              animate="animate"
              exit="exit"
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
