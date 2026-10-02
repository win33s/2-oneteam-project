const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const pad = (n) => String(n).padStart(2, "0");

/**
 * 기간을 월별 달력으로 그린다.
 * days: 서버가 준 날짜 목록. cellOf(day)가 그 칸의 모양을 정한다:
 *   { tone: "green"|"yellow"|"red"|"muted", sub, disabled, picked, focused, star }
 */
export default function DateCalendar({ days, cellOf, onPick }) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];

  return (
    <div className="cal">
      {months.map((ym) => {
        const [y, m] = ym.split("-").map(Number);
        const lead = new Date(y, m - 1, 1).getDay();
        const count = new Date(y, m, 0).getDate();
        const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => `${ym}-${pad(i + 1)}`)];
        return (
          <div className="cal-month" key={ym}>
            <h3>{y}년 {m}월</h3>
            <div className="cal-grid">
              {WEEK.map((w, i) => <span key={w} className={`cal-dow ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>{w}</span>)}
              {cells.map((date, i) => {
                if (!date) return <span key={`e${i}`} />;
                const day = byDate.get(date);
                const num = Number(date.slice(8));
                if (!day) return <span key={date} className="cal-cell out">{num}</span>;
                const c = cellOf(day);
                return (
                  <button
                    key={date}
                    type="button"
                    disabled={c.disabled}
                    className={`cal-cell ${c.tone} ${c.picked ? "picked" : ""} ${c.focused ? "focused" : ""}`}
                    onClick={() => onPick(day)}
                    aria-pressed={Boolean(c.focused)}
                    aria-label={`${day.label} ${c.sub || ""}`}
                  >
                    <b>{num}</b>
                    {c.star && <i className="cal-star" title="에이전트 추천">★</i>}
                    {c.picked && <i className="cal-check">✓</i>}
                    <small>{c.sub}</small>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CalLegend({ items }) {
  return (
    <ul className="cal-legend">
      {items.map(([tone, text]) => <li key={tone}><i className={`dot ${tone}`} />{text}</li>)}
    </ul>
  );
}
