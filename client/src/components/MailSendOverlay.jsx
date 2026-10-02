import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChipBuddy } from "./ChipArt.jsx";

const STEP_MS = 650;

/**
 * 메일 보내기 버튼을 누른 뒤 사내 메일이 나가는 과정을 단계별로 보여 준다.
 * 실제 발송(서버 요청)은 job.run()이 하고, 이 화면은 그 진행을 눈에 보이게 풀어 준다.
 * job: { title, subject, recipients: [{id, name, title}], run: () => Promise }
 */
export default function MailSendOverlay({ job, onClose }) {
  const [stage, setStage] = useState(0); // 0 수신자 확인, 1 메일 작성, 2 서버 전송, 3 완료
  const [sent, setSent] = useState(0);
  const [apiDone, setApiDone] = useState(false);
  const [error, setError] = useState("");
  const started = useRef(false);
  const total = job.recipients.length;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    job.run().then(() => setApiDone(true)).catch((e) => setError(e.message));
    const t1 = setTimeout(() => setStage(1), STEP_MS);
    const t2 = setTimeout(() => setStage(2), STEP_MS * 2);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [job]);

  // 전송 단계: 받는 사람을 한 명씩 "발송됨"으로 바꾼다
  useEffect(() => {
    if (stage !== 2 || sent >= total) return;
    const t = setTimeout(() => setSent((n) => n + 1), Math.max(70, 1300 / Math.max(1, total)));
    return () => clearTimeout(t);
  }, [stage, sent, total]);

  useEffect(() => {
    if (stage === 2 && sent >= total && apiDone) setStage(3);
  }, [stage, sent, total, apiDone]);

  const done = stage === 3;
  const steps = [
    ["조직도에서 받는 사람 확인", `${total}명`],
    ["메일 작성", job.subject],
    ["사내 메일 서버로 전송", `${Math.min(sent, total)}/${total}`],
    ["발송 완료", "메일함에 기록"],
  ];

  return (
    <div className="mail-overlay" role="dialog" aria-modal="true" aria-label={job.title}>
      <div className="mail-modal">
        <header className="mail-modal-head">
          <ChipBuddy className="mail-buddy" />
          <div>
            <p className="eyebrow">HBM 에이전트 → 사내 메일</p>
            <h2>{error ? "발송하지 못했습니다" : done ? `${total}명에게 발송했습니다` : job.title}</h2>
          </div>
        </header>

        <div className={`mail-track ${stage >= 2 ? "go" : ""} ${done ? "done" : ""}`} aria-hidden="true">
          <span className="mail-node">에이전트</span>
          <span className="mail-wire"><i /><b>✉</b></span>
          <span className="mail-node">메일 서버</span>
          <span className="mail-wire"><i /><b>✉</b></span>
          <span className="mail-node">부서원</span>
        </div>

        <ol className="mail-steps">
          {steps.map(([label, detail], i) => (
            <li key={label} className={i < stage || done ? "done" : i === stage ? "now" : ""}>
              <span className="mail-step-dot">{i < stage || done ? "✓" : i + 1}</span>
              <span className="mail-step-label">{label}</span>
              <span className="mail-step-detail">{detail}</span>
            </li>
          ))}
        </ol>

        <div className="mail-progress"><i style={{ width: `${done ? 100 : stage < 2 ? stage * 12 : 24 + (sent / Math.max(1, total)) * 70}%` }} /></div>

        <ul className="mail-recipients">
          {job.recipients.map((r, i) => (
            <li key={r.id} className={i < sent || done ? "sent" : stage >= 0 ? "ready" : ""}>
              {r.name} <small>{r.title}</small>
              <em>{i < sent || done ? "발송됨" : "대기"}</em>
            </li>
          ))}
        </ul>

        {error && <p className="err">{error}</p>}
        <footer className="mail-modal-foot">
          {done && <Link className="btn outline" to="/mailbox">메일함에서 보기</Link>}
          <button className="btn" disabled={!done && !error} onClick={onClose}>{done || error ? "확인" : "발송 중…"}</button>
        </footer>
      </div>
    </div>
  );
}
