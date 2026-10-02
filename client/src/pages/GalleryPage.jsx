import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi, dateLabel } from "../api.js";
import { artStyle } from "../components/VenueCard.jsx";

const PEOPLE = ["🧑‍🤝‍🧑", "👨‍👩‍👧‍👦", "🙌", "✌️", "🥳", "📸", "😄", "👏", "🤝", "🎉", "😆", "🫶"];
const CAPTIONS = ["다 같이 한 컷", "시작하기 전에", "한창 진행 중", "웃음이 터진 순간", "마무리 단체 사진", "막내가 찍어 준 사진", "팀장님도 함께", "기념으로 남기기"];

/** 사내 블로그·동아리 게시판의 갤러리를 흉내 낸 화면. 실제 사진 대신 그림 타일을 쓴다. */
export default function GalleryPage() {
  const { id } = useParams();
  const [qs, setQs] = useSearchParams();
  const { data: v, error } = useApi(`/venues/${id}`);
  const [zoom, setZoom] = useState(null);
  if (error) return <div className="center-note">{error}</div>;
  if (!v) return <div className="center-note">불러오는 중…</div>;
  if (!v.photoPosts.length) return <div className="center-note">이 장소에 올라온 단체 사진이 없습니다. <Link to={`/venue/${id}`}>돌아가기</Link></div>;

  const idx = Math.min(v.photoPosts.length - 1, Math.max(0, Number(qs.get("post")) || 0));
  const post = v.photoPosts[idx];
  const title = post.title || `[${post.source}] ${v.name}에서`;
  const photos = Array.from({ length: post.photos }, (_, i) => ({
    i,
    hue: v.hue + i * 37 + idx * 53,
    who: PEOPLE[(i * 5 + idx * 3) % PEOPLE.length],
    caption: CAPTIONS[(i + idx * 2) % CAPTIONS.length],
  }));

  return (
    <div className="page">
      <div className="blog-bar">
        <b>사내 블로그 · 갤러리</b>
        <span>데모용 가상 화면입니다. 실제 서비스에서는 사내 블로그·동아리 게시판의 원본 게시글로 연결됩니다.</span>
      </div>

      <div className="gallery-layout">
        <aside className="panel side">
          <h2>{v.emoji} {v.name}</h2>
          <p className="muted small">단체 사진 게시글 {v.photoPosts.length}건</p>
          <ul className="post-list">
            {v.photoPosts.map((p, i) => (
              <li key={i}>
                <button className={i === idx ? "on" : ""} onClick={() => { setZoom(null); setQs({ post: i }); }}>
                  <b>{p.source}</b>
                  <span>{p.title || `${v.name}에서`}</span>
                  <small>사진 {p.photos}장{p.date ? ` · ${dateLabel(p.date)}` : ""}</small>
                </button>
              </li>
            ))}
          </ul>
          <Link className="btn outline small" to={`/venue/${v.id}`}>← 장소 정보로</Link>
        </aside>

        <section className="panel">
          <p className="eyebrow">{post.source}{post.deptName ? ` · ${post.deptName}` : ""}{post.date ? ` · ${post.date.slice(0, 4)}년 ${dateLabel(post.date)}` : ""}</p>
          <h1 className="page-title">{title}</h1>
          <p className="muted">사진 {post.photos}장 · 사진을 누르면 크게 볼 수 있습니다.</p>
          <ul className="photo-grid">
            {photos.map((p) => (
              <li key={p.i}>
                <button className="photo" style={artStyle(p.hue)} onClick={() => setZoom(p)} aria-label={`사진 ${p.i + 1} 크게 보기`}>
                  <span className="photo-venue">{v.emoji}</span>
                  <span className="photo-who">{p.who}</span>
                  <span className="photo-cap">{p.i + 1}. {p.caption}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {zoom && (
        <div className="mail-overlay" role="dialog" aria-modal="true" onClick={() => setZoom(null)}>
          <figure className="photo-zoom" onClick={(e) => e.stopPropagation()}>
            <div className="photo big" style={artStyle(zoom.hue)}>
              <span className="photo-venue">{v.emoji}</span>
              <span className="photo-who">{zoom.who}</span>
            </div>
            <figcaption>
              <b>{zoom.i + 1} / {post.photos}</b> {zoom.caption}
              <span className="photo-nav">
                <button className="btn small outline" disabled={zoom.i === 0} onClick={() => setZoom(photos[zoom.i - 1])}>이전</button>
                <button className="btn small outline" disabled={zoom.i === photos.length - 1} onClick={() => setZoom(photos[zoom.i + 1])}>다음</button>
                <button className="btn small" onClick={() => setZoom(null)}>닫기</button>
              </span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
