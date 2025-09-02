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

export const OpenAICodexAnimatedBackground = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });

      }
    };

    // Initial measurement
    updateDimensions();

    // Set up observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen for window resize
    window.addEventListener('resize', updateDimensions);

    // Retry after a short delay in case initial measurement failed
    const timeout = setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" style={{ minHeight: '320px', minWidth: '100px' }}>
      {dimensions.width > 0 && dimensions.height > 0 ? (
        <UnicornScene 
          production={true} 
          projectId="1grEuiVDSVmyvEMAYhA6" 
          width={dimensions.width} 
          height={dimensions.height} 
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <span className="text-white text-sm">Loading animation...</span>
        </div>
      )}
    </div>
  );
};

