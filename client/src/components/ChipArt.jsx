// 반도체 일러스트. 모두 인라인 SVG라 이미지 파일 없이 색과 움직임을 CSS로 다룬다.

const RED = "#E4002B";
const ORANGE = "#F47B20";
const AMBER = "#FDB515";
const INK = "#2A211C";

function Face({ cx, cy, scale = 1 }) {
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <g className="chip-eyes" fill={INK}>
        <ellipse cx="-13" cy="0" rx="3.6" ry="4.6" />
        <ellipse cx="13" cy="0" rx="3.6" ry="4.6" />
      </g>
      <circle cx="-11.6" cy="-1.6" r="1.2" fill="#fff" />
      <circle cx="14.4" cy="-1.6" r="1.2" fill="#fff" />
      <path d="M-6 7 Q0 13 6 7" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="-22" cy="7" rx="5" ry="3" fill="#fff" opacity=".45" />
      <ellipse cx="22" cy="7" rx="5" ry="3" fill="#fff" opacity=".45" />
    </g>
  );
}

/** 다리(핀)가 달린 칩 캐릭터 */
export function ChipBuddy({ className = "", color = ORANGE }) {
  const pins = [-30, -10, 10, 30];
  return (
    <svg className={`chip-art ${className}`} viewBox="0 0 160 160" role="img" aria-label="웃고 있는 반도체 칩">
      <g className="chip-float">
        <g fill="#D9CFC6">
          {pins.map((p) => <rect key={`t${p}`} x={76 + p} y="18" width="8" height="18" rx="3" />)}
          {pins.map((p) => <rect key={`b${p}`} x={76 + p} y="124" width="8" height="18" rx="3" />)}
          {pins.map((p) => <rect key={`l${p}`} x="18" y={76 + p} width="18" height="8" rx="3" />)}
          {pins.map((p) => <rect key={`r${p}`} x="124" y={76 + p} width="18" height="8" rx="3" />)}
        </g>
        <rect x="30" y="30" width="100" height="100" rx="22" fill={color} />
        <rect x="42" y="42" width="76" height="76" rx="14" fill="#fff" opacity=".16" />
        <circle cx="48" cy="48" r="4" fill="#fff" opacity=".7" />
        <Face cx={80} cy={80} />
      </g>
    </svg>
  );
}

// 햄버거 속 재료. [이름, 높이, 색]
const LETTUCE = ["lettuce", 5, "#7CC243"];
const PATTY = ["patty", 8, "#6B3A1E"];
const CHEESE = ["cheese", 4, "#FFC629"];
const ONION = ["onion", 4, "#F4DDF2"];
const TOMATO = ["tomato", 5, "#E53B2C"];
// 빵 2단 + 속 22단 = 24단
const FILLINGS = [LETTUCE, PATTY, CHEESE, ONION, TOMATO, LETTUCE, PATTY, CHEESE, ONION, TOMATO, LETTUCE, PATTY, CHEESE, ONION, TOMATO, LETTUCE, PATTY, CHEESE, ONION, TOMATO, LETTUCE, PATTY];
const GAP = 1.2;
const TOP_BUN = 44;
const BOTTOM_BUN = 16;

function Filling({ kind, y, h, color }) {
  if (kind === "lettuce") {
    // 양상추: 양옆으로 삐져나온 물결 모양
    let d = `M24 ${y + h}`;
    for (let x = 24; x < 196; x += 12) d += ` q6 ${h * 0.9} 12 0`;
    d += ` V${y + 1} H24 Z`;
    return <path d={d} fill={color} />;
  }
  if (kind === "cheese")
    return (
      <g fill={color}>
        <rect x="28" y={y} width="164" height={h} rx="1.5" />
        <path d={`M52 ${y + h} l9 7 9 -7z M150 ${y + h} l8 6 8 -6z`} />
      </g>
    );
  if (kind === "onion") return <rect x="36" y={y} width="148" height={h} rx={h / 2} fill={color} stroke="#C99BCB" strokeWidth="1" />;
  if (kind === "tomato") return <rect x="34" y={y} width="152" height={h} rx={h / 2} fill={color} />;
  return (
    <g>
      <rect x="30" y={y} width="160" height={h} rx="4" fill={color} />
      <rect x="38" y={y + 1.5} width="144" height="1.6" rx=".8" fill="#fff" opacity=".18" />
    </g>
  );
}

/**
 * 24단으로 쌓아 붙인 메모리 칩. HBM의 Bonding을 햄버거 모양으로 그렸다.
 * 맨 위·맨 아래는 빵, 가운데 22단은 양상추·패티·치즈·양파·토마토가 차례로 쌓인다.
 */
export function ChipStack({ className = "" }) {
  let y = TOP_BUN + GAP;
  const layers = FILLINGS.map(([kind, h, color]) => {
    const layer = { kind, h, color, y };
    y += h + GAP;
    return layer;
  });
  const bottomY = y;
  const height = bottomY + BOTTOM_BUN + 22;
  const count = layers.length + 2;

  return (
    <svg className={`chip-art ${className}`} viewBox={`0 0 220 ${height}`} role="img" aria-label="햄버거처럼 24단으로 쌓인 메모리 칩">
      <ellipse cx="110" cy={height - 9} rx="78" ry="8" fill="#000" opacity=".14" />

      {/* 아래 빵 (1단) */}
      <g className="stack-layer" style={{ "--i": 0 }}>
        <path d={`M32 ${bottomY} H188 V${bottomY + 6} Q188 ${bottomY + BOTTOM_BUN} 172 ${bottomY + BOTTOM_BUN} H48 Q32 ${bottomY + BOTTOM_BUN} 32 ${bottomY + 6} Z`} fill="#E0963F" />
        <rect x="40" y={bottomY + 2} width="140" height="2.4" rx="1.2" fill="#fff" opacity=".3" />
      </g>

      {/* 속 22단: 아래에서부터 차례로 쌓인다 */}
      {layers.map((l, i) => (
        <g key={i} className="stack-layer" style={{ "--i": count - 2 - i }}>
          <Filling {...l} />
          {/* 층 사이를 잇는 범프 */}
          {l.kind === "patty" && [62, 94, 126, 158].map((x) => <circle key={x} cx={x} cy={l.y + l.h / 2} r="1.5" fill="#fff" opacity=".75" />)}
        </g>
      ))}

      {/* 위 빵 (24단) */}
      <g className="stack-layer" style={{ "--i": count - 1 }}>
        <path d={`M30 ${TOP_BUN} Q30 4 110 4 Q190 4 190 ${TOP_BUN} Z`} fill="#EDA550" />
        <path d="M46 26 Q60 10 110 10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".35" />
        <g fill="#FFF3D6">
          <ellipse cx="74" cy="15" rx="4" ry="2" transform="rotate(-24 74 15)" />
          <ellipse cx="110" cy="10" rx="4" ry="2" />
          <ellipse cx="146" cy="15" rx="4" ry="2" transform="rotate(24 146 15)" />
          <ellipse cx="54" cy="27" rx="4" ry="2" transform="rotate(-38 54 27)" />
          <ellipse cx="166" cy="27" rx="4" ry="2" transform="rotate(38 166 27)" />
        </g>
        <Face cx={110} cy={30} scale={0.8} />
      </g>

      <g className="chip-spark" fill="#fff">
        <path d="M200 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path d={`M16 ${bottomY - 40} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z`} opacity=".8" />
      </g>
    </svg>
  );
}

/** 다이가 격자로 놓인 웨이퍼 */
export function Wafer({ className = "" }) {
  const dies = [];
  for (let r = 0; r < 7; r++)
    for (let c = 0; c < 7; c++) {
      const x = 22 + c * 17, y = 22 + r * 17;
      if (Math.hypot(x + 7 - 80, y + 7 - 80) < 54) dies.push({ x, y, k: (r * 3 + c * 5) % 7 });
    }
  return (
    <svg className={`chip-art ${className}`} viewBox="0 0 160 160" role="img" aria-label="웨이퍼">
      <g className="wafer-spin">
        <circle cx="80" cy="80" r="68" fill="#FFE9D2" stroke={ORANGE} strokeWidth="3" />
        <path d="M72 146 h16 l-8 -8z" fill="#fff" />
        {dies.map((d, i) => (
          <rect key={i} x={d.x} y={d.y} width="14" height="14" rx="3" fill={d.k === 0 ? RED : d.k < 3 ? AMBER : ORANGE} opacity={d.k === 0 ? 1 : 0.75} />
        ))}
      </g>
    </svg>
  );
}

/** 화면 구분용 회로 선 */
export function CircuitLine({ className = "" }) {
  return (
    <svg className={`circuit-line ${className}`} viewBox="0 0 600 40" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 20 H120 L140 6 H250 L270 20 H360 L380 34 H470 L490 20 H600" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeDasharray="6 8" className="circuit-dash" />
      {[120, 250, 360, 470].map((x, i) => <circle key={x} cx={x} cy={i % 2 ? 6 : 20} r="4" fill={i % 2 ? RED : AMBER} />)}
    </svg>
  );
}
