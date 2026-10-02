import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { NavLink, Route, Routes, Link, useNavigate } from "react-router-dom";
import { useApi, getSession, clearSession } from "./api.js";
import Login from "./pages/Login.jsx";
import Intro from "./pages/Intro.jsx";
import AgentLog from "./components/AgentLog.jsx";
import Home from "./pages/Home.jsx";
import VenuePage from "./pages/VenuePage.jsx";
import PlanPage from "./pages/PlanPage.jsx";
import VotePage from "./pages/VotePage.jsx";
import History from "./pages/History.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import Explore from "./pages/Explore.jsx";
import Mailbox from "./pages/Mailbox.jsx";
import ReviewForm from "./pages/ReviewForm.jsx";
import Profile from "./pages/Profile.jsx";
import GalleryPage from "./pages/GalleryPage.jsx";

const INTRO_KEY = "hbm.intro";
const introSeen = () => {
  try {
    return sessionStorage.getItem(INTRO_KEY) === "1" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch { return false; }
};
const markIntroSeen = () => { try { sessionStorage.setItem(INTRO_KEY, "1"); } catch { /* 저장을 못 하면 다음 접속 때 다시 보여 준다 */ } };

const BootContext = createContext(null);
export const useBoot = () => useContext(BootContext);

export default function App() {
  const [signedIn, setSignedIn] = useState(() => Boolean(getSession()));
  // 도입 화면은 로그인하지 않은 채 처음 접속했을 때 한 번만 보여 준다 (로그아웃 뒤에는 바로 로그인 화면)
  const [intro, setIntro] = useState(() => !getSession() && !introSeen());
  const endIntro = useCallback(() => { markIntroSeen(); setIntro(false); }, []);
  if (!signedIn && intro) return <Intro onDone={endIntro} />;
  if (!signedIn) return <Login onDone={() => setSignedIn(true)} />;
  return <Shell onLogout={() => { clearSession(); setSignedIn(false); }} />;
}

/** 오른쪽 위 프로필 버튼. 누르면 부서원 선호사항 설정과 로그아웃이 나온다. */
function ProfileMenu({ me, dept, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // 메뉴 밖을 누르거나 Esc를 누르면 닫는다
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="me-menu" ref={ref}>
      <button type="button" className={`me ${open ? "open" : ""}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="avatar">{me.name[0]}</span>
        <span>{me.name}<small>{dept.name}</small></span>
        <i className="me-caret" aria-hidden="true">▾</i>
      </button>
      {open && (
        <div className="me-pop" role="menu">
          <Link role="menuitem" to="/profile" onClick={() => setOpen(false)}>
            <b>부서원 선호사항 설정</b>
            <small>식이 제한 · 음주 · 좋아하는 활동</small>
          </Link>
          <button role="menuitem" type="button" className="me-logout" onClick={onLogout}>
            <b>로그아웃</b>
            <small>처음 로그인 화면으로</small>
          </button>
        </div>
      )}
    </div>
  );
}

function Shell({ onLogout }) {
  const navigate = useNavigate();
  const { data: boot, error, reload } = useApi("/bootstrap");
  const { data: status } = useApi("/status", { intervalMs: 4000 });
  const [logOpen, setLogOpen] = useState(false);

  if (error) return <div className="center-note">서버에 연결할 수 없습니다. <code>npm run dev</code>로 서버가 켜져 있는지 확인해 주세요.</div>;
  if (!boot) return <div className="center-note">불러오는 중…</div>;

  return (
    <BootContext.Provider value={{ ...boot, reloadBoot: reload }}>
      <div className="scroll-progress" aria-hidden="true" />
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">HBM</span>
          <span className="brand-sub">Happy Bonding Memory</span>
        </Link>
        <nav>
          <NavLink to="/" end>추천</NavLink>
          <NavLink to="/plan">새 활동 기획</NavLink>
          <NavLink to="/history">우리 부서 기록</NavLink>
          <NavLink to="/explore">타부서 레퍼런스</NavLink>
          <NavLink to="/mailbox">
            메일함{status?.unread ? <em className="count">{status.unread}</em> : null}
          </NavLink>
          <a href="/erp/expenses" target="_blank" rel="noreferrer">ERP ↗</a>
        </nav>
        <div className="topbar-right">
          <button className="ghost" onClick={() => setLogOpen((v) => !v)}>에이전트 로그</button>
          <ProfileMenu me={boot.me} dept={boot.dept} onLogout={() => { navigate("/"); onLogout(); }} />
          <img className="corp-logo" src="/sk-hynix-logo.jpg" alt="SK hynix" />
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/venue/:id" element={<VenuePage />} />
          <Route path="/gallery/:id" element={<GalleryPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/plan/:id" element={<PlanPage />} />
          <Route path="/vote/:id" element={<VotePage />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<ActivityPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/mailbox" element={<Mailbox />} />
          <Route path="/review/:id" element={<ReviewForm />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<div className="center-note">없는 페이지입니다.</div>} />
        </Routes>
      </main>

      <AgentLog open={logOpen} onClose={() => setLogOpen(false)} />
    </BootContext.Provider>
  );
}
