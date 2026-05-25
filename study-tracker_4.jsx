import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const USER_ID = "my-tracker";

const TABS = ["📚 Môn học", "✅ Việc cần làm", "🎯 Mục tiêu", "⏱️ Thời gian", "📝 Soạn bài", "💰 Chi tiêu"];

const initialData = {
  subjects: [
    { id: 1, name: "Toán", color: "#f97316", items: [
      { id: 11, text: "Chương 1: Giới hạn", done: true },
      { id: 12, text: "Chương 2: Đạo hàm", done: false },
      { id: 13, text: "Chương 3: Tích phân", done: false },
    ]},
    { id: 2, name: "Văn", color: "#8b5cf6", items: [
      { id: 21, text: "Tác phẩm: Vợ nhặt", done: true },
      { id: 22, text: "Tác phẩm: Chí Phèo", done: false },
    ]},
    { id: 3, name: "Anh", color: "#06b6d4", items: [
      { id: 31, text: "Unit 5: Environment", done: true },
      { id: 32, text: "Unit 6: Technology", done: false },
    ]},
  ],
  todos: [
    { id: 1, text: "Ôn tập chương 3 Toán", done: false, priority: "cao" },
    { id: 2, text: "Viết bài luận Văn", done: false, priority: "trung bình" },
    { id: 3, text: "Học từ vựng Unit 5", done: true, priority: "thấp" },
  ],
  goals: [
    { id: 1, text: "Đạt 8.0 học kỳ này", deadline: "2025-06-30", done: false },
    { id: 2, text: "Hoàn thành khóa học lập trình", deadline: "2025-07-15", done: false },
  ],
  studyLog: [],
  lessons: [
    { id: 1, subject: "Toán", lesson: "Chương 4: Đạo hàm", status: "chưa soạn" },
    { id: 2, subject: "Văn", lesson: "Tác phẩm: Vợ nhặt", status: "đang soạn" },
    { id: 3, subject: "Anh", lesson: "Unit 6: Technology", status: "hoàn thành" },
  ],
  finance: {
    month: new Date().toISOString().slice(0, 7),
    income: [
      { id: 1, label: "Dạy kèm Toán", amount: 0 },
      { id: 2, label: "Dạy kèm Lý", amount: 0 },
      { id: 3, label: "Lương làm việc", amount: 0 },
    ],
    debt: [
      { id: 1, label: "Seasy", amount: 0, paid: false },
      { id: 2, label: "HD", amount: 0, paid: false },
      { id: 3, label: "Spay", amount: 0, paid: false },
      { id: 4, label: "Nợ ngoài app", amount: 0, paid: false },
    ],
    expenses: [
      { id: 1, label: "Xăng xe", amount: 0, min: 500000 },
      { id: 2, label: "Tiết kiệm", amount: 0, min: 300000 },
    ],
    outings: [],
  },
};

const COLORS = ["#f97316", "#8b5cf6", "#06b6d4", "#10b981", "#f43f5e", "#facc15"];
const PRIORITY_COLOR = { cao: "#f43f5e", "trung bình": "#facc15", thấp: "#10b981" };
const STATUS_COLOR = { "chưa soạn": "#f43f5e", "đang soạn": "#facc15", "hoàn thành": "#10b981" };

export default function App() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("tracker_data")
      .select("data")
      .eq("user_id", USER_ID)
      .single()
      .then(({ data: row }) => {
        if (row) setData(row.data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (loading) return;
    supabase
      .from("tracker_data")
      .upsert({ user_id: USER_ID, data, updated_at: new Date() });
  }, [data, loading]);

  // Subjects
  const [newSubject, setNewSubject] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState(COLORS[3]);
  const [newSubjectItem, setNewSubjectItem] = useState({});   // { [subjectId]: string }
  const [expandedSubject, setExpandedSubject] = useState(null);

  // Todos
  const [newTodo, setNewTodo] = useState("");
  const [newPriority, setNewPriority] = useState("trung bình");

  // Goals
  const [newGoal, setNewGoal] = useState("");
  const [newDeadline, setNewDeadline] = useState("");

  // Study Log
  const [studyDate, setStudyDate] = useState(new Date().toISOString().slice(0, 10));
  const [studyMinutes, setStudyMinutes] = useState("");
  const [studyNote, setStudyNote] = useState("");

  // Lessons
  const [newLesson, setNewLesson] = useState("");
  const [newLessonSubject, setNewLessonSubject] = useState("");
  const [newLessonStatus, setNewLessonStatus] = useState("chưa soạn");

  // Finance
  const [newIncomeLabel, setNewIncomeLabel] = useState("");
  const [newDebtLabel, setNewDebtLabel] = useState("");
  const [newExpenseLabel, setNewExpenseLabel] = useState("");
  const [newExpenseMin, setNewExpenseMin] = useState("");
  const [newOutingDate, setNewOutingDate] = useState(new Date().toISOString().slice(0, 10));
  const [newOutingNote, setNewOutingNote] = useState("");
  const [newOutingAmount, setNewOutingAmount] = useState("");

  const totalStudyMinutes = data.studyLog.reduce((a, b) => a + b.minutes, 0);
  const doneTodos = data.todos.filter((t) => t.done).length;
  const doneGoals = data.goals.filter((g) => g.done).length;
  const doneLessons = data.lessons.filter((l) => l.status === "hoàn thành").length;
  const totalSubjectItems = data.subjects.reduce((a, s) => a + s.items.length, 0);
  const doneSubjectItems = data.subjects.reduce((a, s) => a + s.items.filter(i => i.done).length, 0);

  return (
    <div style={{ fontFamily: "'Segoe UI', sans-serif", background: "#0f172a", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: "24px 20px 0", borderBottom: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#f8fafc", letterSpacing: "-0.5px" }}>
            📖 KAQ soneG Tracker
          </h1>
          <p style={{ margin: "4px 0 16px", fontSize: 13, color: "#64748b" }}>Theo dõi tiến trình cuộc đời</p>

          {/* Stats bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 0, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { label: "Bài học", value: `${doneSubjectItems}/${totalSubjectItems}`, icon: "📚" },
              { label: "Việc xong", value: `${doneTodos}/${data.todos.length}`, icon: "✅" },
              { label: "Mục tiêu", value: `${doneGoals}/${data.goals.length}`, icon: "🎯" },
              { label: "Thời gian", value: `${Math.floor(totalStudyMinutes / 60)}h${totalStudyMinutes % 60}m`, icon: "⏱️" },
              { label: "Bài soạn", value: `${doneLessons}/${data.lessons.length}`, icon: "📝" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#1e293b", borderRadius: 10, padding: "8px 14px", minWidth: 80, textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 18 }}>{s.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#38bdf8" }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 0, marginTop: 16, overflowX: "auto" }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setTab(i)}
                style={{
                  background: tab === i ? "#38bdf8" : "transparent",
                  color: tab === i ? "#0f172a" : "#94a3b8",
                  border: "none", padding: "8px 14px", cursor: "pointer",
                  fontSize: 13, fontWeight: tab === i ? 700 : 400,
                  borderRadius: "8px 8px 0 0", whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 16px" }}>

        {/* TAB 0: Môn học */}
        {tab === 0 && (
          <div>
            {/* Thêm môn mới */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <input value={newSubject} onChange={e => setNewSubject(e.target.value)}
                placeholder="Tên môn học..." onKeyDown={e => {
                  if (e.key === "Enter" && newSubject.trim()) {
                    const id = Date.now();
                    setData(d => ({ ...d, subjects: [...d.subjects, { id, name: newSubject.trim(), color: newSubjectColor, items: [] }] }));
                    setNewSubject("");
                    setExpandedSubject(id);
                  }
                }}
                style={inputStyle} />
              <div style={{ display: "flex", gap: 4 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setNewSubjectColor(c)}
                    style={{ width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer", border: newSubjectColor === c ? "2px solid white" : "2px solid transparent" }} />
                ))}
              </div>
              <button onClick={() => {
                if (!newSubject.trim()) return;
                const id = Date.now();
                setData(d => ({ ...d, subjects: [...d.subjects, { id, name: newSubject.trim(), color: newSubjectColor, items: [] }] }));
                setNewSubject("");
                setExpandedSubject(id);
              }} style={btnStyle}>+ Thêm môn</button>
            </div>

            {data.subjects.map(s => {
              const done = s.items.filter(i => i.done).length;
              const total = s.items.length;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const isOpen = expandedSubject === s.id;

              return (
                <div key={s.id} style={{ background: "#1e293b", borderRadius: 12, marginBottom: 12, overflow: "hidden", border: `1px solid #243347` }}>
                  {/* Header môn */}
                  <div onClick={() => setExpandedSubject(isOpen ? null : s.id)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer", userSelect: "none" }}>
                    <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: 15, flex: 1, color: "#f8fafc" }}>{s.name}</span>
                    <span style={{ fontSize: 12, color: "#64748b" }}>{done}/{total} bài</span>
                    {/* mini progress */}
                    <div style={{ width: 60, height: 6, background: "#0f172a", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: s.color, borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                    <span style={{ fontSize: 12, color: s.color, fontWeight: 700, minWidth: 34, textAlign: "right" }}>{pct}%</span>
                    <button onClick={e => { e.stopPropagation(); setData(d => ({ ...d, subjects: d.subjects.filter(x => x.id !== s.id) })); }}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 15, marginLeft: 4 }}>✕</button>
                    <span style={{ color: "#475569", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* List bài học */}
                  {isOpen && (
                    <div style={{ borderTop: "1px solid #243347", padding: "10px 14px" }}>
                      {s.items.length === 0 && (
                        <div style={{ fontSize: 13, color: "#475569", marginBottom: 10 }}>Chưa có bài học nào. Thêm bài bên dưới!</div>
                      )}
                      {s.items.map(item => (
                        <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #1a2740" }}>
                          <input type="checkbox" checked={item.done}
                            onChange={() => setData(d => ({
                              ...d,
                              subjects: d.subjects.map(x => x.id === s.id
                                ? { ...x, items: x.items.map(i => i.id === item.id ? { ...i, done: !i.done } : i) }
                                : x)
                            }))}
                            style={{ width: 15, height: 15, accentColor: s.color, cursor: "pointer", flexShrink: 0 }} />
                          <span style={{
                            flex: 1, fontSize: 14,
                            color: item.done ? "#475569" : "#e2e8f0",
                            textDecoration: item.done ? "line-through" : "none"
                          }}>{item.text}</span>
                          <button onClick={() => setData(d => ({
                            ...d,
                            subjects: d.subjects.map(x => x.id === s.id
                              ? { ...x, items: x.items.filter(i => i.id !== item.id) }
                              : x)
                          }))} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14 }}>✕</button>
                        </div>
                      ))}

                      {/* Input thêm bài */}
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <input
                          value={newSubjectItem[s.id] || ""}
                          onChange={e => setNewSubjectItem(prev => ({ ...prev, [s.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === "Enter" && (newSubjectItem[s.id] || "").trim()) {
                              setData(d => ({
                                ...d,
                                subjects: d.subjects.map(x => x.id === s.id
                                  ? { ...x, items: [...x.items, { id: Date.now(), text: newSubjectItem[s.id].trim(), done: false }] }
                                  : x)
                              }));
                              setNewSubjectItem(prev => ({ ...prev, [s.id]: "" }));
                            }
                          }}
                          placeholder="Thêm bài học..." style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "6px 10px" }} />
                        <button onClick={() => {
                          const val = (newSubjectItem[s.id] || "").trim();
                          if (!val) return;
                          setData(d => ({
                            ...d,
                            subjects: d.subjects.map(x => x.id === s.id
                              ? { ...x, items: [...x.items, { id: Date.now(), text: val, done: false }] }
                              : x)
                          }));
                          setNewSubjectItem(prev => ({ ...prev, [s.id]: "" }));
                        }} style={{ ...btnStyle, padding: "6px 12px", fontSize: 13 }}>+ Thêm</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {data.subjects.length === 0 && <Empty text="Chưa có môn học nào" />}
          </div>
        )}

        {/* TAB 1: Việc cần làm */}
        {tab === 1 && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input value={newTodo} onChange={e => setNewTodo(e.target.value)}
                placeholder="Thêm việc cần làm..." onKeyDown={e => {
                  if (e.key === "Enter" && newTodo.trim()) {
                    setData(d => ({ ...d, todos: [...d.todos, { id: Date.now(), text: newTodo.trim(), done: false, priority: newPriority }] }));
                    setNewTodo("");
                  }
                }} style={{ ...inputStyle, flex: 1 }} />
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)} style={selectStyle}>
                <option value="cao">🔴 Cao</option>
                <option value="trung bình">🟡 Trung bình</option>
                <option value="thấp">🟢 Thấp</option>
              </select>
              <button onClick={() => {
                if (!newTodo.trim()) return;
                setData(d => ({ ...d, todos: [...d.todos, { id: Date.now(), text: newTodo.trim(), done: false, priority: newPriority }] }));
                setNewTodo("");
              }} style={btnStyle}>+ Thêm</button>
            </div>
            {["cao", "trung bình", "thấp"].map(p => {
              const items = data.todos.filter(t => t.priority === p);
              if (!items.length) return null;
              return (
                <div key={p} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: PRIORITY_COLOR[p], fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                    Ưu tiên {p}
                  </div>
                  {items.map(t => (
                    <div key={t.id} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${PRIORITY_COLOR[p]}` }}>
                      <input type="checkbox" checked={t.done}
                        onChange={() => setData(d => ({ ...d, todos: d.todos.map(x => x.id === t.id ? { ...x, done: !x.done } : x) }))}
                        style={{ width: 16, height: 16, accentColor: PRIORITY_COLOR[p], cursor: "pointer" }} />
                      <span style={{ flex: 1, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#475569" : "#e2e8f0" }}>{t.text}</span>
                      <button onClick={() => setData(d => ({ ...d, todos: d.todos.filter(x => x.id !== t.id) }))}
                        style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>✕</button>
                    </div>
                  ))}
                </div>
              );
            })}
            {data.todos.length === 0 && <Empty text="Chưa có việc cần làm nào" />}
          </div>
        )}

        {/* TAB 2: Mục tiêu */}
        {tab === 2 && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input value={newGoal} onChange={e => setNewGoal(e.target.value)}
                placeholder="Mục tiêu của bạn..." style={{ ...inputStyle, flex: 1 }} />
              <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} style={inputStyle} />
              <button onClick={() => {
                if (!newGoal.trim()) return;
                setData(d => ({ ...d, goals: [...d.goals, { id: Date.now(), text: newGoal.trim(), deadline: newDeadline, done: false }] }));
                setNewGoal(""); setNewDeadline("");
              }} style={btnStyle}>+ Thêm</button>
            </div>
            {data.goals.map(g => {
              const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
              return (
                <div key={g.id} style={{ background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12, borderLeft: `3px solid ${g.done ? "#10b981" : "#38bdf8"}` }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <input type="checkbox" checked={g.done}
                      onChange={() => setData(d => ({ ...d, goals: d.goals.map(x => x.id === g.id ? { ...x, done: !x.done } : x) }))}
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: "#10b981", cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, textDecoration: g.done ? "line-through" : "none", color: g.done ? "#475569" : "#f8fafc" }}>{g.text}</div>
                      {g.deadline && (
                        <div style={{ fontSize: 12, marginTop: 4, color: daysLeft < 0 ? "#f43f5e" : daysLeft < 7 ? "#facc15" : "#64748b" }}>
                          📅 {g.deadline} {daysLeft !== null && `• ${daysLeft < 0 ? "Quá hạn!" : `Còn ${daysLeft} ngày`}`}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setData(d => ({ ...d, goals: d.goals.filter(x => x.id !== g.id) }))}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              );
            })}
            {data.goals.length === 0 && <Empty text="Chưa có mục tiêu nào" />}
          </div>
        )}

        {/* TAB 3: Thời gian học */}
        {tab === 3 && (
          <div>
            <div style={{ background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#94a3b8" }}>Ghi lại thời gian học hôm nay</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input type="date" value={studyDate} onChange={e => setStudyDate(e.target.value)} style={inputStyle} />
                <input type="number" value={studyMinutes} onChange={e => setStudyMinutes(e.target.value)}
                  placeholder="Số phút..." style={{ ...inputStyle, width: 100 }} />
                <input value={studyNote} onChange={e => setStudyNote(e.target.value)}
                  placeholder="Ghi chú..." style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => {
                  if (!studyMinutes || isNaN(+studyMinutes)) return;
                  setData(d => ({ ...d, studyLog: [...d.studyLog, { id: Date.now(), date: studyDate, minutes: +studyMinutes, note: studyNote }] }));
                  setStudyMinutes(""); setStudyNote("");
                }} style={btnStyle}>+ Ghi</button>
              </div>
            </div>

            {/* Tổng kết */}
            <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
              <StatCard label="Tổng thời gian" value={`${Math.floor(totalStudyMinutes / 60)}h ${totalStudyMinutes % 60}m`} color="#38bdf8" />
              <StatCard label="Số buổi học" value={data.studyLog.length} color="#a78bfa" />
              <StatCard label="TB / buổi" value={data.studyLog.length ? `${Math.round(totalStudyMinutes / data.studyLog.length)}m` : "—"} color="#34d399" />
            </div>

            {/* Log */}
            {[...data.studyLog].reverse().map(l => (
              <div key={l.id} style={{ background: "#1e293b", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ color: "#38bdf8", fontWeight: 700 }}>⏱ {l.minutes} phút</span>
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 8 }}>{l.date}</span>
                  {l.note && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{l.note}</div>}
                </div>
                <button onClick={() => setData(d => ({ ...d, studyLog: d.studyLog.filter(x => x.id !== l.id) }))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {data.studyLog.length === 0 && <Empty text="Chưa có buổi học nào được ghi lại" />}
          </div>
        )}

        {/* TAB 4: Soạn bài */}
        {tab === 4 && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input value={newLessonSubject} onChange={e => setNewLessonSubject(e.target.value)}
                placeholder="Môn..." style={{ ...inputStyle, width: 100 }} />
              <input value={newLesson} onChange={e => setNewLesson(e.target.value)}
                placeholder="Tên bài soạn..." style={{ ...inputStyle, flex: 1 }} />
              <select value={newLessonStatus} onChange={e => setNewLessonStatus(e.target.value)} style={selectStyle}>
                <option value="chưa soạn">Chưa soạn</option>
                <option value="đang soạn">Đang soạn</option>
                <option value="hoàn thành">Hoàn thành</option>
              </select>
              <button onClick={() => {
                if (!newLesson.trim()) return;
                setData(d => ({ ...d, lessons: [...d.lessons, { id: Date.now(), subject: newLessonSubject, lesson: newLesson.trim(), status: newLessonStatus }] }));
                setNewLesson(""); setNewLessonSubject("");
              }} style={btnStyle}>+ Thêm</button>
            </div>

            {/* Progress bar tổng */}
            <div style={{ background: "#1e293b", borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>Tiến trình soạn bài: <b style={{ color: "#10b981" }}>{doneLessons}/{data.lessons.length}</b></div>
              <div style={{ background: "#0f172a", borderRadius: 999, height: 8 }}>
                <div style={{ width: data.lessons.length ? `${(doneLessons / data.lessons.length) * 100}%` : "0%", height: "100%", background: "#10b981", borderRadius: 999, transition: "width 0.4s" }} />
              </div>
            </div>

            {data.lessons.map(l => (
              <div key={l.id} style={{ background: "#1e293b", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10, borderLeft: `3px solid ${STATUS_COLOR[l.status]}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "#f8fafc" }}>{l.lesson}</div>
                  {l.subject && <div style={{ fontSize: 12, color: "#64748b" }}>📚 {l.subject}</div>}
                </div>
                <select value={l.status} onChange={e => setData(d => ({ ...d, lessons: d.lessons.map(x => x.id === l.id ? { ...x, status: e.target.value } : x) }))}
                  style={{ ...selectStyle, fontSize: 12, padding: "4px 8px" }}>
                  <option value="chưa soạn">Chưa soạn</option>
                  <option value="đang soạn">Đang soạn</option>
                  <option value="hoàn thành">Hoàn thành</option>
                </select>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: STATUS_COLOR[l.status] + "33", color: STATUS_COLOR[l.status], fontWeight: 700 }}>
                  {l.status}
                </span>
                <button onClick={() => setData(d => ({ ...d, lessons: d.lessons.filter(x => x.id !== l.id) }))}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {data.lessons.length === 0 && <Empty text="Chưa có bài soạn nào" />}
          </div>
        )}

        {/* TAB 5: Chi tiêu */}
        {tab === 5 && (() => {
          const totalIncome = data.finance.income.reduce((a, b) => a + (Number(b.amount) || 0), 0);
          const totalDebt = data.finance.debt.reduce((a, b) => a + (Number(b.amount) || 0), 0);
          const paidDebt = data.finance.debt.filter(d => d.paid).reduce((a, b) => a + (Number(b.amount) || 0), 0);
          const totalExpenses = data.finance.expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
          const totalOutings = data.finance.outings.reduce((a, b) => a + (Number(b.amount) || 0), 0);
          const remaining = totalIncome - totalDebt - totalExpenses - totalOutings;
          const fmt = n => n.toLocaleString("vi-VN") + "đ";

          const updateFinance = (key, val) => setData(d => ({ ...d, finance: { ...d.finance, [key]: val } }));

          return (
            <div>
              {/* Chọn tháng */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>Tháng:</span>
                <input type="month" value={data.finance.month}
                  onChange={e => updateFinance("month", e.target.value)}
                  style={{ ...inputStyle, fontSize: 14 }} />
              </div>

              {/* Tổng quan */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <SummaryCard label="Tổng lương" value={fmt(totalIncome)} color="#10b981" icon="💵" />
                <SummaryCard label="Tổng nợ" value={fmt(totalDebt)} color="#f43f5e" icon="💳" />
                <SummaryCard label="Chi phí" value={fmt(totalExpenses)} color="#f97316" icon="🧾" />
                <SummaryCard label="Còn lại" value={fmt(remaining)} color={remaining >= 0 ? "#38bdf8" : "#f43f5e"} icon="🏦" />
              </div>

              {/* LƯƠNG */}
              <Section title="💵 Tổng lương" total={fmt(totalIncome)} color="#10b981">
                {data.finance.income.map(item => (
                  <div key={item.id} style={finRowStyle}>
                    <span style={{ flex: 1, fontSize: 14, color: "#e2e8f0" }}>{item.label}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number" value={item.amount || ""}
                        onChange={e => updateFinance("income", data.finance.income.map(x => x.id === item.id ? { ...x, amount: e.target.value } : x))}
                        placeholder="0"
                        style={{ ...inputStyle, width: 120, padding: "4px 8px", fontSize: 13, textAlign: "right" }} />
                      <span style={{ fontSize: 12, color: "#475569" }}>đ</span>
                      <button onClick={() => updateFinance("income", data.finance.income.filter(x => x.id !== item.id))}
                        style={delBtn}>✕</button>
                    </div>
                  </div>
                ))}
                {/* Thêm mục lương */}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newIncomeLabel} onChange={e => setNewIncomeLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newIncomeLabel.trim()) {
                        updateFinance("income", [...data.finance.income, { id: Date.now(), label: newIncomeLabel.trim(), amount: 0 }]);
                        setNewIncomeLabel("");
                      }
                    }}
                    placeholder="Tên nguồn thu..." style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "6px 10px" }} />
                  <button onClick={() => {
                    if (!newIncomeLabel.trim()) return;
                    updateFinance("income", [...data.finance.income, { id: Date.now(), label: newIncomeLabel.trim(), amount: 0 }]);
                    setNewIncomeLabel("");
                  }} style={{ ...btnStyle, padding: "6px 12px", fontSize: 13, background: "#10b981" }}>+ Thêm</button>
                </div>
              </Section>

              {/* NỢ */}
              <Section title="💳 Tổng nợ cần trả" total={fmt(totalDebt)} color="#f43f5e">
                {data.finance.debt.map(item => (
                  <div key={item.id} style={{ ...finRowStyle, opacity: item.paid ? 0.5 : 1 }}>
                    <input type="checkbox" checked={item.paid}
                      onChange={() => updateFinance("debt", data.finance.debt.map(x => x.id === item.id ? { ...x, paid: !x.paid } : x))}
                      style={{ width: 15, height: 15, accentColor: "#10b981", cursor: "pointer", flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, color: item.paid ? "#475569" : "#e2e8f0", textDecoration: item.paid ? "line-through" : "none" }}>
                      {item.label}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="number" value={item.amount || ""}
                        onChange={e => updateFinance("debt", data.finance.debt.map(x => x.id === item.id ? { ...x, amount: e.target.value } : x))}
                        placeholder="0"
                        style={{ ...inputStyle, width: 120, padding: "4px 8px", fontSize: 13, textAlign: "right" }} />
                      <span style={{ fontSize: 12, color: "#475569" }}>đ</span>
                      <button onClick={() => updateFinance("debt", data.finance.debt.filter(x => x.id !== item.id))}
                        style={delBtn}>✕</button>
                    </div>
                  </div>
                ))}
                {/* Thêm mục nợ */}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input value={newDebtLabel} onChange={e => setNewDebtLabel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newDebtLabel.trim()) {
                        updateFinance("debt", [...data.finance.debt, { id: Date.now(), label: newDebtLabel.trim(), amount: 0, paid: false }]);
                        setNewDebtLabel("");
                      }
                    }}
                    placeholder="Tên khoản nợ..." style={{ ...inputStyle, flex: 1, fontSize: 13, padding: "6px 10px" }} />
                  <button onClick={() => {
                    if (!newDebtLabel.trim()) return;
                    updateFinance("debt", [...data.finance.debt, { id: Date.now(), label: newDebtLabel.trim(), amount: 0, paid: false }]);
                    setNewDebtLabel("");
                  }} style={{ ...btnStyle, padding: "6px 12px", fontSize: 13, background: "#f43f5e" }}>+ Thêm</button>
                </div>
              </Section>

              {/* CHI PHÍ CỐ ĐỊNH */}
              <Section title="🧾 Chi phí cố định" total={fmt(totalExpenses)} color="#f97316">
                {data.finance.expenses.map(item => {
                  const amt = Number(item.amount) || 0;
                  const belowMin = item.min && amt < item.min;
                  return (
                    <div key={item.id} style={finRowStyle}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 14, color: "#e2e8f0" }}>{item.label}</span>
                        {item.min > 0 && (
                          <span style={{ fontSize: 11, marginLeft: 8, color: belowMin ? "#f43f5e" : "#10b981", fontWeight: 600 }}>
                            {belowMin ? `⚠ tối thiểu ${item.min.toLocaleString("vi-VN")}đ` : "✓ đủ"}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <input
                          type="number" value={item.amount || ""}
                          onChange={e => updateFinance("expenses", data.finance.expenses.map(x => x.id === item.id ? { ...x, amount: e.target.value } : x))}
                          placeholder="0"
                          style={{ ...inputStyle, width: 120, padding: "4px 8px", fontSize: 13, textAlign: "right", borderColor: belowMin ? "#f43f5e" : "#334155" }} />
                        <span style={{ fontSize: 12, color: "#475569" }}>đ</span>
                        <button onClick={() => updateFinance("expenses", data.finance.expenses.filter(x => x.id !== item.id))}
                          style={delBtn}>✕</button>
                      </div>
                    </div>
                  );
                })}
                {/* Thêm mục chi phí */}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  <input value={newExpenseLabel} onChange={e => setNewExpenseLabel(e.target.value)}
                    placeholder="Tên chi phí..." style={{ ...inputStyle, flex: 1, minWidth: 120, fontSize: 13, padding: "6px 10px" }} />
                  <input type="number" value={newExpenseMin} onChange={e => setNewExpenseMin(e.target.value)}
                    placeholder="Tối thiểu (đ)..." style={{ ...inputStyle, width: 130, fontSize: 13, padding: "6px 10px" }} />
                  <button onClick={() => {
                    if (!newExpenseLabel.trim()) return;
                    updateFinance("expenses", [...data.finance.expenses, { id: Date.now(), label: newExpenseLabel.trim(), amount: 0, min: Number(newExpenseMin) || 0 }]);
                    setNewExpenseLabel(""); setNewExpenseMin("");
                  }} style={{ ...btnStyle, padding: "6px 12px", fontSize: 13, background: "#f97316" }}>+ Thêm</button>
                </div>
              </Section>

              {/* ĐI CHƠI */}
              <Section title="🎉 Đi chơi" total={fmt(totalOutings)} color="#a78bfa">
                {/* Form thêm */}
                <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                  <input type="date" value={newOutingDate} onChange={e => setNewOutingDate(e.target.value)}
                    style={{ ...inputStyle, fontSize: 13, padding: "6px 10px" }} />
                  <input value={newOutingNote} onChange={e => setNewOutingNote(e.target.value)}
                    placeholder="Ghi chú (đi đâu, làm gì...)"
                    onKeyDown={e => {
                      if (e.key === "Enter" && newOutingAmount) {
                        updateFinance("outings", [...data.finance.outings, { id: Date.now(), date: newOutingDate, note: newOutingNote.trim(), amount: Number(newOutingAmount) }]);
                        setNewOutingNote(""); setNewOutingAmount("");
                      }
                    }}
                    style={{ ...inputStyle, flex: 1, minWidth: 140, fontSize: 13, padding: "6px 10px" }} />
                  <input type="number" value={newOutingAmount} onChange={e => setNewOutingAmount(e.target.value)}
                    placeholder="Số tiền..."
                    style={{ ...inputStyle, width: 110, fontSize: 13, padding: "6px 10px" }} />
                  <button onClick={() => {
                    if (!newOutingAmount) return;
                    updateFinance("outings", [...data.finance.outings, { id: Date.now(), date: newOutingDate, note: newOutingNote.trim(), amount: Number(newOutingAmount) }]);
                    setNewOutingNote(""); setNewOutingAmount("");
                  }} style={{ ...btnStyle, padding: "6px 12px", fontSize: 13, background: "#a78bfa", color: "#fff" }}>+ Thêm</button>
                </div>

                {/* Danh sách */}
                {data.finance.outings.length === 0 && (
                  <div style={{ fontSize: 13, color: "#475569", textAlign: "center", padding: "12px 0" }}>Chưa có lần đi chơi nào 🎈</div>
                )}
                {[...data.finance.outings].sort((a, b) => b.date.localeCompare(a.date)).map(o => (
                  <div key={o.id} style={{ ...finRowStyle, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#64748b", minWidth: 86, flexShrink: 0 }}>📅 {o.date}</span>
                    <span style={{ flex: 1, fontSize: 14, color: "#e2e8f0" }}>{o.note || <span style={{ color: "#475569", fontStyle: "italic" }}>Không có ghi chú</span>}</span>
                    <span style={{ fontWeight: 700, color: "#a78bfa", fontSize: 14, minWidth: 90, textAlign: "right" }}>
                      {Number(o.amount).toLocaleString("vi-VN")}đ
                    </span>
                    <button onClick={() => updateFinance("outings", data.finance.outings.filter(x => x.id !== o.id))}
                      style={delBtn}>✕</button>
                  </div>
                ))}

                {/* Tổng cuối */}
                {data.finance.outings.length > 0 && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10, paddingTop: 8, borderTop: "1px solid #243347" }}>
                    <span style={{ fontSize: 13, color: "#94a3b8", marginRight: 8 }}>Tổng đi chơi tháng này:</span>
                    <span style={{ fontWeight: 700, color: "#a78bfa" }}>{fmt(totalOutings)}</span>
                  </div>
                )}
              </Section>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#1e293b", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SummaryCard({ label, value, color, icon }) {
  return (
    <div style={{ flex: "1 1 120px", background: "#1e293b", borderRadius: 10, padding: "12px 14px", borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Section({ title, total, color, children }) {
  return (
    <div style={{ background: "#1e293b", borderRadius: 12, marginBottom: 16, overflow: "hidden", border: "1px solid #243347" }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid #243347", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: "#f8fafc" }}>{title}</span>
        <span style={{ fontWeight: 700, color, fontSize: 15 }}>{total}</span>
      </div>
      <div style={{ padding: "10px 14px" }}>{children}</div>
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ textAlign: "center", color: "#475569", padding: "32px 0", fontSize: 14 }}>😴 {text}</div>;
}

const inputStyle = {
  background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 12px",
  color: "#e2e8f0", fontSize: 14, outline: "none",
};

const selectStyle = {
  background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "8px 10px",
  color: "#e2e8f0", fontSize: 14, outline: "none", cursor: "pointer",
};

const finRowStyle = {
  display: "flex", alignItems: "center", gap: 8,
  padding: "7px 0", borderBottom: "1px solid #1a2740",
};

const delBtn = {
  background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 14,
};

const btnStyle = {
  background: "#38bdf8", border: "none", borderRadius: 8, padding: "8px 16px",
  color: "#0f172a", fontWeight: 700, fontSize: 14, cursor: "pointer",
};
