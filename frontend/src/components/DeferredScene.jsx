import { Suspense, useEffect, useRef, useState } from "react";

export default function DeferredScene({
  eager = false,
  fallbackClassName,
  SceneComponent,
  sceneProps,
  wrapperClassName = "",
}) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(eager);

  useEffect(() => {
    if (eager || isReady) {
      return undefined;
    }

    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsReady(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "240px 0px",
        threshold: 0.12,
      },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [eager, isReady]);

  return (
    <div className={wrapperClassName} ref={containerRef}>
      {isReady ? (
        <Suspense fallback={<div className={fallbackClassName} />}>
          <SceneComponent {...sceneProps} />
        </Suspense>
      ) : (
        <div className={fallbackClassName} />
      )}
    </div>
  );
}
