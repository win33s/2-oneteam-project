import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api, useApi } from "../api.js";
import { useBoot } from "../App.jsx";
import { Carousel, VenueCard, ToneLegend } from "../components/VenueCard.jsx";
import { ChipBuddy, Wafer, ChipStack, CircuitLine } from "../components/ChipArt.jsx";

const EXAMPLES = ["이번 달 3만원대 회식 장소 추천해 줘", "다음 달에 몸 쓰는 활동 하고 싶어", "MBTI 같은 문화 활동 2만원 이내"];

export default function Home() {
  const { me, dept, categories, llmEnabled } = useBoot();
  const { data } = useApi("/home");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  async function ask(q) {
    const query = (q ?? text).trim();
    if (!query) return navigate("/plan");
    setBusy(true);
    try {
      const p = await api.post("/agent/parse", { text: query });
      const params = new URLSearchParams({ category: p.category, budget: p.budgetPerHead, slot: p.slot, from: p.from, to: p.to, title: p.title });
      navigate(`/plan?${params}`);
    } finally {
      setBusy(false);
    }
  }

  const pick = data?.rows.find((r) => r.key === "season")?.items[0] || data?.rows.find((r) => r.key === "top")?.items[0];
  const rows = (data?.rows || []).filter((r) => (filter === "all" ? true : r.category === filter));

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{dept.name} · {data?.seasonLabel || ""}{data?.weather ? ` · 오늘 ${data.weather.today.label}` : ""}</p>
          <h1>{me.name} 님,<br />이번 달엔 <em>어떤 기억</em>을 쌓을까요?</h1>
          <p className="lede">다른 부서가 실제로 다녀온 곳과 경비 기록, 참석자 후기를 모아 두었습니다. 날짜 잡기부터 예약, 후기 수집까지 에이전트가 함께합니다.</p>
          <form className="ask" onSubmit={(e) => { e.preventDefault(); ask(); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="예) 다음 달에 2만원대로 몸 쓰는 활동 하고 싶어" />
            <button disabled={busy}>{busy ? "해석 중…" : "기획 시작"}</button>
          </form>
          <div className="examples">
            {EXAMPLES.map((ex) => <button key={ex} className="chip" onClick={() => ask(ex)}>{ex}</button>)}
            <span className="muted small">{llmEnabled ? "Claude가 문장을 해석합니다" : "규칙 기반으로 문장을 해석합니다"}</span>
          </div>
        </div>
        {pick && (
          <div className="hero-side">
          <Wafer className="hero-wafer" />
          <ChipBuddy className="hero-buddy" />
          <VenueCard v={{ ...pick, badge: pick.badge || "이번 시즌 추천" }} className="hero-card" />
          </div>
        )}
      </section>

      <div className="filterbar">
        <button className={`chip ${filter === "all" ? "on" : ""}`} onClick={() => setFilter("all")}>전체 추천</button>
        {Object.entries(categories).map(([key, label]) => (
          <button key={key} className={`chip ${filter === key ? "on" : ""}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
      </div>

      <ToneLegend />
      {!data && <div className="center-note">추천을 불러오는 중…</div>}
      {rows.map((r) => (
        <Carousel
          key={r.key}
          title={r.title}
          hint={r.hint}
          items={r.items}
          action={r.category ? <Link className="link" to={`/plan?category=${r.category}`}>이 유형으로 기획</Link> : null}
        />
      ))}

      {data && (
        <footer className="home-foot">
          <CircuitLine />
          <div className="home-foot-body">
            <ChipStack className="foot-stack" />
            <p><b>한 층씩 쌓아 붙이는 칩처럼,</b><br />우리 부서의 기억도 한 번씩 쌓여 갑니다.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
