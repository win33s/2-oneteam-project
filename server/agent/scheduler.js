// 날짜 추천: 선택한 부서원의 캘린더와 부서 과제 일정을 보고 기간 안의 모든 날짜에 상태와 점수를 매긴다.
// 화면은 이 결과를 달력으로 그린다. 중요한 과제 일정과 겹치는 날은 "불가"로 표시하고 투표 후보에서 뺀다.
import { ymd, parseYmd, addDays, diffDays, dateLabel } from "../util.js";

// 데모용 공휴일 (실서비스에서는 사내 캘린더의 휴일 정보를 사용)
const HOLIDAYS = new Set(["2026-10-05", "2026-10-09", "2026-12-25", "2027-01-01"]);

const WEEKDAY_BONUS = { dinner: [0, -3, 2, 4, 6, -4, 0], lunch: [0, 0, 3, 3, 3, 2, 0], allday: [0, -2, 0, 2, 4, 6, 0] };

// 참석 가능 비율이 이 값보다 낮으면 "어려움(빨강)"으로 본다
const HARD_RATIO = 0.8;

export function recommendDates(db, { memberIds, from, to, slot = "dinner", deptId }) {
  const members = db.employees.filter((e) => memberIds.includes(e.id));
  const events = db.calendar.filter((ev) => memberIds.includes(ev.empId));
  const milestones = db.milestones.filter((m) => m.deptId === deptId);
  const important = milestones.filter((m) => m.important);
  const days = [];

  for (let d = parseYmd(from); ymd(d) <= to; d = addDays(d, 1)) {
    const date = ymd(d);
    const dow = d.getDay();
    const base = { date, label: dateLabel(date), total: members.length };
    if (dow === 0 || dow === 6 || HOLIDAYS.has(date)) {
      days.push({ ...base, kind: "off", reason: HOLIDAYS.has(date) ? "공휴일" : "주말" });
      continue;
    }

    const conflicts = [];
    for (const m of members) {
      const ev = events.find((e) => e.empId === m.id && e.from <= date && date <= e.to);
      if (ev) conflicts.push({ empId: m.id, name: m.name, title: m.title, type: ev.type });
    }
    const available = members.length - conflicts.length;
    const ratio = available / Math.max(1, members.length);

    const blockedBy = important.find((m) => m.from <= date && date <= m.to);
    if (blockedBy) {
      days.push({ ...base, kind: "blocked", status: "red", score: 0, available, conflicts, notes: [{ tone: "warn", text: `중요 과제 일정: ${blockedBy.title}` }] });
      continue;
    }

    // 참석 가능 비율을 기본 점수로 삼고, 요일·과제 일정 가산점이 들어갈 여유를 남긴다
    let score = ratio * 84 + 6;
    const notes = [];
    let caution = false;

    if (conflicts.some((c) => c.title === "팀장")) {
      score -= 15;
      caution = true;
      notes.push({ tone: "warn", text: "팀장 일정과 겹침" });
    }
    for (const ms of milestones) {
      if (ms.from <= date && date <= ms.to) { score -= 25; caution = true; notes.push({ tone: "warn", text: `과제 일정과 겹침: ${ms.title}` }); continue; }
      const before = diffDays(ms.from, date);
      const after = diffDays(date, ms.to);
      if (before === 1) { score -= ms.important ? 18 : 8; caution = true; notes.push({ tone: "warn", text: `다음 날 과제 일정: ${ms.title}` }); }
      else if (after === 1) { score += 5; notes.push({ tone: "good", text: `${ms.title} 끝난 다음 날` }); }
    }
    const bonus = WEEKDAY_BONUS[slot]?.[dow] ?? 0;
    score += bonus;
    if (bonus >= 4) notes.push({ tone: "good", text: slot === "allday" ? "종일 활동에 좋은 요일" : "참석률이 높은 요일" });
    if (!conflicts.length) notes.push({ tone: "good", text: "전원 참석 가능" });

    // 초록: 전원 가능하고 걸리는 일정 없음 / 노랑: 일부 불참 또는 주의할 일정 / 빨강: 불참이 많음
    const status = ratio < HARD_RATIO ? "red" : conflicts.length || caution ? "yellow" : "green";
    days.push({ ...base, kind: "open", status, score: Math.max(0, Math.min(100, Math.round(score))), available, conflicts, notes });
  }

  const candidates = days.filter((x) => x.kind === "open").sort((a, b) => b.score - a.score || (a.date < b.date ? -1 : 1)).slice(0, 6);
  const excluded = important
    .filter((m) => m.to >= from && m.from <= to)
    .map((m) => ({ title: m.title, from: m.from, to: m.to, label: m.from === m.to ? dateLabel(m.from) : `${dateLabel(m.from)} ~ ${dateLabel(m.to)}` }));
  return { days, candidates, excluded };
}
