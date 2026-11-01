"use client";

import { useScreens } from "../progress";
import { JONKOPING, LAND_PATH, PORTO, ROUTE, VIEWBOX } from "./europe";
import { voyageState } from "./phase";
import { ROUTE_D, pointAlong, shipTransform } from "./route";
import styles from "./VoyageMap.module.css";

const INK = "#7a5a33";
const ROUTE_RED = "#7a1f1f";

function Compass() {
  return (
    <g data-part="compass" transform="translate(120 150)" stroke={INK} fill="none" strokeWidth={1.5}>
      <circle r={48} />
      <circle r={40} strokeDasharray="2 4" />
      <path d="M0 -62 L9 0 L0 62 L-9 0 Z" fill="#c9b07e" />
      <path d="M-62 0 L0 -9 L62 0 L0 9 Z" fill="#c9b07e" />
      <text y={-70} textAnchor="middle" stroke="none" fill={INK} className={styles.label} fontSize={20}>
        N
      </text>
    </g>
  );
}

function City({ at, name, dx, dy }: { at: [number, number]; name: string; dx: number; dy: number }) {
  return (
    <g>
      <circle cx={at[0]} cy={at[1]} r={7} fill={ROUTE_RED} stroke="#f3e6c8" strokeWidth={2} />
      <text x={at[0] + dx} y={at[1] + dy} className={styles.label} fill="#4a3519" fontSize={30}>
        {name}
      </text>
    </g>
  );
}

export function VoyageMap() {
  const { mapOpacity, routeProgress } = voyageState(useScreens());
  if (mapOpacity === 0) return null;
  const ship = pointAlong(ROUTE, routeProgress);

  return (
    <div className={styles.layer} style={{ opacity: mapOpacity }}>
      <svg
        role="img"
        aria-label="Map: sailing from Porto to Jönköping"
        viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
        className={styles.svg}
      >
        <defs>
          <pattern id="sea" width={14} height={14} patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1={0} y1={0} x2={0} y2={14} stroke={INK} strokeOpacity={0.12} strokeWidth={1} />
          </pattern>
          <mask id="route-reveal" maskUnits="userSpaceOnUse">
            <path
              d={ROUTE_D}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - routeProgress}
              stroke="#fff"
              strokeWidth={14}
              fill="none"
            />
          </mask>
          {/* soft edges: the map fades into the parchment instead of ending in a hard rectangle */}
          <radialGradient id="edge-fade-gradient" r="0.62">
            <stop offset="0.75" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="edge-fade" maskUnits="userSpaceOnUse">
            <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#edge-fade-gradient)" />
          </mask>
        </defs>
        <g mask="url(#edge-fade)">
          <rect width={VIEWBOX.w} height={VIEWBOX.h} fill="url(#sea)" />
          <path d={LAND_PATH} fill="#d9c394" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </g>
        <Compass />
        <path
          d={ROUTE_D}
          mask="url(#route-reveal)"
          fill="none"
          stroke={ROUTE_RED}
          strokeWidth={4}
          strokeDasharray="2 10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <City at={PORTO} name="Porto" dx={-20} dy={44} />
        <City at={JONKOPING} name="Jönköping" dx={-40} dy={-22} />
        <g data-part="ship" transform={shipTransform(ship.x, ship.y, ship.angle)}>
          <g className={styles.bob}>
            <path d="M-16 2 Q0 14 16 2 Z" fill="#6b4423" stroke="#3b2612" strokeWidth={1.5} />
            <rect x={-1} y={-22} width={2} height={24} fill="#3b2612" />
            <rect x={-10} y={-20} width={20} height={14} rx={2} fill="#f3e6c8" stroke="#3b2612" />
            <path d="M0 -18 V-8 M-5 -13 H5" stroke={ROUTE_RED} strokeWidth={2.5} />
          </g>
        </g>
      </svg>
    </div>
  );
}
