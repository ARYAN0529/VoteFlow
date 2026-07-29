"use client";

import { useEffect, useRef } from "react";

export default function MeteorBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const SPACING = 26;
    const DROP = 90;
    const BEND = 70;
    const CYCLE = 10;
    const METEOR_CHANCE = 0.3;

    const build = () => {
      const W = container.clientWidth;
      const H = container.clientHeight;

      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      svg.innerHTML = "";
      container.querySelectorAll(".meteor").forEach((el) => el.remove());

      const rowCount = Math.ceil((H + 400) / SPACING);

      const buildPath = (offsetY: number) => {
        const x0 = -60;
        const x3 = W + 60;
        const y0 = offsetY;
        const y3 = offsetY + DROP;
        const x1 = W * 0.32;
        const x2 = W * 0.68;
        const y1 = offsetY - BEND;
        const y2 = offsetY + DROP + BEND;
        return `M ${x0},${y0} C ${x1},${y1} ${x2},${y2} ${x3},${y3}`;
      };

      for (let i = 0; i < rowCount; i++) {
        const offsetY = i * SPACING - 200;
        const d = buildPath(offsetY);

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", d);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "rgba(140,150,255,0.16)");
        path.setAttribute("stroke-width", "1");
        svg.appendChild(path);

        if (Math.random() < METEOR_CHANCE) {
          const meteor = document.createElement("div");
          meteor.className = "meteor";
          meteor.style.offsetPath = `path('${d}')`;
          meteor.style.animationDuration = `${CYCLE + Math.random() * 4}s`;
          meteor.style.animationDelay = `${-Math.random() * 20}s`;
          container.appendChild(meteor);
        }
      }
    };

    build();

    const resizeObserver = new ResizeObserver(() => build());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      container.querySelectorAll(".meteor").forEach((el) => el.remove());
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <svg ref={svgRef} className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg" />
      <style jsx global>{`
        .meteor {
          position: absolute;
          top: 0;
          left: 0;
          width: 70px;
          height: 4px;
          border-radius: 5px;
          filter: blur(2px);
          opacity: 0;
          offset-rotate: auto;
          animation-name: meteor-travel;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          background: linear-gradient(
            90deg,
            rgba(255, 90, 90, 0) 0%,
            rgba(255, 90, 90, 0.35) 45%,
            rgba(90, 150, 255, 0.85) 100%
          );
        }

        @keyframes meteor-travel {
          0% {
            offset-distance: 0%;
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          55% {
            offset-distance: 100%;
            opacity: 0;
          }
          100% {
            offset-distance: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}