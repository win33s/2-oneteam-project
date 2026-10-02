import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api, useApi, won, dateLabel, addDaysStr } from "../api.js";
import { useBoot } from "../App.jsx";
import { artStyle, Stars } from "../components/VenueCard.jsx";
import MailSendOverlay from "../components/MailSendOverlay.jsx";
import DateCalendar, { CalLegend } from "../components/DateCalendar.jsx";

const SLOTS = { dinner: "저녁", lunch: "점심", allday: "종일" };
const STEPS = ["조건", "날짜", "장소", "확정·예약", "기록"];
const stepOf = (plan) => ({ draft: 1, voting: 1, date_confirmed: 2, confirmed: 3, done: 4 }[plan?.status] ?? 0);

export default function PlanPage() {
  const { id } = useParams();
  return id ? <PlanFlow key={id} id={id} /> : <PlanForm />;
}

function Stepper({ current }) {
  return (
    <ol className="stepper">
      {STEPS.map((s, i) => (
        <li key={s} className={i < current ? "done" : i === current ? "now" : ""}><b>{i + 1}</b>{s}</li>
      ))}
    </ol>
  );
}

/* ---------- 1단계: 조건 입력 + 조직도에서 부서원 선택 ---------- */
function PlanForm() {
  const { today, dept, departments, employees, categories } = useBoot();
  const [qs] = useSearchParams();
  const navigate = useNavigate();
  const { data: plans } = useApi("/plans");
  const [form, setForm] = useState({
    title: qs.get("title") || `${Number(today.split("-")[1])}월 조직문화활동`,
    category: qs.get("category") || "any",
    budgetPerHead: Number(qs.get("budget")) || 0,
    slot: qs.get("slot") || "dinner",
    from: qs.get("from") || addDaysStr(today, 3),
    to: qs.get("to") || addDaysStr(today, 31),
  });
  const [selected, setSelected] = useState(() => new Set(employees.filter((e) => e.deptId === dept.id).map((e) => e.id)));
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const groups = useMemo(() => {
    const out = {};
    for (const d of departments) (out[d.group] ||= []).push(d);
    return out;
  }, [departments]);

  const toggle = (ids, on) => setSelected((prev) => {
    const next = new Set(prev);
    ids.forEach((x) => (on ? next.add(x) : next.delete(x)));
    return next;
  });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const plan = await api.post("/plans", { ...form, memberIds: [...selected], preferVenueId: qs.get("venue") });
      navigate(`/plan/${plan.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <Stepper current={0} />
      <h1 className="page-title">어떤 활동을 준비하나요?</h1>
      <form className="plan-form" onSubmit={submit}>
        <section className="panel">
          <h2>활동 조건</h2>
          <label>제목<input value={form.title} onChange={set("title")} required /></label>
          <div className="field">
            <span>활동 유형</span>
            <div className="chips">
              <button type="button" className={`chip ${form.category === "any" ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, category: "any" }))}>상관없음</button>
              {Object.entries(categories).map(([k, label]) => (
                <button type="button" key={k} className={`chip ${form.category === k ? "on" : ""}`} onClick={() => setForm((f) => ({ ...f, category: k }))}>{label}</button>
              ))}
            </div>
          </div>
          <div className="field-row">
            <label>언제부터<input type="date" value={form.from} onChange={set("from")} required /></label>
            <label>언제까지<input type="date" value={form.to} min={form.from} onChange={set("to")} required /></label>
            <label>시간대
              <select value={form.slot} onChange={set("slot")}>
                {Object.entries(SLOTS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
            <label>1인당 예산 (선택)
              <input type="number" min="0" step="1000" value={form.budgetPerHead || ""} placeholder="예) 30000" onChange={(e) => setForm((f) => ({ ...f, budgetPerHead: Number(e.target.value) }))} />
            </label>
          </div>
          <p className="muted small">개인 프로필에 적어 둔 식이 제한·음주 여부·선호 유형은 장소 추천에 자동으로 반영됩니다.</p>
        </section>

        <section className="panel">
          <h2>참석 대상 <span className="muted">사내 조직도에서 선택 · {selected.size}명</span></h2>
          <div className="org">
            {Object.entries(groups).map(([group, depts]) => (
              <div key={group} className="org-group">
                <h3>{group}</h3>
                {depts.map((d) => {
                  const members = employees.filter((e) => e.deptId === d.id);
                  const count = members.filter((m) => selected.has(m.id)).length;
                  return (
                    <details key={d.id} open={d.id === dept.id}>
                      <summary>
                        <input type="checkbox" checked={count === members.length} ref={(el) => el && (el.indeterminate = count > 0 && count < members.length)}
                          onChange={(e) => toggle(members.map((m) => m.id), e.target.checked)} onClick={(e) => e.stopPropagation()} />
                        {d.name} <span className="muted small">{count}/{members.length}</span>
                      </summary>
                      <div className="org-members">
                        {members.map((m) => (
                          <label key={m.id} className={`person ${selected.has(m.id) ? "on" : ""}`}>
                            <input type="checkbox" checked={selected.has(m.id)} onChange={(e) => toggle([m.id], e.target.checked)} />
                            {m.name} <small>{m.title}</small>
                          </label>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            ))}
          </div>
        </section>

        <button className="btn big" disabled={busy || !selected.size}>{busy ? "캘린더 확인 중…" : "에이전트에게 날짜 추천받기"}</button>
      </form>

      {plans?.length > 0 && (
        <section className="panel">
          <h2>진행 중인 기획</h2>
          <ul className="plan-list">
            {plans.map((p) => (
              <li key={p.id}>
                <Link to={`/plan/${p.id}`}>{p.title}</Link>
                <span className="muted small">{p.date ? dateLabel(p.date) : "날짜 미정"} · {p.venue?.name || "장소 미정"}</span>
                <em className="tag">{STEPS[stepOf(p)]} 단계</em>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* ---------- 2~5단계 ---------- */
function PlanFlow({ id }) {
  const { data: plan, error, setData } = useApi(`/plans/${id}`, { intervalMs: 2500 });
  const { categories, employees } = useBoot();
  const [mailJob, setMailJob] = useState(null);
  if (error) return <div className="center-note">{error}</div>;
  if (!plan) return <div className="center-note">불러오는 중…</div>;
  const step = stepOf(plan);
  // 메일을 보내는 동작은 발송 단계 화면을 띄우고, 서버 응답이 오면 기획 상태를 갱신한다
  const sendMail = (job) => setMailJob({
    ...job,
    recipients: employees.filter((e) => plan.memberIds.includes(e.id)),
    run: async () => setData(await job.run()),
  });

  return (
    <div className="page">
      <Stepper current={step} />
      <div className="plan-head">
        <h1 className="page-title">{plan.title}</h1>
        <p className="muted">
          {categories[plan.category] || "유형 무관"} · {SLOTS[plan.slot]} · {plan.memberIds.length}명
          {plan.budgetPerHead ? ` · 1인당 ${won(plan.budgetPerHead)} 이내` : ""} · <Link to="/plan">조건 다시 잡기</Link>
        </p>
      </div>

      {plan.status === "draft" && <DatePicker plan={plan} onChange={setData} sendMail={sendMail} />}
      {plan.status === "voting" && <PollPanel plan={plan} onChange={setData} />}
      {step >= 2 && (
        <div className="confirmed-line">
          <span>확정 날짜</span><b>{dateLabel(plan.date)} {SLOTS[plan.slot]}</b>
          {plan.venue && <><span>장소</span><b>{plan.venue.emoji} {plan.venue.name}</b></>}
        </div>
      )}
      {plan.status === "date_confirmed" && <VenuePicker plan={plan} sendMail={sendMail} />}
      {step >= 3 && <Confirmed plan={plan} onChange={setData} />}
      {mailJob && <MailSendOverlay job={mailJob} onClose={() => setMailJob(null)} />}
    </div>
  );
}

/** 추천도 막대. 커서를 올리거나 눌러서 포커스를 주면 점수의 뜻과 추천 이유가 말풍선으로 나온다. */
function ScoreBar({ value, reasons = [] }) {
  return (
    <span className="scorebar" tabIndex={0} aria-label={`추천도 ${value}점. 추천 이유 보기`}>
      <span className="score-label">추천도</span>
      <span className="track"><i style={{ width: `${value}%` }} /></span>
      <b>{value}<small>점</small></b>
      <span className="score-tip" role="tooltip">
        <strong>추천도 {value}점 <small>/ 100점</small></strong>
        <span className="score-tip-desc">퍼센트가 아니라 에이전트가 매긴 점수입니다. 이맘때 방문 횟수, 후기, 단체 사진, 날씨, 예산, 부서원 취향을 합쳤습니다.</span>
        <ul>
          {reasons.map((r, k) => <li key={k} className={r.tone}>{r.text}</li>)}
        </ul>
      </span>
    </span>
  );
}

const TONE_TEXT = { green: "가능", yellow: "애매", red: "어려움" };

/** 확정하기 어려운 날짜를 고르면 한 번 더 묻는다 */
function HardDateDialog({ day, detail, onConfirm, onCancel }) {
  return (
    <div className="mail-overlay" role="alertdialog" aria-modal="true" onClick={onCancel}>
      <div className="mail-modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">{day.label}</p>
        <h2>참여 불가능한 인원이 많은데 이 날로 확정할까요?</h2>
        <p className="muted">{detail}</p>
        <footer className="mail-modal-foot">
          <button className="btn outline" onClick={onCancel}>취소</button>
          <button className="btn" onClick={onConfirm}>그래도 확정</button>
        </footer>
      </div>
    </div>
  );
}

/** 달력 오른쪽: 고른 날짜의 사정과 "이 날로 확정" 버튼 */
function DayPanel({ day, tone, children, onConfirm, busy }) {
  if (!day) return <aside className="day-panel empty"><p className="muted">달력에서 날짜를 누르면 그날의 사정과 확정 버튼이 여기에 나옵니다.</p></aside>;
  return (
    <aside className={`day-panel ${tone}`}>
      <span className={`tone-tag ${tone}`}>{TONE_TEXT[tone] || "대기"}</span>
      <h3>{day.label}</h3>
      {children}
      <button className="btn" disabled={busy} onClick={onConfirm}>이 날로 확정</button>
    </aside>
  );
}

function DatePicker({ plan, onChange, sendMail }) {
  const days = plan.calendar || plan.dateCandidates.map((c) => ({ ...c, kind: "open", status: c.conflicts.length ? "yellow" : "green" }));
  const stars = new Set(plan.dateCandidates.slice(0, 3).map((c) => c.date));
  const [picked, setPicked] = useState(() => new Set(plan.dateCandidates.filter((c) => c.status !== "red").slice(0, 3).map((c) => c.date)));
  const [focus, setFocus] = useState(null);
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const day = days.find((d) => d.date === focus);

  const pick = (d) => {
    setFocus(d.date);
    // 투표 후보에는 과제 일정으로 막힌 날을 넣지 않는다
    if (d.kind !== "open") return;
    setPicked((prev) => { const n = new Set(prev); n.has(d.date) && focus === d.date ? n.delete(d.date) : n.add(d.date); return n; });
  };
  const confirm = async () => {
    setAsk(false);
    setBusy(true);
    try { onChange(await api.post(`/plans/${plan.id}/date`, { date: day.date })); } finally { setBusy(false); }
  };

  return (
    <section className="panel">
      <h2>날짜 고르기 <span className="muted">부서원 캘린더와 과제 일정을 달력에 표시했습니다</span></h2>
      <CalLegend items={[["green", "전원 가능 (추천)"], ["yellow", "일부 불참·주의할 일정"], ["red", "불참 많음·중요 과제 일정"]]} />
      <div className="cal-layout">
        <DateCalendar
          days={days}
          onPick={pick}
          cellOf={(d) => d.kind === "off"
            ? { tone: "muted", sub: d.reason, disabled: true }
            : { tone: d.status, sub: d.kind === "blocked" ? "과제 일정" : `${d.available}/${d.total}명`, picked: picked.has(d.date), focused: focus === d.date, star: stars.has(d.date) }}
        />
        <div className="cal-side">
          <DayPanel day={day} tone={day?.status} busy={busy} onConfirm={() => (day.status === "red" ? setAsk(true) : confirm())}>
            <p className="day-count"><b>{day?.available}</b>/{day?.total}명 참석 가능{day?.kind === "open" && <> · 점수 {day.score}</>}</p>
            <div className="notes">
              {day?.notes.map((n, k) => <span key={k} className={`note ${n.tone}`}>{n.text}</span>)}
              {day?.conflicts.map((x) => <span key={x.empId} className="note info">{x.name} {x.type}</span>)}
            </div>
          </DayPanel>
          <div className="poll-box">
            <b>투표로 정하기</b>
            <p className="muted small">달력에서 고른 {picked.size}개 날짜(✓)를 부서원 {plan.memberIds.length}명에게 메일로 보냅니다. 고른 날짜를 다시 누르면 빠집니다.</p>
            <button className="btn outline" disabled={busy || picked.size < 2} onClick={() => sendMail({
              title: "날짜 투표 메일을 보내는 중",
              subject: `[날짜 투표] ${plan.title} 가능한 날짜를 골라 주세요`,
              run: () => api.post(`/plans/${plan.id}/poll`, { dates: [...picked] }),
            })}>고른 날짜로 투표 메일 보내기</button>
          </div>
        </div>
      </div>
      {ask && <HardDateDialog day={day} onCancel={() => setAsk(false)} onConfirm={confirm}
        detail={day.kind === "blocked" ? day.notes[0].text + "과 겹치는 날입니다." : `${day.total}명 중 ${day.conflicts.length}명이 참석하기 어렵습니다: ${day.conflicts.map((c) => `${c.name}(${c.type})`).join(", ")}`} />}
    </section>
  );
}

// 투표 결과로 칸 색을 정한다: 응답자 대부분이 가능하면 초록, 절반 안팎이면 노랑, 적으면 빨강
function voteTone(count, voted) {
  if (!voted) return "wait";
  const ratio = count / voted;
  return ratio >= 0.75 ? "green" : ratio >= 0.45 ? "yellow" : "red";
}

function PollPanel({ plan, onChange }) {
  const poll = plan.poll;
  const tally = new Map(poll.tallies.map((t) => [t.date, t]));
  const days = plan.calendar || poll.tallies.map((t) => ({ date: t.date, label: t.label, kind: "open" }));
  const [focus, setFocus] = useState(null);
  const [ask, setAsk] = useState(false);
  const t = tally.get(focus);
  const tone = t ? voteTone(t.count, poll.votedCount) : null;
  const refresh = async () => onChange(await api.get(`/plans/${plan.id}`));
  const confirm = async () => { setAsk(false); onChange(await api.post(`/plans/${plan.id}/date`, { date: focus })); };

  return (
    <section className="panel">
      <h2>날짜 투표 <span className="live">실시간</span> <span className="muted">{poll.votedCount}/{poll.voterIds.length}명 응답</span></h2>
      <CalLegend items={[["green", "대부분 가능"], ["yellow", "애매함 (절반 안팎)"], ["red", "가능한 사람이 적음"], ["wait", "응답 대기"]]} />
      <div className="cal-layout">
        <DateCalendar
          days={days}
          onPick={(d) => setFocus(d.date)}
          cellOf={(d) => {
            const x = tally.get(d.date);
            if (!x) return { tone: "muted", sub: d.kind === "off" ? d.reason : "", disabled: true };
            return { tone: voteTone(x.count, poll.votedCount), sub: `${x.count}표`, focused: focus === d.date };
          }}
        />
        <div className="cal-side">
          <DayPanel day={t && { label: t.label }} tone={tone} onConfirm={() => (tone === "red" ? setAsk(true) : confirm())}>
            <p className="day-count"><b>{t?.count}</b>/{poll.votedCount}명이 가능하다고 응답</p>
            <div className="bar"><i style={{ width: `${poll.votedCount ? (t?.count / poll.votedCount) * 100 : 0}%` }} /></div>
            <p className="muted small">{t?.voters.join(", ") || "아직 없음"}</p>
          </DayPanel>
          <div className="poll-box">
            <b>응답 현황</b>
            <p className="muted small">
              미응답: {poll.pending.map((p) => p.name).join(", ") || "없음"}
              {poll.pending[0] && <> · <Link to={`/vote/${poll.id}?as=${poll.pending[0].id}`} target="_blank">{poll.pending[0].name} 님 화면에서 직접 투표 ↗</Link></>}
            </p>
            <button className="btn outline" disabled={!poll.pending.length} onClick={async () => { await api.post(`/polls/${poll.id}/simulate`, { count: 3 }); refresh(); }}>
              데모: 부서원 3명 응답 받기
            </button>
          </div>
        </div>
      </div>
      {ask && <HardDateDialog day={{ label: t.label }} onCancel={() => setAsk(false)} onConfirm={confirm}
        detail={`응답한 ${poll.votedCount}명 중 ${t.count}명만 가능하다고 답했습니다.`} />}
    </section>
  );
}

function VenuePicker({ plan, sendMail }) {
  const { data } = useApi(`/plans/${plan.id}/venues`);
  const [open, setOpen] = useState(null);
  if (!data) return <div className="center-note">경비 기록과 후기를 모으는 중…</div>;
  const { recommendations: recs, fresh, weather, advice, preferred } = data;

  const confirm = (v) => sendMail({
    title: "안내 메일을 보내는 중",
    subject: `[안내] ${plan.title} — ${dateLabel(plan.date)} ${v.name}`,
    run: () => api.post(`/plans/${plan.id}/confirm`, { venueId: v.id }),
  });

  return (
    <section className="panel">
      <h2>장소·활동 추천 <span className="muted">이맘때 우리 부서·타부서 경비 기록, 후기, 단체 사진, 날씨, 개인 선호 기준</span></h2>
      <p className="weather-line">{dateLabel(plan.date)} 예보 <b>{weather.label}</b> · {weather.outdoorOk ? "야외 활동도 괜찮습니다" : "실내 위주로 추천합니다"}</p>
      <div className="advice">
        <span className="advice-who">에이전트{advice.engine === "claude" ? " · Claude" : ""}</span>
        <p>{advice.text}</p>
      </div>
      {preferred && preferred.visitsMine >= 2 && (
        <div className="callout warn">
          처음에 고른 장소(<b>{preferred.name}</b>)는 우리 부서가 이미 {preferred.visitsMine}번 다녀왔습니다. 아래에서 아래 “완전히 새로운 제안”도 확인해 보세요.
        </div>
      )}
      <ul className="rec-list">
        {recs.map((v, i) => (
          <li key={v.id} className="rec">
            <div className="rec-art" style={artStyle(v.hue)}><span>{v.emoji}</span><em>{i + 1}</em></div>
            <div className="rec-body">
              <div className="rec-top">
                <div>
                  <div className="card-kicker">{v.sub} · {v.area}</div>
                  <h3><Link to={`/venue/${v.id}`}>{v.name}</Link></h3>
                </div>
                <ScoreBar value={v.score} reasons={v.reasons} />
              </div>
              <div className="rec-meta"><Stars value={v.otherRating ?? v.rating} /> <span>1인 평균 {won(v.avgPerHead)}</span> <span>{v.deptCount}개 부서 방문</span></div>
              {open === v.id && (
                <div className="evidence">
                  <h4>우리 부서·타부서 경비 처리 기록</h4>
                  {v.evidence.expenses.length ? (
                    <table><tbody>
                      {v.evidence.expenses.map((e) => (
                        <tr key={e.docNo}><td>{e.deptName}{e.mine && <em className="tag">우리 부서</em>}</td><td>{dateLabel(e.date)}</td><td>{e.headcount}명</td><td className="num">{won(e.amount)}</td><td>{e.accountName}</td><td>{e.budgetSource}</td></tr>
                      ))}
                    </tbody></table>
                  ) : <p className="muted small">경비 기록이 없습니다.</p>}
                  {v.evidence.reviews.map((r) => <p key={r.id} className="quote">“{r.comment}” <small>{r.deptName} · ★{r.rating}</small></p>)}
                  {v.evidence.tips.map((t, k) => <p key={k} className="quote tip">담당자 팁: {t.text} <small>{t.deptName}</small></p>)}
                  {v.photoCount > 0 && <p className="muted small">단체 사진 게시글 {v.photoCount}건: {[...new Set(v.photoPosts.map((p) => p.source))].join(", ")} · <Link to={`/gallery/${v.id}`} target="_blank">갤러리에서 보기 ↗</Link></p>}
                </div>
              )}
              <div className="rec-actions">
                <button className="link" onClick={() => setOpen(open === v.id ? null : v.id)}>{open === v.id ? "근거 접기" : "추천 근거 보기"}</button>
                <button className="btn small" onClick={() => confirm(v)}>이곳으로 확정하고 안내 메일 보내기</button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {fresh.length > 0 && (
        <>
          <h2 className="sub-h">완전히 새로운 제안 <span className="muted">아직 어느 부서도 가 보지 않은 곳 · 날씨와 취향 기준</span></h2>
          <ul className="fresh-list">
            {fresh.map((v) => (
              <li key={v.id} className="fresh">
                <div className="fresh-art" style={artStyle(v.hue)}>{v.emoji}</div>
                <div className="card-kicker">{v.sub} · {v.area}</div>
                <h3><Link to={`/venue/${v.id}`}>{v.name}</Link></h3>
                <div className="notes">{v.reasons.slice(0, 4).map((r, k) => <span key={k} className={`note ${r.tone}`}>{r.text}</span>)}</div>
                <button className="btn small outline" onClick={() => confirm(v)}>이곳으로 확정하고 안내 메일 보내기</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ReviewAsk({ plan, onChange }) {
  const answer = async (send) => onChange(await api.post(`/plans/${plan.id}/review-form`, { send }));
  if (plan.reviewForm === "scheduled") return <div className="callout good">후기 폼을 작성해 두었습니다. 활동 기록이 올라오면 참석자 {plan.memberIds.length}명에게 자동으로 발송합니다.</div>;
  if (plan.reviewForm === "sent") return <div className="callout good">참석자 {plan.memberIds.length}명에게 후기 폼을 발송했습니다.</div>;
  if (plan.reviewForm === "skip") return <div className="callout info">후기 폼은 보내지 않기로 했습니다. <button className="link" onClick={() => answer(true)}>보내기로 변경</button></div>;
  return (
    <div className="callout ask">
      <b>활동이 끝나면 참석자에게 후기를 묻는 네이버 폼을 작성해 발송할까요?</b>
      <span className="muted small">만족도와 한마디를 묻는 폼입니다. 응답은 다음 추천에 반영됩니다.</span>
      <div className="ask-actions">
        <button className="btn small" onClick={() => answer(true)}>네, 작성해서 발송</button>
        <button className="btn small outline" onClick={() => answer(false)}>아니요</button>
      </div>
    </div>
  );
}

function Confirmed({ plan, onChange }) {
  const done = plan.status === "done";
  return (
    <section className="panel confirmed">
      <h2>{done ? "활동이 기록되었습니다" : "확정되었습니다"}</h2>
      <p>{dateLabel(plan.date)} {SLOTS[plan.slot]} · {plan.venue.name} ({plan.venue.area}) · 부서원 {plan.memberIds.length}명에게 안내 메일을 보냈습니다.</p>
      <ReviewAsk plan={plan} onChange={onChange} />
      <div className="next-actions">
        <a className="next" href={plan.venue.bookingUrl} target="_blank" rel="noreferrer">
          <b>1. 예약하기 ↗</b><span>네이버 지도에서 예약·검색 페이지를 엽니다</span>
        </a>
        <Link className="next" to="/mailbox">
          <b>2. 발송된 메일 확인</b><span>부서원에게 간 안내 메일을 메일함에서 봅니다</span>
        </Link>
        <a className={`next ${done ? "disabled" : ""}`} href={`/erp/new?planId=${plan.id}`} target="_blank" rel="noreferrer">
          <b>3. 활동 후 ERP에 경비 등록 ↗</b><span>{done ? "전표가 이미 감지되었습니다" : "등록하면 에이전트가 10초 안에 감지해 기록으로 올립니다"}</span>
        </a>
        {done ? (
          <Link className="next hot" to={`/history/${plan.activityId}`}><b>4. 기록 보고 코멘트 남기기</b><span>{plan.reviewForm === "sent" ? "참석자에게는 후기 폼이 발송되었습니다" : "담당자 메일로 알림이 갔습니다"}</span></Link>
        ) : (
          <div className="next disabled"><b>4. 기록·후기 수집</b><span>ERP 전표가 올라오면 자동으로 기록됩니다</span></div>
        )}
      </div>
    </section>
  );
}
