import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─── User ID — đổi giá trị này nếu muốn dùng nhiều tài khoản ──
const USER_ID = "my-tracker";

// ─── Dùng giờ LOCAL (UTC+7) thay vì UTC của toISOString() ─────
// toISOString() trả về UTC → ở VN (UTC+7) từ 0h-6h59 sẽ bị lệch ngày
function localDateStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function localMonthStr(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
// Tính mili-giây đến 0h00 ngày mai theo giờ local
function msUntilLocalMidnight(): number {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return midnight.getTime() - now.getTime();
}

// ─── Tab config ───────────────────────────────────────────────
const TABS = [
  { id: 0, icon: "📚", label: "Môn học" },
  { id: 1, icon: "✅", label: "Việc làm" },
  { id: 2, icon: "🎯", label: "Mục tiêu" },
  { id: 3, icon: "⏱️", label: "Thời gian" },
  { id: 4, icon: "📝", label: "Soạn bài" },
  { id: 5, icon: "💰", label: "Chi tiêu" },
];

const COLORS = ["#f97316","#8b5cf6","#06b6d4","#10b981","#f43f5e","#facc15"];
const PRIORITY_COLOR: Record<string,string> = { cao:"#f43f5e","trung bình":"#facc15",thấp:"#10b981" };
const STATUS_COLOR: Record<string,string> = { "chưa soạn":"#f43f5e","đang soạn":"#facc15","hoàn thành":"#10b981" };

const initialData = {
  subjects: [
    { id:1, name:"Toán", color:"#f97316", examDate:"", items:[
      {id:11,text:"Chương 1: Giới hạn",done:true},
      {id:12,text:"Chương 2: Đạo hàm",done:false},
      {id:13,text:"Chương 3: Tích phân",done:false},
    ]},
    { id:2, name:"Văn", color:"#8b5cf6", examDate:"", items:[
      {id:21,text:"Tác phẩm: Vợ nhặt",done:true},
      {id:22,text:"Tác phẩm: Chí Phèo",done:false},
    ]},
    { id:3, name:"Anh", color:"#06b6d4", examDate:"", items:[
      {id:31,text:"Unit 5: Environment",done:true},
      {id:32,text:"Unit 6: Technology",done:false},
    ]},
  ],
  todos: [
    {id:1,text:"Ôn tập chương 3 Toán",done:false,priority:"cao",date:localDateStr()},
    {id:2,text:"Viết bài luận Văn",done:false,priority:"trung bình",date:localDateStr()},
    {id:3,text:"Học từ vựng Unit 5",done:true,priority:"thấp",date:localDateStr()},
  ],
  todoHistory: [] as {date:string;items:{id:number;text:string;done:boolean;priority:string}[]}[],
  goals: [
    {id:1,text:"Đạt 8.0 học kỳ này",deadline:"2025-06-30",done:false},
    {id:2,text:"Hoàn thành khóa học lập trình",deadline:"2025-07-15",done:false},
  ],
  studyLog: [] as {id:number;date:string;minutes:number;note:string}[],
  lessons: [
    {id:1,subject:"Toán",lesson:"Chương 4: Đạo hàm",status:"chưa soạn"},
    {id:2,subject:"Văn",lesson:"Tác phẩm: Vợ nhặt",status:"đang soạn"},
    {id:3,subject:"Anh",lesson:"Unit 6: Technology",status:"hoàn thành"},
  ],
  finance: {
    month: localMonthStr(),
    income: [
      {id:1,label:"Dạy kèm Toán",amount:0},
      {id:2,label:"Dạy kèm Lý",amount:0},
      {id:3,label:"Lương làm việc",amount:0},
    ],
    debt: [
      {id:1,label:"Seasy",amount:0,paid:false},
      {id:2,label:"HD",amount:0,paid:false},
      {id:3,label:"Spay",amount:0,paid:false},
      {id:4,label:"Nợ ngoài app",amount:0,paid:false},
    ],
    expenses: [
      {id:1,label:"Xăng xe",amount:0,min:500000},
      {id:2,label:"Tiết kiệm",amount:0,min:300000},
    ],
    outings: [] as {id:number;date:string;note:string;amount:number}[],
  },
};

// ─── Shared styles ─────────────────────────────────────────────
const S = {
  input: {
    background:"#111827", border:"1px solid #1f2d44", borderRadius:10,
    padding:"11px 14px", color:"#e2e8f0", fontSize:15, outline:"none",
    width:"100%", WebkitAppearance:"none" as const,
  } as React.CSSProperties,
  select: {
    background:"#111827", border:"1px solid #1f2d44", borderRadius:10,
    padding:"11px 14px", color:"#e2e8f0", fontSize:15, outline:"none",
    cursor:"pointer", WebkitAppearance:"none" as const,
  } as React.CSSProperties,
  btn: {
    background:"#38bdf8", border:"none", borderRadius:10, padding:"11px 18px",
    color:"#0a0f1e", fontWeight:700, fontSize:15, cursor:"pointer",
    whiteSpace:"nowrap" as const, flexShrink:0,
  } as React.CSSProperties,
  card: {
    background:"#111827", borderRadius:14, border:"1px solid #1f2d44",
    marginBottom:10,
  } as React.CSSProperties,
  row: {
    display:"flex" as const, alignItems:"center" as const, gap:10,
    padding:"11px 14px", borderBottom:"1px solid #1a2735",
  } as React.CSSProperties,
  delBtn: {
    background:"none", border:"none", color:"#334155", cursor:"pointer",
    fontSize:18, padding:"4px 6px", lineHeight:1, flexShrink:0,
  } as React.CSSProperties,
};

// ─── App ───────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved"|"saving"|"error">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Load from Supabase — delay tối thiểu 1s để màn hình loading hiện đủ lâu
  useEffect(() => {
    const t0 = Date.now();
    supabase.from("tracker_data").select("data").eq("user_id",USER_ID).maybeSingle()
      .then(({data:row}) => {
        if (row?.data) setData(row.data);
        const elapsed = Date.now() - t0;
        const remain = Math.max(0, 1000 - elapsed);
        setTimeout(() => setLoading(false), remain);
      });
  }, []);

  // Debounce save — 1500ms để giảm số lần ghi khi gõ phím liên tục
  useEffect(() => {
    if (loading) return;
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      supabase.from("tracker_data")
        .upsert({user_id:USER_ID, data, updated_at:new Date()})
        .then(({error}) => {
          if (error) { console.error("Lỗi lưu:", error.message); setSaveStatus("error"); }
          else setSaveStatus("saved");
        });
    }, 1500);
  }, [data, loading]);

  // ─ Daily reset
  const runDailyReset = useCallback((cur: typeof initialData) => {
    const today = localDateStr();
    const oldTodos = cur.todos.filter(t => !t.date || t.date < today);
    if (!oldTodos.length) return null;
    const yest = localDateStr(new Date(Date.now()-86400000));
    const byDate: Record<string,typeof oldTodos> = {};
    oldTodos.forEach(t => { const k = t.date && t.date<today ? t.date : yest; (byDate[k]??=[]).push(t); });
    const hist = [...(cur.todoHistory||[])];
    Object.entries(byDate).forEach(([d,items]) => {
      const i = hist.findIndex(h=>h.date===d);
      if (i===-1) hist.push({date:d,items});
      else { const ex=new Set(hist[i].items.map(x=>x.id)); hist[i]={...hist[i],items:[...hist[i].items,...items.filter(x=>!ex.has(x.id))]}; }
    });
    return { todos:cur.todos.filter(t=>t.date&&t.date>=today), todoHistory:hist.sort((a,b)=>b.date.localeCompare(a.date)).slice(0,14) };
  }, []);

  // Lưu thẳng lên Supabase sau reset — tránh race condition với save effect
  const applyResetAndSave = useCallback((cur: typeof initialData) => {
    const patch = runDailyReset(cur);
    if (!patch) return cur;
    const next = {...cur, ...patch};
    setSaveStatus("saving");
    supabase.from("tracker_data")
      .upsert({user_id: USER_ID, data: next, updated_at: new Date()})
      .then(({error}) => {
        if (error) { console.error("Lỗi lưu reset:", error.message); setSaveStatus("error"); }
        else setSaveStatus("saved");
      });
    return next;
  }, [runDailyReset]);

  useEffect(() => {
    if (loading) return;
    // Chạy reset ngay khi load xong, dùng functional update để có data mới nhất
    setData(d => applyResetAndSave(d));
    let tid: ReturnType<typeof setTimeout>;
    const sched = () => {
      tid = setTimeout(() => {
        setData(d => applyResetAndSave(d));
        sched();
      }, msUntilLocalMidnight());
    };
    sched();
    return () => clearTimeout(tid);
  }, [loading, applyResetAndSave]);

  // ─ Stats
  const todayStr = localDateStr();
  const totalStudyMin = data.studyLog.reduce((a,b)=>a+b.minutes,0);
  const todayTodos = data.todos.filter(t=>!t.date||t.date===todayStr);
  const doneTodos = todayTodos.filter(t=>t.done).length;
  const doneGoals = data.goals.filter(g=>g.done).length;
  const doneLessons = data.lessons.filter(l=>l.status==="hoàn thành").length;
  const totalItems = data.subjects.reduce((a,s)=>a+s.items.length,0);
  const doneItems = data.subjects.reduce((a,s)=>a+s.items.filter(i=>i.done).length,0);

  const stats = [
    {icon:"📚",val:`${doneItems}/${totalItems}`,lbl:"Bài học"},
    {icon:"✅",val:`${doneTodos}/${todayTodos.length}`,lbl:"Hôm nay"},
    {icon:"🎯",val:`${doneGoals}/${data.goals.length}`,lbl:"Mục tiêu"},
    {icon:"⏱️",val:`${Math.floor(totalStudyMin/60)}h${totalStudyMin%60}m`,lbl:"Học"},
    {icon:"📝",val:`${doneLessons}/${data.lessons.length}`,lbl:"Soạn"},
  ];

  // Chờ Supabase trả dữ liệu xong mới render — tránh flash dữ liệu mẫu
  if (loading) return (
    <div style={{
      position:"fixed",inset:0,
      backgroundImage:"url('/loading-bg.jpg')",
      backgroundSize:"cover",backgroundPosition:"center",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",
      paddingBottom:"env(safe-area-inset-bottom, 48px)",
    }}>
      {/* Overlay gradient từ dưới lên */}
      <div style={{
        position:"absolute",inset:0,
        background:"linear-gradient(to top, rgba(10,15,30,0.85) 0%, rgba(10,15,30,0.2) 50%, transparent 100%)",
      }}/>
      {/* Nội dung */}
      <div style={{position:"relative",textAlign:"center",paddingBottom:48,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:36}}>📖</div>
        <div style={{fontSize:22,fontWeight:800,color:"#f8fafc",letterSpacing:"-0.5px"}}>KAQ Tracker</div>
        <div style={{fontSize:13,color:"#38bdf8"}}>Đang tải dữ liệu…</div>
      </div>
    </div>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",minHeight:"100svh",background:"#0a0f1e"}}>

      {/* ── Header ── */}
      <div style={{
        background:"linear-gradient(180deg,#111827 0%,#0d1829 100%)",
        paddingTop:"env(safe-area-inset-top, 12px)",
        borderBottom:"1px solid #1f2d44",
        position:"sticky",top:0,zIndex:100,
      }}>
        <div style={{padding:"12px 16px 0"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between"}}>
            <h1 style={{margin:0,fontSize:20,fontWeight:800,color:"#f8fafc",letterSpacing:"-0.5px"}}>
              📖 KAQ Tracker
            </h1>
            {/* Save status indicator */}
            <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,
              color: saveStatus==="saved"?"#10b981": saveStatus==="saving"?"#facc15":"#f43f5e",
              transition:"color 0.3s",
            }}>
              {saveStatus==="saving" && (
                <svg width="12" height="12" viewBox="0 0 12 12" style={{animation:"spin 1s linear infinite"}}>
                  <circle cx="6" cy="6" r="5" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="8 8"/>
                </svg>
              )}
              {saveStatus==="saved" && <span>✓</span>}
              {saveStatus==="error" && <span>✕</span>}
              <span>{saveStatus==="saving"?"Đang lưu…": saveStatus==="saved"?"Đã lưu":"Lỗi lưu"}</span>
            </div>
          </div>
          <p style={{margin:"2px 0 10px",fontSize:12,color:"#475569"}}>Theo dõi tiến trình cuộc đời</p>

          {/* Stats row */}
          <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10}}>
            {stats.map(s=>(
              <div key={s.lbl} style={{
                background:"#0d1829",borderRadius:12,padding:"8px 10px",
                textAlign:"center",flexShrink:0,minWidth:64,
                border:"1px solid #1f2d44",
              }}>
                <div style={{fontSize:16}}>{s.icon}</div>
                <div style={{fontSize:14,fontWeight:800,color:"#38bdf8",lineHeight:1.2}}>{s.val}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:1}}>{s.lbl}</div>
              </div>
            ))}
          </div>

          {/* Tab bar (top) */}
          <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:0}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{
                background:tab===t.id?"#38bdf8":"transparent",
                color:tab===t.id?"#0a0f1e":"#64748b",
                border:"none",padding:"7px 12px",cursor:"pointer",
                fontSize:12,fontWeight:tab===t.id?800:500,
                borderRadius:"8px 8px 0 0",whiteSpace:"nowrap",flexShrink:0,
                transition:"all 0.15s",
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{flex:1,padding:"14px 14px",paddingBottom:"calc(env(safe-area-inset-bottom,16px) + 16px)",overflowY:"auto"}}>
        {tab===0 && <TabSubjects data={data} setData={setData}/>}
        {tab===1 && <TabTodos data={data} setData={setData} todayStr={todayStr}/>}
        {tab===2 && <TabGoals data={data} setData={setData}/>}
        {tab===3 && <TabStudy data={data} setData={setData} totalMin={totalStudyMin}/>}
        {tab===4 && <TabLessons data={data} setData={setData} doneLessons={doneLessons}/>}
        {tab===5 && <TabFinance data={data} setData={setData}/>}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADD PANEL — Slide từ phải, dùng chung cho mọi tab
// ══════════════════════════════════════════════════════════════
function AddPanel({open, onClose, title, color="#38bdf8", children}:any){
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div onClick={onClose} style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:200,
          animation:"fadeIn 0.2s ease",
        }}/>
      )}
      {/* Panel */}
      <div style={{
        position:"fixed",top:0,right:0,bottom:0,
        width:"min(340px, 92vw)",
        background:"#111827",
        borderLeft:"1px solid #1f2d44",
        zIndex:201,
        transform:open?"translateX(0)":"translateX(100%)",
        transition:"transform 0.28s cubic-bezier(.4,0,.2,1)",
        display:"flex",flexDirection:"column",
        boxShadow:open?"-8px 0 32px rgba(0,0,0,0.4)":"none",
        paddingTop:"env(safe-area-inset-top,0px)",
      }}>
        {/* Header */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"16px 18px",borderBottom:"1px solid #1f2d44",
          background:"#0d1829",flexShrink:0,
        }}>
          <span style={{fontWeight:800,fontSize:16,color:"#f8fafc"}}>{title}</span>
          <button onClick={onClose} style={{
            background:"#1f2d44",border:"none",borderRadius:8,
            color:"#94a3b8",fontSize:18,cursor:"pointer",
            width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",
          }}>✕</button>
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 18px",
          paddingBottom:"calc(env(safe-area-inset-bottom,16px) + 16px)"}}>
          {children}
        </div>
        {/* Accent bar */}
        <div style={{height:3,background:color,flexShrink:0}}/>
      </div>

      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>
    </>
  );
}

// Nút + nổi góc dưới phải
function FabAdd({onClick, color="#38bdf8"}:any){
  return (
    <div style={{
      position:"sticky",
      bottom:"calc(env(safe-area-inset-bottom,16px) + 16px)",
      display:"flex",justifyContent:"flex-end",
      pointerEvents:"none",
      zIndex:150,
      marginBottom:8,
    }}>
      <button onClick={onClick} style={{
        pointerEvents:"all",
        width:52,height:52,borderRadius:"50%",
        background:color,border:"none",
        color:"#0a0f1e",fontSize:26,fontWeight:700,
        cursor:"pointer",
        boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
        display:"flex",alignItems:"center",justifyContent:"center",
        transition:"transform 0.15s",
        flexShrink:0,
      }}>＋</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 0 — MÔN HỌC
// ══════════════════════════════════════════════════════════════
function TabSubjects({data,setData}:any) {
  const [name,setName]=useState("");
  const [color,setColor]=useState(COLORS[3]);
  const [newItem,setNewItem]=useState<Record<number,string>>({});
  const [expanded,setExpanded]=useState<number|null>(null);
  const [panelOpen,setPanelOpen]=useState(false);

  const addSubject=()=>{
    if (!name.trim()) return;
    const id=Date.now();
    setData((d:any)=>({...d,subjects:[...d.subjects,{id,name:name.trim(),color,examDate:"",items:[]}]}));
    setName(""); setExpanded(id); setPanelOpen(false);
  };

  return (
    <div>
      <FabAdd onClick={()=>setPanelOpen(true)} color="#38bdf8"/>
      <AddPanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="➕ Thêm môn học" color="#38bdf8">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={name} onChange={e=>setName(e.target.value)}
            placeholder="Tên môn học..." onKeyDown={e=>e.key==="Enter"&&addSubject()}
            style={S.input} autoFocus/>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>Chọn màu</div>
            <div style={{display:"flex",gap:10}}>
              {COLORS.map(c=>(
                <div key={c} onClick={()=>setColor(c)} style={{
                  width:32,height:32,borderRadius:"50%",background:c,cursor:"pointer",
                  border:color===c?"3px solid #fff":"3px solid transparent",
                  boxShadow:color===c?"0 0 0 2px "+c:"none",
                }}/>
              ))}
            </div>
          </div>
          <button onClick={addSubject} style={{...S.btn,width:"100%",justifyContent:"center",marginTop:4}}>
            + Thêm môn
          </button>
        </div>
      </AddPanel>

      {data.subjects.length===0 && <Empty text="Chưa có môn học nào"/>}
      {[...data.subjects].sort((a:any,b:any)=>{
        if(!a.examDate&&!b.examDate) return 0;
        if(!a.examDate) return 1; if(!b.examDate) return -1;
        return new Date(a.examDate).getTime()-new Date(b.examDate).getTime();
      }).map((s:any)=>{
        const done=s.items.filter((i:any)=>i.done).length;
        const total=s.items.length;
        const pct=total?Math.round(done/total*100):0;
        const isOpen=expanded===s.id;
        const daysLeft=s.examDate?Math.ceil((new Date(s.examDate).getTime()-Date.now())/86400000):null;
        const passed=daysLeft!==null&&daysLeft<0;
        const soon=daysLeft!==null&&daysLeft>=0&&daysLeft<=7;
        const cdColor=passed?"#475569":soon?"#f43f5e":"#38bdf8";

        return (
          <div key={s.id} style={S.card}>
            {/* Subject header */}
            <div onClick={()=>setExpanded(isOpen?null:s.id)} style={{
              display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",userSelect:"none",
            }}>
              <span style={{width:12,height:12,borderRadius:"50%",background:s.color,flexShrink:0,display:"inline-block"}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:15,color:"#f8fafc"}}>{s.name}</div>
                {daysLeft!==null&&(
                  <div style={{fontSize:11,color:cdColor,fontWeight:600}}>
                    🎯 {passed?`Đã thi (${s.examDate})`:daysLeft===0?"Thi hôm nay!":`Còn ${daysLeft} ngày • ${s.examDate}`}
                  </div>
                )}
              </div>
              <span style={{fontSize:12,color:"#64748b",flexShrink:0}}>{done}/{total}</span>
              <div style={{width:48,height:5,background:"#0d1829",borderRadius:999,overflow:"hidden",flexShrink:0}}>
                <div style={{width:`${pct}%`,height:"100%",background:s.color,borderRadius:999,transition:"width 0.3s"}}/>
              </div>
              <span style={{fontSize:12,color:s.color,fontWeight:700,minWidth:32,textAlign:"right"}}>{pct}%</span>
              <button onClick={e=>{e.stopPropagation();setData((d:any)=>({...d,subjects:d.subjects.filter((x:any)=>x.id!==s.id)}));}}
                style={S.delBtn}>✕</button>
              <span style={{color:"#475569",fontSize:12}}>{isOpen?"▲":"▼"}</span>
            </div>

            {isOpen&&(
              <div style={{borderTop:"1px solid #1f2d44",padding:"12px 14px"}}>
                {/* Exam date */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,paddingBottom:12,borderBottom:"1px solid #1f2d44"}}>
                  <span style={{fontSize:13,color:"#94a3b8",flexShrink:0}}>🎯 Ngày thi:</span>
                  <input type="date" value={s.examDate||""}
                    onChange={e=>setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,examDate:e.target.value}:x)}))}
                    style={{...S.input,fontSize:13,padding:"6px 10px",flex:1}}/>
                  {s.examDate&&(
                    <button onClick={()=>setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,examDate:""}:x)}))}
                      style={{...S.delBtn,fontSize:13}}>✕</button>
                  )}
                </div>

                {/* Items */}
                {s.items.length===0&&<div style={{fontSize:13,color:"#475569",marginBottom:10}}>Chưa có bài học. Thêm bên dưới!</div>}
                {s.items.map((item:any)=>(
                  <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 0",borderBottom:"1px solid #1a2735"}}>
                    <input type="checkbox" checked={item.done}
                      onChange={()=>setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,items:x.items.map((i:any)=>i.id===item.id?{...i,done:!i.done}:i)}:x)}))}
                      style={{width:18,height:18,accentColor:s.color,cursor:"pointer",flexShrink:0}}/>
                    <span style={{flex:1,fontSize:14,color:item.done?"#475569":"#e2e8f0",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                    <button onClick={()=>setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,items:x.items.filter((i:any)=>i.id!==item.id)}:x)}))}
                      style={S.delBtn}>✕</button>
                  </div>
                ))}

                {/* Add item */}
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <input value={newItem[s.id]||""} onChange={e=>setNewItem(p=>({...p,[s.id]:e.target.value}))}
                    onKeyDown={e=>{
                      if(e.key==="Enter"&&(newItem[s.id]||"").trim()){
                        setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,items:[...x.items,{id:Date.now(),text:newItem[s.id].trim(),done:false}]}:x)}));
                        setNewItem(p=>({...p,[s.id]:""}));
                      }
                    }}
                    placeholder="Thêm bài học..." style={{...S.input,fontSize:14,padding:"9px 12px"}}/>
                  <button onClick={()=>{
                    const v=(newItem[s.id]||"").trim();if(!v)return;
                    setData((d:any)=>({...d,subjects:d.subjects.map((x:any)=>x.id===s.id?{...x,items:[...x.items,{id:Date.now(),text:v,done:false}]}:x)}));
                    setNewItem(p=>({...p,[s.id]:""}));
                  }} style={{...S.btn,padding:"9px 14px",fontSize:14}}>+</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 1 — VIỆC CẦN LÀM
// ══════════════════════════════════════════════════════════════
function TabTodos({data,setData,todayStr}:any) {
  const [view,setView]=useState<"today"|"history">("today");
  const [subView,setSubView]=useState<"pending"|"done">("pending");
  const [text,setText]=useState("");
  const [priority,setPriority]=useState("trung bình");
  const [date,setDate]=useState(todayStr);
  const [panelOpen,setPanelOpen]=useState(false);

  const pending=data.todos.filter((t:any)=>!t.done);
  const done=data.todos.filter((t:any)=>t.done);

  const add=()=>{
    if(!text.trim())return;
    setData((d:any)=>({...d,todos:[...d.todos,{id:Date.now(),text:text.trim(),done:false,priority,date}]}));
    setText(""); setPanelOpen(false);
  };

  return (
    <div>
      <FabAdd onClick={()=>setPanelOpen(true)} color="#38bdf8"/>
      <AddPanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="➕ Thêm việc cần làm" color="#38bdf8">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Việc cần làm..."
            onKeyDown={e=>e.key==="Enter"&&add()} style={S.input} autoFocus/>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ngày</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={S.input}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ưu tiên</div>
            <select value={priority} onChange={e=>setPriority(e.target.value)} style={{...S.select,width:"100%"}}>
              <option value="cao">🔴 Cao</option>
              <option value="trung bình">🟡 Trung bình</option>
              <option value="thấp">🟢 Thấp</option>
            </select>
          </div>
          <button onClick={add} style={{...S.btn,width:"100%",justifyContent:"center",marginTop:4}}>
            + Thêm việc
          </button>
        </div>
      </AddPanel>

      {/* View toggle */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {(["today","history"] as const).map(v=>(
          <button key={v} onClick={()=>setView(v)} style={{
            flex:1,background:view===v?"#38bdf8":"#111827",
            color:view===v?"#0a0f1e":"#64748b",
            border:`1px solid ${view===v?"#38bdf8":"#1f2d44"}`,
            borderRadius:10,padding:"10px",fontSize:14,fontWeight:view===v?700:500,cursor:"pointer",
          }}>{v==="today"?"📋 Hôm nay":"🗂️ Lịch sử"}</button>
        ))}
      </div>

      {view==="today"&&(
        <div>
          {/* Sub tabs */}
          <div style={{display:"flex",gap:6,background:"#0d1829",borderRadius:12,padding:4,marginBottom:14}}>
            {([{k:"pending",lbl:"📋 Cần làm",cnt:pending.length},{k:"done",lbl:"✅ Hoàn thành",cnt:done.length}] as const).map(({k,lbl,cnt})=>(
              <button key={k} onClick={()=>setSubView(k as any)} style={{
                flex:1,background:subView===k?"#111827":"transparent",
                color:subView===k?"#f8fafc":"#64748b",
                border:"none",borderRadius:10,padding:"9px 12px",
                fontSize:13,fontWeight:subView===k?700:500,cursor:"pointer",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              }}>
                {lbl}
                <span style={{
                  background:subView===k?(k==="done"?"#10b981":"#38bdf8"):"#1f2d44",
                  color:subView===k?"#0a0f1e":"#64748b",
                  borderRadius:999,fontSize:11,fontWeight:700,padding:"1px 7px",
                }}>{cnt}</span>
              </button>
            ))}
          </div>

          {subView==="pending"&&(
            <div>
              {["cao","trung bình","thấp"].map(p=>{
                const items=pending.filter((t:any)=>t.priority===p);
                if(!items.length) return null;
                return (
                  <div key={p} style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:PRIORITY_COLOR[p],fontWeight:700,marginBottom:8,
                      textTransform:"uppercase",letterSpacing:1}}>Ưu tiên {p}</div>
                    {items.map((t:any)=>{
                      const over=t.date&&t.date<todayStr;
                      return (
                        <div key={t.id} style={{...S.card,borderLeft:`3px solid ${over?"#f43f5e":PRIORITY_COLOR[p]}`}}>
                          <div style={{padding:"11px 14px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <input type="checkbox" checked={false}
                                onChange={()=>setData((d:any)=>({...d,todos:d.todos.map((x:any)=>x.id===t.id?{...x,done:true}:x)}))}
                                style={{width:20,height:20,accentColor:PRIORITY_COLOR[p],cursor:"pointer",flexShrink:0}}/>
                              <span style={{flex:1,color:"#e2e8f0",fontSize:15}}>{t.text}</span>
                              <button onClick={()=>setData((d:any)=>({...d,todos:d.todos.filter((x:any)=>x.id!==t.id)}))}
                                style={S.delBtn}>✕</button>
                            </div>
                            {(t.date||over)&&(
                              <div style={{display:"flex",gap:8,marginTop:5,paddingLeft:30}}>
                                {t.date&&<span style={{fontSize:11,color:"#64748b"}}>📅 {t.date}</span>}
                                {over&&<span style={{fontSize:11,color:"#f43f5e",fontWeight:700}}>⚠ Quá hạn</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {!pending.length&&(
                <div style={{textAlign:"center",padding:"40px 0"}}>
                  <div style={{fontSize:36,marginBottom:8}}>🎉</div>
                  <div style={{color:"#10b981",fontWeight:700,fontSize:15}}>Tuyệt! Đã xong tất cả!</div>
                </div>
              )}
            </div>
          )}

          {subView==="done"&&(
            <div>
              {!done.length&&<Empty text="Chưa hoàn thành việc nào hôm nay"/>}
              {["cao","trung bình","thấp"].map(p=>{
                const items=done.filter((t:any)=>t.priority===p);
                if(!items.length) return null;
                return (
                  <div key={p} style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:PRIORITY_COLOR[p],fontWeight:700,marginBottom:8,
                      textTransform:"uppercase",letterSpacing:1,opacity:0.7}}>Ưu tiên {p}</div>
                    {items.map((t:any)=>(
                      <div key={t.id} style={{...S.card,borderLeft:"3px solid #10b981",opacity:0.75}}>
                        <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
                          <input type="checkbox" checked={true}
                            onChange={()=>setData((d:any)=>({...d,todos:d.todos.map((x:any)=>x.id===t.id?{...x,done:false}:x)}))}
                            style={{width:20,height:20,accentColor:"#10b981",cursor:"pointer",flexShrink:0}}/>
                          <span style={{flex:1,textDecoration:"line-through",color:"#475569",fontSize:15}}>{t.text}</span>
                          <span style={{fontSize:11,color:"#10b981",fontWeight:700}}>✓</span>
                          <button onClick={()=>setData((d:any)=>({...d,todos:d.todos.filter((x:any)=>x.id!==t.id)}))}
                            style={S.delBtn}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view==="history"&&(
        <div>
          {(!data.todoHistory||!data.todoHistory.length)&&<Empty text="Chưa có lịch sử"/>}
          {[...(data.todoHistory||[])].sort((a:any,b:any)=>b.date.localeCompare(a.date)).map((h:any)=>{
            const dc=h.items.filter((i:any)=>i.done).length;
            return (
              <div key={h.date} style={S.card}>
                <div style={{padding:"11px 14px",borderBottom:"1px solid #1f2d44",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontWeight:700,fontSize:14,color:"#f8fafc"}}>📅 {h.date}</span>
                  <span style={{fontSize:12,color:dc===h.items.length?"#10b981":"#f43f5e"}}>{dc}/{h.items.length} xong</span>
                </div>
                <div style={{padding:"8px 14px"}}>
                  {h.items.map((item:any)=>(
                    <div key={item.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid #1a2735"}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:PRIORITY_COLOR[item.priority],flexShrink:0,display:"inline-block"}}/>
                      <span style={{flex:1,fontSize:14,color:item.done?"#475569":"#e2e8f0",textDecoration:item.done?"line-through":"none"}}>{item.text}</span>
                      {item.done?<span style={{fontSize:11,color:"#10b981",fontWeight:700}}>✓</span>:<span style={{fontSize:11,color:"#f43f5e",fontWeight:700}}>✗</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 2 — MỤC TIÊU
// ══════════════════════════════════════════════════════════════
function TabGoals({data,setData}:any) {
  const [text,setText]=useState("");
  const [deadline,setDeadline]=useState("");
  const [panelOpen,setPanelOpen]=useState(false);
  const add=()=>{
    if(!text.trim())return;
    setData((d:any)=>({...d,goals:[...d.goals,{id:Date.now(),text:text.trim(),deadline,done:false}]}));
    setText("");setDeadline("");setPanelOpen(false);
  };
  return (
    <div>
      <FabAdd onClick={()=>setPanelOpen(true)} color="#38bdf8"/>
      <AddPanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="➕ Thêm mục tiêu" color="#38bdf8">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Mục tiêu của bạn..."
            onKeyDown={e=>e.key==="Enter"&&add()} style={S.input} autoFocus/>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Deadline</div>
            <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={S.input}/>
          </div>
          <button onClick={add} style={{...S.btn,width:"100%",justifyContent:"center",marginTop:4}}>
            + Thêm mục tiêu
          </button>
        </div>
      </AddPanel>
      {data.goals.length===0&&<Empty text="Chưa có mục tiêu nào"/>}
      {data.goals.map((g:any)=>{
        const dl=g.deadline?Math.ceil((new Date(g.deadline).getTime()-Date.now())/86400000):null;
        return (
          <div key={g.id} style={{...S.card,borderLeft:`3px solid ${g.done?"#10b981":"#38bdf8"}`}}>
            <div style={{padding:"12px 14px",display:"flex",alignItems:"flex-start",gap:10}}>
              <input type="checkbox" checked={g.done}
                onChange={()=>setData((d:any)=>({...d,goals:d.goals.map((x:any)=>x.id===g.id?{...x,done:!x.done}:x)}))}
                style={{marginTop:2,width:20,height:20,accentColor:"#10b981",cursor:"pointer",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:15,textDecoration:g.done?"line-through":"none",color:g.done?"#475569":"#f8fafc"}}>{g.text}</div>
                {g.deadline&&(
                  <div style={{fontSize:12,marginTop:4,color:dl!==null&&dl<0?"#f43f5e":dl!==null&&dl<7?"#facc15":"#64748b"}}>
                    📅 {g.deadline} {dl!==null&&`• ${dl<0?"Quá hạn!":dl===0?"Hôm nay!":"Còn "+dl+" ngày"}`}
                  </div>
                )}
              </div>
              <button onClick={()=>setData((d:any)=>({...d,goals:d.goals.filter((x:any)=>x.id!==g.id)}))}
                style={S.delBtn}>✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 3 — THỜI GIAN HỌC
// ══════════════════════════════════════════════════════════════
function TabStudy({data,setData,totalMin}:any) {
  const [date,setDate]=useState(localDateStr());
  const [minutes,setMinutes]=useState("");
  const [note,setNote]=useState("");
  const [panelOpen,setPanelOpen]=useState(false);
  const add=()=>{
    if(!minutes||isNaN(+minutes))return;
    setData((d:any)=>({...d,studyLog:[...d.studyLog,{id:Date.now(),date,minutes:+minutes,note}]}));
    setMinutes("");setNote("");setPanelOpen(false);
  };
  return (
    <div>
      <FabAdd onClick={()=>setPanelOpen(true)} color="#38bdf8"/>
      <AddPanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="➕ Ghi thời gian học" color="#38bdf8">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ngày</div>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={S.input}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Số phút</div>
            <input type="number" value={minutes} onChange={e=>setMinutes(e.target.value)}
              placeholder="Ví dụ: 60" style={S.input} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ghi chú</div>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Học gì..."
              onKeyDown={e=>e.key==="Enter"&&add()} style={S.input}/>
          </div>
          <button onClick={add} style={{...S.btn,width:"100%",justifyContent:"center",marginTop:4}}>
            + Ghi lại
          </button>
        </div>
      </AddPanel>

      {/* Stats */}
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        {[
          {lbl:"Tổng thời gian",val:`${Math.floor(totalMin/60)}h ${totalMin%60}m`,color:"#38bdf8"},
          {lbl:"Số buổi",val:data.studyLog.length,color:"#a78bfa"},
          {lbl:"TB/buổi",val:data.studyLog.length?`${Math.round(totalMin/data.studyLog.length)}m`:"—",color:"#34d399"},
        ].map(s=>(
          <div key={s.lbl} style={{flex:1,...S.card,padding:"12px 10px",textAlign:"center",marginBottom:0}}>
            <div style={{fontSize:16,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {data.studyLog.length===0&&<Empty text="Chưa có buổi học nào"/>}
      {[...data.studyLog].reverse().map((l:any)=>(
        <div key={l.id} style={{...S.card}}>
          <div style={{padding:"11px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <span style={{color:"#38bdf8",fontWeight:700,fontSize:15}}>⏱ {l.minutes} phút</span>
              <span style={{fontSize:12,color:"#64748b",marginLeft:8}}>{l.date}</span>
              {l.note&&<div style={{fontSize:13,color:"#94a3b8",marginTop:3}}>{l.note}</div>}
            </div>
            <button onClick={()=>setData((d:any)=>({...d,studyLog:d.studyLog.filter((x:any)=>x.id!==l.id)}))}
              style={S.delBtn}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 4 — SOẠN BÀI
// ══════════════════════════════════════════════════════════════
function TabLessons({data,setData,doneLessons}:any) {
  const [lesson,setLesson]=useState("");
  const [subject,setSubject]=useState("");
  const [status,setStatus]=useState("chưa soạn");
  const [panelOpen,setPanelOpen]=useState(false);
  const add=()=>{
    if(!lesson.trim())return;
    setData((d:any)=>({...d,lessons:[...d.lessons,{id:Date.now(),subject,lesson:lesson.trim(),status}]}));
    setLesson("");setSubject("");setPanelOpen(false);
  };
  return (
    <div>
      <FabAdd onClick={()=>setPanelOpen(true)} color="#10b981"/>
      <AddPanel open={panelOpen} onClose={()=>setPanelOpen(false)} title="➕ Thêm bài soạn" color="#10b981">
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Môn</div>
            <input value={subject} onChange={e=>setSubject(e.target.value)}
              placeholder="Toán, Văn, Anh..." style={S.input} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Tên bài soạn</div>
            <input value={lesson} onChange={e=>setLesson(e.target.value)}
              placeholder="Tên bài..." onKeyDown={e=>e.key==="Enter"&&add()} style={S.input}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Trạng thái</div>
            <select value={status} onChange={e=>setStatus(e.target.value)} style={{...S.select,width:"100%"}}>
              <option value="chưa soạn">Chưa soạn</option>
              <option value="đang soạn">Đang soạn</option>
              <option value="hoàn thành">Hoàn thành</option>
            </select>
          </div>
          <button onClick={add} style={{...S.btn,background:"#10b981",width:"100%",justifyContent:"center",marginTop:4}}>
            + Thêm bài
          </button>
        </div>
      </AddPanel>

      {/* Progress */}
      <div style={{...S.card,padding:"12px 14px",marginBottom:14}}>
        <div style={{fontSize:13,color:"#94a3b8",marginBottom:8}}>
          Tiến trình: <b style={{color:"#10b981"}}>{doneLessons}/{data.lessons.length}</b>
        </div>
        <div style={{background:"#0d1829",borderRadius:999,height:7}}>
          <div style={{
            width:data.lessons.length?`${doneLessons/data.lessons.length*100}%`:"0%",
            height:"100%",background:"#10b981",borderRadius:999,transition:"width 0.4s"
          }}/>
        </div>
      </div>

      {data.lessons.length===0&&<Empty text="Chưa có bài soạn nào"/>}
      {data.lessons.map((l:any)=>(
        <div key={l.id} style={{...S.card,borderLeft:`3px solid ${STATUS_COLOR[l.status]}`}}>
          <div style={{padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontWeight:600,fontSize:14,color:"#f8fafc",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.lesson}</div>
              {l.subject&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>📚 {l.subject}</div>}
            </div>
            <select value={l.status} onChange={e=>setData((d:any)=>({...d,lessons:d.lessons.map((x:any)=>x.id===l.id?{...x,status:e.target.value}:x)}))}
              style={{...S.select,fontSize:12,padding:"5px 8px",flexShrink:0}}>
              <option value="chưa soạn">Chưa soạn</option>
              <option value="đang soạn">Đang soạn</option>
              <option value="hoàn thành">Hoàn thành</option>
            </select>
            <span style={{fontSize:10,padding:"3px 8px",borderRadius:999,background:STATUS_COLOR[l.status]+"33",
              color:STATUS_COLOR[l.status],fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>{l.status}</span>
            <button onClick={()=>setData((d:any)=>({...d,lessons:d.lessons.filter((x:any)=>x.id!==l.id)}))}
              style={S.delBtn}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB 5 — CHI TIÊU
// ══════════════════════════════════════════════════════════════
function TabFinance({data,setData}:any) {
  const [newIncome,setNewIncome]=useState("");
  const [newDebt,setNewDebt]=useState("");
  const [newExp,setNewExp]=useState("");
  const [newExpMin,setNewExpMin]=useState("");
  const [outDate,setOutDate]=useState(localDateStr());
  const [outNote,setOutNote]=useState("");
  const [outAmt,setOutAmt]=useState("");
  const [panelType,setPanelType]=useState<"income"|"debt"|"expense"|"outing"|null>(null);

  const upd=(key:string,val:any)=>setData((d:any)=>({...d,finance:{...d.finance,[key]:val}}));
  const fmt=(n:number)=>n.toLocaleString("vi-VN")+"đ";

  const totalIncome=data.finance.income.reduce((a:number,b:any)=>a+(+b.amount||0),0);
  const totalDebt=data.finance.debt.reduce((a:number,b:any)=>a+(+b.amount||0),0);
  const totalExp=data.finance.expenses.reduce((a:number,b:any)=>a+(+b.amount||0),0);
  const totalOut=data.finance.outings.reduce((a:number,b:any)=>a+(+b.amount||0),0);
  const remaining=totalIncome-totalDebt-totalExp-totalOut;

  const panelMeta:Record<string,{title:string;color:string}> = {
    income:{title:"➕ Thêm nguồn thu",color:"#10b981"},
    debt:{title:"➕ Thêm khoản nợ",color:"#f43f5e"},
    expense:{title:"➕ Thêm chi phí cố định",color:"#f97316"},
    outing:{title:"➕ Ghi lần đi chơi",color:"#a78bfa"},
  };

  return (
    <div>
      {/* FAB với menu chọn loại */}
    <div style={{
  position:"sticky",
  bottom:"calc(env(safe-area-inset-bottom,16px) + 16px)",
  display:"flex",flexDirection:"column",alignItems:"flex-end",
  gap:10,pointerEvents:"none",zIndex:150,marginBottom:8,
}}>
        {panelType===null && (
          <>
            {[
              {type:"outing" as const,icon:"🎉",color:"#a78bfa"},
              {type:"expense" as const,icon:"🧾",color:"#f97316"},
              {type:"debt" as const,icon:"💳",color:"#f43f5e"},
              {type:"income" as const,icon:"💵",color:"#10b981"},
            ].map(({type,icon,color})=>(
              <button key={type} onClick={()=>setPanelType(type)} style={{
                background:color,border:"none",borderRadius:999,
                color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",
                padding:"8px 14px",boxShadow:"0 3px 12px rgba(0,0,0,0.4)",
                display:"flex",alignItems:"center",gap:6,
                whiteSpace:"nowrap",
              }}>{icon} {panelMeta[type].title.replace("➕ Thêm ","").replace("➕ Ghi ","")}</button>
            ))}
          </>
        )}
        <button onClick={()=>setPanelType(p=>p===null?"income":null)} style={{
          width:52,height:52,borderRadius:"50%",
          background:"#38bdf8",border:"none",
          color:"#0a0f1e",fontSize:26,fontWeight:700,cursor:"pointer",
          boxShadow:"0 4px 20px rgba(0,0,0,0.4)",
          display:"flex",alignItems:"center",justifyContent:"center",
          transform:panelType!==null?"rotate(45deg)":"rotate(0deg)",
          transition:"transform 0.2s",
        }}>＋</button>
      </div>

      {/* Panels */}
      <AddPanel open={panelType==="income"} onClose={()=>setPanelType(null)}
        title={panelMeta.income.title} color={panelMeta.income.color}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Tên nguồn thu</div>
            <input value={newIncome} onChange={e=>setNewIncome(e.target.value)}
              placeholder="Dạy kèm, lương..." style={S.input} autoFocus
              onKeyDown={e=>e.key==="Enter"&&newIncome.trim()&&(upd("income",[...data.finance.income,{id:Date.now(),label:newIncome.trim(),amount:0}]),setNewIncome(""),setPanelType(null))}/>
          </div>
          <button onClick={()=>{if(!newIncome.trim())return;upd("income",[...data.finance.income,{id:Date.now(),label:newIncome.trim(),amount:0}]);setNewIncome("");setPanelType(null);}}
            style={{...S.btn,background:"#10b981",width:"100%",justifyContent:"center"}}>+ Thêm</button>
        </div>
      </AddPanel>

      <AddPanel open={panelType==="debt"} onClose={()=>setPanelType(null)}
        title={panelMeta.debt.title} color={panelMeta.debt.color}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Tên khoản nợ</div>
            <input value={newDebt} onChange={e=>setNewDebt(e.target.value)}
              placeholder="Seasy, HD..." style={S.input} autoFocus
              onKeyDown={e=>e.key==="Enter"&&newDebt.trim()&&(upd("debt",[...data.finance.debt,{id:Date.now(),label:newDebt.trim(),amount:0,paid:false}]),setNewDebt(""),setPanelType(null))}/>
          </div>
          <button onClick={()=>{if(!newDebt.trim())return;upd("debt",[...data.finance.debt,{id:Date.now(),label:newDebt.trim(),amount:0,paid:false}]);setNewDebt("");setPanelType(null);}}
            style={{...S.btn,background:"#f43f5e",width:"100%",justifyContent:"center"}}>+ Thêm</button>
        </div>
      </AddPanel>

      <AddPanel open={panelType==="expense"} onClose={()=>setPanelType(null)}
        title={panelMeta.expense.title} color={panelMeta.expense.color}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Tên chi phí</div>
            <input value={newExp} onChange={e=>setNewExp(e.target.value)}
              placeholder="Xăng xe, điện..." style={S.input} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Số tiền tối thiểu (đ)</div>
            <input type="number" value={newExpMin} onChange={e=>setNewExpMin(e.target.value)}
              placeholder="0" style={S.input}/>
          </div>
          <button onClick={()=>{if(!newExp.trim())return;upd("expenses",[...data.finance.expenses,{id:Date.now(),label:newExp.trim(),amount:0,min:+newExpMin||0}]);setNewExp("");setNewExpMin("");setPanelType(null);}}
            style={{...S.btn,background:"#f97316",width:"100%",justifyContent:"center"}}>+ Thêm</button>
        </div>
      </AddPanel>

      <AddPanel open={panelType==="outing"} onClose={()=>setPanelType(null)}
        title={panelMeta.outing.title} color={panelMeta.outing.color}>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ngày</div>
            <input type="date" value={outDate} onChange={e=>setOutDate(e.target.value)} style={S.input}/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Ghi chú</div>
            <input value={outNote} onChange={e=>setOutNote(e.target.value)}
              placeholder="Đi đâu, làm gì..." style={S.input} autoFocus/>
          </div>
          <div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:6}}>Số tiền (đ)</div>
            <input type="number" value={outAmt} onChange={e=>setOutAmt(e.target.value)}
              placeholder="0" style={S.input}
              onKeyDown={e=>e.key==="Enter"&&outAmt&&(upd("outings",[...data.finance.outings,{id:Date.now(),date:outDate,note:outNote.trim(),amount:+outAmt}]),setOutNote(""),setOutAmt(""),setPanelType(null))}/>
          </div>
          <button onClick={()=>{if(!outAmt)return;upd("outings",[...data.finance.outings,{id:Date.now(),date:outDate,note:outNote.trim(),amount:+outAmt}]);setOutNote("");setOutAmt("");setPanelType(null);}}
            style={{...S.btn,background:"#a78bfa",color:"#fff",width:"100%",justifyContent:"center"}}>+ Ghi</button>
        </div>
      </AddPanel>
    <div>
      {/* Month picker */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <span style={{fontSize:13,color:"#94a3b8",flexShrink:0}}>📅 Tháng:</span>
        <input type="month" value={data.finance.month}
          onChange={e=>upd("month",e.target.value)}
          style={{...S.input,flex:1,fontSize:14,padding:"9px 12px"}}/>
      </div>

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        {[
          {lbl:"Tổng lương",val:fmt(totalIncome),color:"#10b981",icon:"💵"},
          {lbl:"Tổng nợ",val:fmt(totalDebt),color:"#f43f5e",icon:"💳"},
          {lbl:"Chi phí",val:fmt(totalExp+totalOut),color:"#f97316",icon:"🧾"},
          {lbl:"Còn lại",val:fmt(remaining),color:remaining>=0?"#38bdf8":"#f43f5e",icon:"🏦"},
        ].map(s=>(
          <div key={s.lbl} style={{...S.card,padding:"12px 14px",borderTop:`3px solid ${s.color}`,marginBottom:0}}>
            <div style={{fontSize:20,marginBottom:4}}>{s.icon}</div>
            <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* LƯƠNG */}
      <FinSection title="💵 Lương" total={fmt(totalIncome)} color="#10b981">
        {data.finance.income.map((item:any)=>(
          <FinRow key={item.id} label={item.label}
            value={item.amount}
            onChange={(v:any)=>upd("income",data.finance.income.map((x:any)=>x.id===item.id?{...x,amount:v}:x))}
            onDelete={()=>upd("income",data.finance.income.filter((x:any)=>x.id!==item.id))}/>
        ))}
      </FinSection>

      {/* NỢ */}
      <FinSection title="💳 Nợ cần trả" total={fmt(totalDebt)} color="#f43f5e">
        {data.finance.debt.map((item:any)=>(
          <FinRow key={item.id} label={item.label} paid={item.paid}
            value={item.amount}
            onChange={(v:any)=>upd("debt",data.finance.debt.map((x:any)=>x.id===item.id?{...x,amount:v}:x))}
            onDelete={()=>upd("debt",data.finance.debt.filter((x:any)=>x.id!==item.id))}
            onTogglePaid={()=>upd("debt",data.finance.debt.map((x:any)=>x.id===item.id?{...x,paid:!x.paid}:x))}/>
        ))}
      </FinSection>

      {/* CHI PHÍ */}
      <FinSection title="🧾 Chi phí cố định" total={fmt(totalExp)} color="#f97316">
        {data.finance.expenses.map((item:any)=>{
          const amt=+item.amount||0;
          const below=item.min&&amt<item.min;
          return (
            <FinRow key={item.id} label={item.label} hint={item.min>0?(below?`⚠ min ${item.min.toLocaleString("vi-VN")}đ`:"✓ đủ"):""} hintColor={below?"#f43f5e":"#10b981"}
              value={item.amount}
              onChange={(v:any)=>upd("expenses",data.finance.expenses.map((x:any)=>x.id===item.id?{...x,amount:v}:x))}
              onDelete={()=>upd("expenses",data.finance.expenses.filter((x:any)=>x.id!==item.id))}
              borderColor={below?"#f43f5e":undefined}/>
          );
        })}
      </FinSection>

      {/* ĐI CHƠI */}
      <FinSection title="🎉 Đi chơi" total={fmt(totalOut)} color="#a78bfa">
        {!data.finance.outings.length&&<div style={{fontSize:13,color:"#475569",textAlign:"center",padding:"10px 0"}}>Chưa có lần đi chơi 🎈</div>}
        {[...data.finance.outings].sort((a:any,b:any)=>b.date.localeCompare(a.date)).map((o:any)=>(
          <div key={o.id} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:"1px solid #1a2735"}}>
            <span style={{fontSize:11,color:"#64748b",flexShrink:0,minWidth:76}}>📅 {o.date}</span>
            <span style={{flex:1,fontSize:13,color:"#e2e8f0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.note?o.note:<span style={{color:"#475569",fontStyle:"italic"}}>Không ghi chú</span>}</span>
            <span style={{fontWeight:700,color:"#a78bfa",fontSize:13,flexShrink:0}}>{(+o.amount).toLocaleString("vi-VN")}đ</span>
            <button onClick={()=>upd("outings",data.finance.outings.filter((x:any)=>x.id!==o.id))} style={S.delBtn}>✕</button>
          </div>
        ))}
      </FinSection>
    </div>
  );
}

function FinSection({title,total,color,children}:any){
  return (
    <div style={{...S.card,marginBottom:14}}>
      <div style={{padding:"11px 14px",borderBottom:"1px solid #1f2d44",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontWeight:700,fontSize:14,color:"#f8fafc"}}>{title}</span>
        <span style={{fontWeight:700,color,fontSize:14}}>{total}</span>
      </div>
      <div style={{padding:"8px 14px"}}>{children}</div>
    </div>
  );
}

function FinRow({label,value,onChange,onDelete,paid,onTogglePaid,hint,hintColor,borderColor}:any){
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 0",borderBottom:"1px solid #1a2735",opacity:paid?0.5:1}}>
      {onTogglePaid&&(
        <input type="checkbox" checked={paid} onChange={onTogglePaid}
          style={{width:18,height:18,accentColor:"#10b981",cursor:"pointer",flexShrink:0}}/>
      )}
      <div style={{flex:1,minWidth:0}}>
        <span style={{fontSize:14,color:paid?"#475569":"#e2e8f0",textDecoration:paid?"line-through":"none",
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",display:"block"}}>{label}</span>
        {hint&&<span style={{fontSize:11,color:hintColor,fontWeight:600}}>{hint}</span>}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
        <input type="number" value={value||""} onChange={e=>onChange(e.target.value)} placeholder="0"
          style={{...S.input,width:100,padding:"6px 8px",fontSize:13,textAlign:"right",borderColor:borderColor||"#1f2d44"}}/>
        <span style={{fontSize:12,color:"#475569"}}>đ</span>
        <button onClick={onDelete} style={S.delBtn}>✕</button>
      </div>
    </div>
  );
}

function Empty({text}:any){
  return <div style={{textAlign:"center",color:"#475569",padding:"36px 0",fontSize:14}}>😴 {text}</div>;
}
