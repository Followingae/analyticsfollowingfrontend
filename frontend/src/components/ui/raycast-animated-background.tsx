import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import UnicornScene from "unicornstudio-react";

export const useContainerSize = () => {
  const [containerSize, setContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setContainerSize({ width, height });
      }
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { containerSize, containerRef };
};

export const RaycastAnimatedBackground = () => {
  const { containerSize, containerRef } = useContainerSize();

  return (
    <div ref={containerRef} className={cn("w-full h-full flex flex-col items-center")}>
      {containerSize.width > 0 && containerSize.height > 0 && (
        <UnicornScene 
          production={true} 
          projectId="cbmTT38A0CcuYxeiyj5H" 
          width={containerSize.width} 
          height={containerSize.height} 
        />
      )}
    </div>
  );
};