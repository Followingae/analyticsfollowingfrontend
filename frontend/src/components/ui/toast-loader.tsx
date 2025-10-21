import * as React from "react";

interface ToastLoaderProps {
  size?: number;
  text?: string;
}

export const ToastLoader: React.FC<ToastLoaderProps> = ({ size = 40, text = "AI" }) => {
  const letters = text.split("");

  return (
    <div
      className="relative flex items-center justify-center font-inter select-none shrink-0"
      style={{ width: size, height: size }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="inline-block text-white opacity-60 animate-loaderLetter text-xs font-semibold"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          {letter}
        </span>
      ))}

      <div className="absolute inset-0 rounded-full animate-loaderCircle"></div>

      <style jsx>{`
        @keyframes loaderCircle {
          0% {
            transform: rotate(90deg);
            box-shadow:
              0 2px 4px 0 #38bdf8 inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 2px 0.8px rgba(56, 189, 248, 0.4),
              0 0 4px 1.2px rgba(0, 93, 255, 0.3);
          }
          50% {
            transform: rotate(270deg);
            box-shadow:
              0 2px 4px 0 #60a5fa inset,
              0 4px 2px 0 #0284c7 inset,
              0 8px 12px 0 #005dff inset,
              0 0 2px 0.8px rgba(56, 189, 248, 0.4),
              0 0 4px 1.2px rgba(0, 93, 255, 0.3);
          }
          100% {
            transform: rotate(450deg);
            box-shadow:
              0 2px 4px 0 #4dc8fd inset,
              0 4px 6px 0 #005dff inset,
              0 12px 12px 0 #1e40af inset,
              0 0 2px 0.8px rgba(56, 189, 248, 0.4),
              0 0 4px 1.2px rgba(0, 93, 255, 0.3);
          }
        }

        @keyframes loaderLetter {
          0%,
          100% {
            opacity: 0.6;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.1);
          }
          40% {
            opacity: 0.8;
            transform: translateY(0);
          }
        }

        .animate-loaderCircle {
          animation: loaderCircle 4s linear infinite;
        }

        .animate-loaderLetter {
          animation: loaderLetter 2.5s infinite;
        }

        @media (prefers-color-scheme: dark) {
          .animate-loaderCircle {
            box-shadow:
              0 3px 6px 0 #4b5563 inset,
              0 6px 9px 0 #6b7280 inset,
              0 18px 18px 0 #9ca3af inset,
              0 0 1.5px 0.6px rgba(107, 114, 128, 0.3),
              0 0 3px 0.9px rgba(156, 163, 175, 0.2);
          }
        }
      `}</style>
    </div>
  );
};