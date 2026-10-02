import { useRef } from "react";
import { Link } from "react-router-dom";
import { won } from "../api.js";

// 장소마다 다른 hue 값을 회사 로고의 빨강~주황~노랑 범위(350°~45°) 안으로 옮겨 쓴다
export const artStyle = (hue) => {
  const h = 350 + (((hue % 360) + 360) % 360) * (55 / 360);
  return {
    // 그라데이션 없이 한 가지 색으로만 칠한다
    background: `hsl(${h + 8} 92% 80%)`,
  };
};

export function Stars({ value }) {
  if (value == null) return <span className="stars none">후기 없음</span>;
  return <span className="stars">★ {value.toFixed(1)}</span>;
}

// 포스트잇 색의 뜻. 음식은 빨강→주황→노랑, 활동은 파랑→남색→보라 순으로 추천 정도가 높다.
export const TONES = {
  "food-1": "음식 · 강력 추천", "food-2": "음식 · 추천", "food-3": "음식 · 보통",
  "act-1": "활동 · 강력 추천", "act-2": "활동 · 추천", "act-3": "활동 · 보통",
  new: "새로운 곳", etc: "기타 (후기 적음)",
};
const CATEGORY_SHORT = { restaurant: "식당", cafe: "카페", activity: "액티비티", culture: "문화", stay: "숙소" };

export function ToneLegend() {
  const scale = (label, tones) => (
    <li>
      <b>{label}</b>
      {tones.map((t) => <i key={t} className={`tone-dot tone-${t}`} />)}
      <span>추천 높음 → 보통</span>
    </li>
  );
  return (
    <ul className="tone-legend">
      {scale("음식", ["food-1", "food-2", "food-3"])}
      {scale("활동", ["act-1", "act-2", "act-3"])}
      <li><i className="tone-dot tone-new" />새로운 곳</li>
      <li><i className="tone-dot tone-etc" />기타 (후기 적음)</li>
    </ul>
  );
}

export function VenueCard({ v, i = 0 }) {
  const tone = v.tone || "etc";
  return (
    <Link to={`/venue/${v.id}`} className={`card tone-${tone}`} style={{ "--i": Math.min(i, 8) }}>
      <span className="card-note" title={TONES[tone]}>
        <span className="card-note-icon">{v.emoji}</span>
        <span className="card-note-label">{CATEGORY_SHORT[v.category] || "기타"}</span>
      </span>
      <div className="card-body">
        <div className="card-tags">
          {v.rank && <span className={`card-rank r${v.rank}`}>{v.rank === 1 ? "👑 " : ""}{v.rank}위</span>}
          {v.badge && <span className="card-badge">{v.badge}</span>}
          {v.visitsMine >= 2 && <span className="card-repeat">우리 부서 {v.visitsMine}회</span>}
        </div>
        <div className="card-kicker">{v.sub} · {v.area}</div>
        <h3>{v.name}</h3>
        <div className="card-foot">
          <div className="card-meta">
            <Stars value={v.myRating ?? v.otherRating ?? v.rating} />
            <span>1인 {won(v.avgPerHead)}</span>
          </div>
          {v.reason && <p className="card-reason">{v.reason}</p>}
        </div>
      </div>
    </Link>
  );
}

export function Carousel({ title, hint, items, action }) {
  const ref = useRef(null);
  const move = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  if (!items?.length) return null;
  return (
    <section className="row">
      <div className="row-head">
        <div>
          <h2>{title}</h2>
          {hint && <p className="muted">{hint}</p>}
        </div>
        <div className="row-ctrl">
          {action}
          <button aria-label="이전" onClick={() => move(-1)}>←</button>
          <button aria-label="다음" onClick={() => move(1)}>→</button>
        </div>
      </div>
      <div className="row-track" ref={ref}>
        {items.map((v, i) => <VenueCard key={`${v.id}-${v.activityId || i}`} v={v} i={i} />)}
      </div>
    </section>
  );
}
