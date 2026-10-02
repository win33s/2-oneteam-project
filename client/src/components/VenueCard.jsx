import { useRef } from "react";
import { Link } from "react-router-dom";
import { won } from "../api.js";

// 장소마다 다른 hue 값을 회사 로고의 빨강~주황~노랑 범위(350°~45°) 안으로 옮겨 쓴다
export const artStyle = (hue) => {
  const h = 350 + (((hue % 360) + 360) % 360) * (55 / 360);
  return {
    background: `radial-gradient(120% 90% at 85% 10%, hsl(${h + 22} 100% 86%) 0%, transparent 60%), linear-gradient(140deg, hsl(${h + 12} 96% 74%), hsl(${h} 88% 60%))`,
  };
};

export function Stars({ value }) {
  if (value == null) return <span className="stars none">후기 없음</span>;
  return <span className="stars">★ {value.toFixed(1)}</span>;
}

export function VenueCard({ v, i = 0 }) {
  return (
    <Link to={`/venue/${v.id}`} className="card" style={{ "--i": Math.min(i, 8) }}>
      <div className="card-art" style={artStyle(v.hue)}>
        <span className="card-emoji">{v.emoji}</span>
        {v.badge && <span className="card-badge">{v.badge}</span>}
        {v.visitsMine >= 2 && <span className="card-repeat">우리 부서 {v.visitsMine}회</span>}
      </div>
      <div className="card-body">
        <div className="card-kicker">{v.sub} · {v.area}</div>
        <h3>{v.name}</h3>
        <div className="card-meta">
          <Stars value={v.myRating ?? v.otherRating ?? v.rating} />
          <span>1인 {won(v.avgPerHead)}</span>
        </div>
        {v.reason && <p className="card-reason">{v.reason}</p>}
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
