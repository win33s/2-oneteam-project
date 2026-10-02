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

// 쌓인 칩의 층 색 (아래에서 위 순서). 회사 로고의 빨강과 주황만 번갈아 쓴다.
const STACK_COLORS = [RED, ORANGE, RED, ORANGE, RED, ORANGE, RED, ORANGE, RED];
const TOP_COLOR = ORANGE;
const LAYER_H = 16;
const LAYER_STEP = 20;
const TOP_H = 40;

/** 칩을 층층이 쌓아 붙인 모습 (10단). HBM의 Bonding을 그대로 그렸다. */
export function ChipStack({ className = "" }) {
  const n = STACK_COLORS.length;
  // i=0이 맨 아래 층
  const layerY = (i) => TOP_H + 12 + (n - 1 - i) * LAYER_STEP;
  const height = layerY(0) + LAYER_H + 26;

  return (
    <svg className={`chip-art ${className}`} viewBox={`0 0 220 ${height}`} role="img" aria-label="층층이 쌓인 메모리 칩">
      <ellipse cx="110" cy={height - 10} rx="78" ry="9" fill="#000" opacity=".12" />
      {STACK_COLORS.map((color, i) => {
        const y = layerY(i);
        return (
          <g key={i} className="stack-layer" style={{ "--i": i }}>
            {/* 아래층과 이어 붙는 범프 */}
            {i > 0 && [58, 84, 110, 136, 162].map((x) => <circle key={x} cx={x} cy={y + LAYER_H + 2} r="2.6" fill="#fff" opacity=".9" />)}
            <rect x="34" y={y} width="152" height={LAYER_H} rx="7" fill={color} />
            <rect x="42" y={y + 3} width="136" height="4" rx="2" fill="#fff" opacity=".28" />
          </g>
        );
      })}
      <g className="stack-layer" style={{ "--i": n }}>
        {[58, 84, 110, 136, 162].map((x) => <circle key={x} cx={x} cy={TOP_H + 10} r="2.6" fill="#fff" opacity=".9" />)}
        <rect x="34" y="8" width="152" height={TOP_H} rx="14" fill={TOP_COLOR} />
        <rect x="42" y="13" width="136" height="6" rx="3" fill="#fff" opacity=".25" />
        <Face cx={110} cy={29} scale={0.82} />
      </g>
      <g className="chip-spark" fill="#fff">
        <path d="M196 30 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
        <path d="M22 98 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" opacity=".8" />
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
