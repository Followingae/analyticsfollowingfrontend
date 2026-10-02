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

/**
 * Can this browser actually give us WebGL?
 *
 * Asked once, before the scene is mounted. Without this the scene library tries to create a
 * context, fails, throws `Cannot read properties of undefined (reading 'gl')`, and tries
 * again — on a loop, filling the console with TextureLoader and Curtains errors for as long
 * as the page is open. Machines with no GPU, a blocked or crashed GPU process, a headless
 * browser, or `prefers-reduced-motion` handled upstream all land here, and none of them
 * should pay for a retry loop behind a decorative background.
 *
 * `null` means "not asked yet", which renders the same quiet ground as "no".
 */
const useWebGLSupported = () => {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(Boolean(gl));
      // Release it immediately; this was a probe, not a renderer.
      const lose = (gl as WebGLRenderingContext | null)?.getExtension?.("WEBGL_lose_context");
      lose?.loseContext?.();
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
};

export const OpenAICodexAnimatedBackground = memo(
  function OpenAICodexAnimatedBackground() {
    const { containerSize, containerRef } = useContainerSize();
    const webgl = useWebGLSupported();
    // A probe can say yes and the scene can still fail — a software renderer satisfies
    // `getContext` and then falls over inside the library, which paints its own message
    // ("Error loading scene. Cannot read properties of undefined (reading 'gl')") straight
    // into the page. A raw library error is not something a client should ever read, least
    // of all across a tile on their home screen, so if no <canvas> has appeared shortly
    // after mounting we take the scene down and keep the quiet ground instead.
    const [sceneFailed, setSceneFailed] = useState(false);
    const shouldMount =
      containerSize.width > 0 && containerSize.height > 0 && webgl === true && !sceneFailed;

    useEffect(() => {
      if (!shouldMount) return;
      const el = containerRef.current;
      if (!el) return;
      const t = setTimeout(() => {
        if (!el.querySelector("canvas")) setSceneFailed(true);
      }, 4000);
      return () => clearTimeout(t);
    }, [shouldMount, containerRef]);

    return (
      <div
        ref={containerRef}
        className="absolute inset-0 h-full w-full"
        style={{ minHeight: "320px", minWidth: "100px" }}
      >
        {shouldMount ? (
          <Scene
            projectId="1grEuiVDSVmyvEMAYhA6"
            width={containerSize.width}
            height={containerSize.height}
          />
        ) : (
          // A flat ground rather than the word "Loading": this sits behind a card the
          // client can already read and click. It was `bg-black`, which put a black slab
          // behind a light-theme card whenever the scene was not up; `bg-muted` belongs to
          // whichever theme is running.
          <div className="h-full w-full bg-muted" />
        )}
      </div>
    );
  },
);
