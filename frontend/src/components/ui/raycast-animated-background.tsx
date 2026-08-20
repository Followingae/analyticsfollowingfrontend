"use client";

import { cn } from "@/lib/utils";
import { memo } from "react";
import UnicornScene from "unicornstudio-react";
import { useContainerSize } from "@/components/open-ai-codex-animated-background";

/**
 * The same scene, on a lighter ground.
 *
 * `useContainerSize` is imported rather than copied. There were two of them, identical and
 * both wrong in the same way (a state update on every observer callback, which re-rendered
 * the scene, which nudged the container, which fired the observer), and a bug fixed in one
 * copy is a bug still shipping in the other.
 */

const Scene = memo(function Scene({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  return (
    <UnicornScene
      production
      projectId="cbmTT38A0CcuYxeiyj5H"
      width={width}
      height={height}
    />
  );
});

export const RaycastAnimatedBackground = memo(
  function RaycastAnimatedBackground() {
    const { containerSize, containerRef } = useContainerSize();
    const ready = containerSize.width > 0 && containerSize.height > 0;

    return (
      <div
        ref={containerRef}
        className={cn("flex h-full w-full flex-col items-center")}
      >
        {ready && (
          <Scene width={containerSize.width} height={containerSize.height} />
        )}
      </div>
    );
  },
);
