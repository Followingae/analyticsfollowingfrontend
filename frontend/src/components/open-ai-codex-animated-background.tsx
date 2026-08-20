"use client";

import { memo, useEffect, useRef, useState } from "react";
import UnicornScene from "unicornstudio-react";

/**
 * The animated background behind Creator Discovery.
 *
 * It used to flicker and fill the console with "Scene already initialized with this
 * configuration, skipping…", dozens of times a second. That was a feedback loop of our own
 * making: the ResizeObserver called setState with a fresh object on every callback, even
 * when the size had not changed, which re-rendered the scene; mounting the scene nudged the
 * container by a sub-pixel; the observer fired again; and round it went.
 *
 * Two things stop it. The measurement is rounded to whole pixels and only committed when it
 * actually changes, so a sub-pixel wobble is not a state update. And the scene is memoised
 * on its dimensions, so a re-render of the card above it does not tear the canvas down and
 * build it again.
 */

/** Measure an element, and only report a size that is genuinely different. */
export const useContainerSize = () => {
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      // Read on the next frame: a ResizeObserver that measures synchronously inside its
      // own callback is how "ResizeObserver loop completed with undelivered notifications"
      // happens.
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const width = Math.round(rect.width);
        const height = Math.round(rect.height);
        setContainerSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return { containerSize, containerRef };
};

/** The scene itself, rebuilt only when its size really changes. */
const Scene = memo(function Scene({
  projectId,
  width,
  height,
}: {
  projectId: string;
  width: number;
  height: number;
}) {
  return (
    <UnicornScene production projectId={projectId} width={width} height={height} />
  );
});

export const OpenAICodexAnimatedBackground = memo(
  function OpenAICodexAnimatedBackground() {
    const { containerSize, containerRef } = useContainerSize();
    const ready = containerSize.width > 0 && containerSize.height > 0;

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ minHeight: "320px", minWidth: "100px" }}
      >
        {ready ? (
          <Scene
            projectId="1grEuiVDSVmyvEMAYhA6"
            width={containerSize.width}
            height={containerSize.height}
          />
        ) : (
          // A flat ground rather than the word "Loading": this sits behind a card the
          // client can already read and click.
          <div className="h-full w-full bg-black" />
        )}
      </div>
    );
  },
);
