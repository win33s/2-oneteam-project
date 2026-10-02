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

export const TONES = { hot: "강력 추천", often: "자주 간 곳", new: "새로운 곳" };

export function ToneLegend() {
  return (
    <ul className="tone-legend">
      {Object.entries(TONES).map(([tone, label]) => <li key={tone}><i className={`tone-dot tone-${tone}`} />{label}</li>)}
    </ul>
  );
}

export function VenueCard({ v, i = 0 }) {
  return (
    <Link to={`/venue/${v.id}`} className={`card tone-${v.tone || "plain"}`} style={{ "--i": Math.min(i, 8) }}>
      <span className="card-dot" title={TONES[v.tone] || ""} aria-label={TONES[v.tone] || undefined}>{v.emoji}</span>
      <div className="card-body">
        <div className="card-tags">
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
