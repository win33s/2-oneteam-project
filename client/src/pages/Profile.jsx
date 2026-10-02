import { useState } from "react";
import { api } from "../api.js";
import { useBoot } from "../App.jsx";

const DIETS = ["채식", "해산물 불가", "매운 음식 불가"];
const ALCOHOL = ["좋아함", "조금", "안 마심"];

/** 여러 개를 고르는 작은 드롭다운 */
function MultiDrop({ value, options, empty, onChange, summary, children }) {
  const labels = options.filter(([k]) => value.includes(k)).map(([, l]) => l);
  const text = summary ?? labels.join(", ");
  return (
    <details className="mini-dd">
      <summary>{text || <span className="muted">{empty}</span>}</summary>
      <div className="mini-dd-menu">
        {options.map(([k, l]) => (
          <label key={k}>
            <input type="checkbox" checked={value.includes(k)} onChange={() => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k])} />
            {l}
          </label>
        ))}
        {children}
      </div>
    </details>
  );
}

/** 드롭다운 안의 직접 입력 칸. 입력을 마치고 칸을 벗어나거나 Enter를 누르면 저장한다. */
function FreeText({ label, value, placeholder, onSave }) {
  const [text, setText] = useState(value);
  const commit = () => { if (text.trim() !== value) onSave(text.trim()); };
  return (
    <div className="mini-dd-free">
      <span>{label}</span>
      <input value={text} placeholder={placeholder} onChange={(e) => setText(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }} />
    </div>
  );
}

export default function Profile() {
  const { me, dept, employees, categories, reloadBoot } = useBoot();
  const members = employees.filter((e) => e.deptId === me.deptId);
  const likeOptions = Object.entries(categories);

  const update = async (emp, patch) => {
    await api.put(`/employees/${emp.id}/prefs`, { ...emp.prefs, ...patch });
    reloadBoot();
  };

  const dietSummary = (p) =>
    [...p.diet, p.allergy && `알레르기: ${p.allergy}`, p.dietEtc && `기타: ${p.dietEtc}`].filter(Boolean).join(", ");

  return (
    <div className="page">
      <p className="eyebrow">{dept.name}</p>
      <h1 className="page-title">부서원 선호 프로필</h1>
      <p className="muted">바꾸면 바로 저장되고, 다음 장소 추천부터 반영됩니다.</p>
      <section className="panel">
        <div className="table-wrap profile-table">
          <table>
            <thead><tr><th>이름</th><th>식이 제한</th><th>음주</th><th>좋아하는 활동 유형</th></tr></thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className={m.id === me.id ? "mine" : ""}>
                  <td><b>{m.name}</b> <span className="muted small">{m.title}</span>{m.id === me.id && <em className="tag">나</em>}</td>
                  <td>
                    <MultiDrop value={m.prefs.diet} options={DIETS.map((d) => [d, d])} empty="없음" summary={dietSummary(m.prefs)} onChange={(diet) => update(m, { diet })}>
                      <FreeText label="알레르기:" value={m.prefs.allergy || ""} placeholder="예) 땅콩, 갑각류" onSave={(allergy) => update(m, { allergy })} />
                      <FreeText label="기타" value={m.prefs.dietEtc || ""} placeholder="예) 돼지고기 안 먹음" onSave={(dietEtc) => update(m, { dietEtc })} />
                    </MultiDrop>
                  </td>
                  <td>
                    <select className="mini-select" value={m.prefs.alcohol} onChange={(e) => update(m, { alcohol: e.target.value })}>
                      {ALCOHOL.map((a) => <option key={a}>{a}</option>)}
                    </select>
                  </td>
                  <td><MultiDrop value={m.prefs.likes} options={likeOptions} empty="선택 안 함" onChange={(likes) => update(m, { likes })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
