import { useEffect, useState } from "react";

const SLOT_WORDS = ["VWBE하게", "SUPEX하게", "One Team으로", "패기있게"];

// 장면이 바뀌는 시각(ms). 0 검은 화면이 걷힘 → 1 서비스 이름 → 2 슬롯 문구 → 3 로그인으로 넘어감
const AT = { title: 1300, slogan: 4200, leave: 9400, done: 10100 };
const SLOT_MS = 950;

/** 로그인 화면 앞에 한 번 보여 주는 도입 화면. 아무 데나 누르면 건너뛴다. */
export default function Intro({ onDone }) {
  const [stage, setStage] = useState(0);
  const [slot, setSlot] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), AT.title),
      setTimeout(() => setStage(2), AT.slogan),
      setTimeout(() => setStage(3), AT.leave),
      setTimeout(onDone, AT.done),
    ];
    return () => timers.forEach(clearTimeout);
  }, [onDone]);

  // 슬롯머신: 문구 장면에서만 단어를 차례로 굴린다
  useEffect(() => {
    if (stage !== 2) return;
    const t = setInterval(() => setSlot((i) => i + 1), SLOT_MS);
    return () => clearInterval(t);
  }, [stage]);

  const word = SLOT_WORDS[slot % SLOT_WORDS.length];
  const prev = SLOT_WORDS[(slot + SLOT_WORDS.length - 1) % SLOT_WORDS.length];

  return (
    <div className={`intro stage-${stage}`} onClick={onDone} role="button" tabIndex={0} aria-label="도입 화면 건너뛰기"
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " " || e.key === "Escape") onDone(); }}>
      {/* 두 장면을 위아래로 쌓아 두고 통째로 밀어 올려 "아래로 내려가는" 전환을 만든다 */}
      <div className="intro-reel">
        <section className="intro-scene intro-title">
          <p>조직문화 활동 기획 에이전트</p>
          <h1>Happy Bonding Memory <span>(HBM)</span></h1>
        </section>
        <section className="intro-scene intro-slogan">
          <p className="intro-slot-line">
            <span className="intro-slot" aria-live="off">
              {slot > 0 && <span key={`out-${slot}`} className="intro-slot-word out">{prev}</span>}
              <span key={`in-${slot}`} className="intro-slot-word in">{word}</span>
            </span>
          </p>
          <h2>행복한 조직문화를 기획하세요!</h2>
        </section>
      </div>
      {/* 검은 막: 가장자리부터 걷히며 가운데로 모인다 */}
      <div className="intro-iris" aria-hidden="true" />
      <span className="intro-skip">화면을 누르면 건너뜁니다</span>
    </div>
  );
}
