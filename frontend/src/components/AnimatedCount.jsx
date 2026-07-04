import { useEffect, useState } from "react";

export default function AnimatedCount({
  value,
  duration = 1200,
  formatter = (nextValue) => nextValue.toString(),
}) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let animationFrameId = 0;
    const start = performance.now();
    const initialValue = displayValue;

    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const easedProgress = 1 - (1 - progress) ** 3;
      const nextValue = Math.round(
        initialValue + (value - initialValue) * easedProgress,
      );

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(animate);
      }
    };

    animationFrameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [duration, value]);

  return <span>{formatter(displayValue)}</span>;
}
