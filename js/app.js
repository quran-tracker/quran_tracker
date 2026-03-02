// Never fail silently
window.addEventListener('error', (e)=>{
  try{ showToast(`خطأ: ${e?.message || 'unknown'}`); }catch(_){ }
  try{ console.error(e); }catch(_){ }
});
window.addEventListener('unhandledrejection', (e)=>{
  try{ showToast(`خطأ: ${e?.reason?.code || e?.reason?.message || 'promise rejected'}`); }catch(_){ }
  try{ console.error(e); }catch(_){ }
});


  const firebaseConfig = {
  "apiKey": "AIzaSyA4Q9sgwE7U0tIAE5obAoU6OIPKd-9_7Dk",
  "authDomain": "safwa3-ad381.firebaseapp.com",
  "projectId": "safwa3-ad381",
  "storageBucket": "safwa3-ad381.firebasestorage.app",
  "messagingSenderId": "380123503518",
  "appId": "1:380123503518:web:c520823283b420d499148f",
  "measurementId": "G-6SZ4HR9BDK"
};
  const PART_RANGES = {"1": {"start": 1, "end": 21}, "2": {"start": 22, "end": 41}, "3": {"start": 42, "end": 61}, "4": {"start": 62, "end": 81}, "5": {"start": 82, "end": 101}, "6": {"start": 102, "end": 121}, "7": {"start": 122, "end": 141}, "8": {"start": 142, "end": 161}, "9": {"start": 162, "end": 181}, "10": {"start": 182, "end": 201}, "11": {"start": 202, "end": 221}, "12": {"start": 222, "end": 241}, "13": {"start": 242, "end": 261}, "14": {"start": 262, "end": 281}, "15": {"start": 282, "end": 301}, "16": {"start": 302, "end": 321}, "17": {"start": 322, "end": 341}, "18": {"start": 342, "end": 361}, "19": {"start": 362, "end": 381}, "20": {"start": 382, "end": 401}, "21": {"start": 402, "end": 421}, "22": {"start": 422, "end": 441}, "23": {"start": 442, "end": 461}, "24": {"start": 462, "end": 481}, "25": {"start": 482, "end": 501}, "26": {"start": 502, "end": 521}, "27": {"start": 522, "end": 541}, "28": {"start": 542, "end": 561}, "29": {"start": 562, "end": 581}, "30": {"start": 582, "end": 604}};

  // Compatibility helper (older code used partRanges(partNum))
  function partRanges(partNum){
    const key = String(partNum);
    if (typeof PART_RANGES !== 'undefined' && PART_RANGES[key]) return PART_RANGES[key];
    const n = Number(partNum);
    if (!n || n < 1) return { start: "-", end: "-" };
    const start = (n - 1) * 20 + 1;
    const end = Math.min(n * 20, 604);
    return { start, end };
  }
  import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
  import {getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail , setPersistence , browserLocalPersistence} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
  import {getFirestore, doc, getDoc, setDoc, collection, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, onSnapshot, orderBy , writeBatch} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

  const el = (id)=>document.getElementById(id);

  const rowsEl = el("rows");
  const authStatusEl = el("authStatus");
  const partsGridEl = el("partsGrid");
  const greetEl = el("greet");
  const globalLastEl = el("globalLast");
  const lastSavedEl = el("lastSaved");

  const toastEl = el("toast");
  const toastTextEl = el("toastText");

  const introOverlay = el("introOverlay");
  const introTitle = el("introTitle");
  const introSub = el("introSub");
  const introBody = el("introBody");
  const dotsEl = el("dots");
  const prevIntroBtn = el("prevIntroBtn");
  const nextIntroBtn = el("nextIntroBtn");

  function fmtDate(iso){
    if(!iso) return "—";
    try{ return new Date(iso).toLocaleString("ar"); }catch{ return "—"; }
  }

  function showToast(msg){
  if(!toastEl || !toastTextEl) return;
  toastTextEl.textContent = (msg ?? "").toString();
  toastEl.classList.add("show");
  clearTimeout(window.__toastT);
  window.__toastT = setTimeout(()=>toastEl.classList.remove("show"), 2600);
}

// --- Reviews helpers ---
function __daysBetween(nowMs, thenMs){
  const diff = Math.max(0, nowMs - thenMs);
  return Math.floor(diff / (1000*60*60*24));
}
function __tsToMs(v){
  if(!v) return null;
  if(typeof v === "number") return v;
  if(typeof v === "string"){
    const t = Date.parse(v);
    return Number.isFinite(t) ? t : null;
  }
  // Firestore Timestamp {seconds, nanoseconds}
  if(typeof v === "object" && typeof v.seconds === "number"){
    return (v.seconds*1000) + Math.floor((v.nanoseconds||0)/1e6);
  }
  if(v instanceof Date) return v.getTime();
  return null;
}
function __formatAgo(days){
  if(days === null) return "لم تُراجع بعد";
  if(days === 0) return "اليوم";
  if(days === 1) return "قبل يوم";
  return `قبل ${days} أيام`;
}
function __getReviewsByPage(userDoc){
  return (userDoc && userDoc.reviews && userDoc.reviews.byPage && typeof userDoc.reviews.byPage === "object") ? userDoc.reviews.byPage : {};
}

function __isPageFullyCompleted(pg){
  try{
    if(!pg || !pg.tasmee3) return false;
    const allRec = Array.isArray(pg.recite) && pg.recite.every(Boolean);
    const allNear = Array.isArray(pg.near) && pg.near.every(Boolean);
    const allFar = Array.isArray(pg.far) && pg.far.every(Boolean);
    return allRec && allNear && allFar;
  }catch(_){ return false; }
}

function __partHasAnyCompletedPage(partRaw, partNum){
  try{
    const part = partRaw || {};
    const r = PART_RANGES[String(partNum)];
    if(!r) return false;
    const pagesObj = part.pages ?? part.pageData ?? {};
    for(let pg=r.start; pg<=r.end; pg++){
      const raw = pagesObj[String(pg)] || {};
      const norm = normalizePage(raw);
      if(__isPageFullyCompleted(norm)) return true;
    }
    return false;
  }catch(_){ return false; }
}

function __partReviewMaxAgeDays(partNum, userDoc){
  // IMPORTANT: Reviews status should reflect ONLY *reviewable* pages
  // (fully completed: tasmee3 + all circles). Incomplete/locked pages are ignored.
  const pages = pagesForPart(partNum);
  const byPage = __getReviewsByPage(userDoc);
  const now = Date.now();
  let maxDays = 0;
  let hasMissing = false;
  let hasAnyComplete = false;

  const partObj = (userDoc && userDoc.parts && userDoc.parts[String(partNum)]) ? userDoc.parts[String(partNum)] : null;
  const pagesObj = (partObj && (partObj.pages ?? partObj.pageData)) ? (partObj.pages ?? partObj.pageData) : {};

  for(const pg of pages){
    const raw = pagesObj[String(pg)] || {};
    const norm = normalizePage(raw);
    if(!__isPageFullyCompleted(norm)) continue; // ignore non-reviewable pages

    hasAnyComplete = true;
    const rec = byPage[String(pg)];
    const ms = __tsToMs(rec && rec.lastReviewedAt);
    if(ms === null){ hasMissing = true; continue; }
    const d = __daysBetween(now, ms);
    if(d > maxDays) maxDays = d;
  }

  if(!hasAnyComplete) return 0; // part should be locked anyway
  if(hasMissing) return 9999;
  return maxDays;
}
function __partReviewClass(maxDays){
  if(maxDays > 14) return "staleHot";
  if(maxDays > 7) return "staleWarn";
  return "";
}


  const toast = (title, msg)=> showToast((msg || title || "").toString());

  window.addEventListener('error', (e)=>{ try{ showToast('خطأ: ' + (e.message||'')); }catch(_){} });


  function setAuthStatus(msg, kind=""){
    authStatusEl.textContent = msg;
    authStatusEl.className = "status" + (kind ? " "+kind : "");
  }

  function showOnly(which){
    el("authCard").classList.toggle("hide", which !== "auth");
    el("dash").classList.toggle("hide", which !== "dash");
    el("partView").classList.toggle("hide", which !== "part");
  }
// Intro steps (wizard)
  const INTRO_STEPS = [
    { title:"أهلًا في الحلقة 🌸", sub:"هدفنا حفظ ثابت ومتين، مش بس “نخلص صفحات”.",
      body:"عشان هيك نمشي على نظام بسيط: <b>لكل صفحة 3 مراحل + تسميع واحد</b> ✅<br><br><span class='mini'>ملاحظة: هذا النظام لمصحف المدينة (604 صفحة).</span>" },
    { title:"المرحلة الأولى — تلاوة غيبًا (بدون أخطاء)", sub:"بعد ما نحفظ الصفحة:",
      body:"• نقرأها <b>10 مرات غيبًا</b> بدون أخطاء.<br>• كل مرة صحيحة نلوّن دائرة من <b>تلاوة غيبًا</b>.<br><br><span class='mini'>إذا صار خطأ كبير: نثبّت ونكمل لحد ما تصير التلاوة سليمة.</span>" },
    { title:"المرحلة الثانية — المراجعة القريبة (الأسبوع الأول)", sub:"خلال الأسبوع الأول بعد حفظ الصفحة:",
      body:"• نراجع الصفحة عدة مرات (حسب طاقتنا).<br>• لكل مراجعة نلوّن دائرة من <b>مراجعة قريبة</b>." },
    { title:"المرحلة الثالثة — المراجعة البعيدة (خلال الشهر)", sub:"خلال الشهر بعد ",
      body:"• نراجع الصفحة عدة مرات متفرّقة.<br>• لكل مراجعة نلوّن دائرة من <b>مراجعة بعيدة</b>." },
    { title:"التسميع — مرة واحدة", sub:"التسميع ممكن قبل أو بعد (ما في مشكلة).",
      body:"بعد ما الصفحة تكون جاهزة: نسمّعها غيبًا (على صاحبة/مُسَمِّعة).<br>لما يتم التسميع بنجاح نعلّم مربع <b>تسميع</b>.<br><br><b>التسميع للصفحة يكون مرة واحدة فقط.</b>" },
    { title:"إتمام الجزء ✅🌙", sub:"حتى نعتبر الجزء مكتمل:",
      body:"لازم نعمل خطوتين:<br>1) ✅ <b>تسميع الجزء غيبًا</b><br>2) ✅ <b>اختبار المواضع (اختبار الجزء)</b><br><br><span class='mini'>“مكتمل ✅” للجزء لا يظهر إلا بعد إتمام التسميع + الاختبار.</span>" }
  ];
  let introIdx = 0;

  function renderIntro(){
    const s = INTRO_STEPS[introIdx];
    introTitle.textContent = s.title;
    introSub.textContent = s.sub;
    introBody.innerHTML = s.body;

    dotsEl.innerHTML = "";
    INTRO_STEPS.forEach((_,i)=>{
      const d = document.createElement("div");
      d.className = "dot" + (i===introIdx ? " on" : "");
      dotsEl.appendChild(d);
    });

    prevIntroBtn.style.visibility = introIdx===0 ? "hidden" : "visible";
    nextIntroBtn.textContent = introIdx===INTRO_STEPS.length-1 ? "ابدئي الآن" : "التالي";
  }

  function openIntro(){ introIdx=0; renderIntro(); introOverlay.classList.remove("hide"); }
  function closeIntro(){ introOverlay.classList.add("hide"); }

  prevIntroBtn.addEventListener("click", ()=>{ if(introIdx>0){ introIdx--; renderIntro(); }});
  nextIntroBtn.addEventListener("click", async ()=>{
    if(introIdx < INTRO_STEPS.length-1){ introIdx++; renderIntro(); return; }
    closeIntro(); await markIntroSeen();
  });
  el("closeIntroBtn").addEventListener("click", async ()=>{ closeIntro(); await markIntroSeen(); });

  // email panel toggle
  el("showEmailBtn").addEventListener("click", ()=>{ el("emailPanel").style.display="block"; });
  el("hideEmailBtn").addEventListener("click", ()=>{ el("emailPanel").style.display="none"; });

  // circles builders
  function makeCircles(n, cols, stateArr){
    const wrap = document.createElement("div");
    wrap.className = "circles " + (cols===5 ? "grid5" : cols===3 ? "grid3" : "grid2");
    for(let i=0;i<n;i++){
      const c = document.createElement("div");
      c.className = "c" + (stateArr?.[i] ? " on" : "");
      c.addEventListener("click", ()=>{
        c.classList.toggle("on");
        scheduleAutosave();
      });
      wrap.appendChild(c);
    }
    return wrap;
  }
  function readCircles(container){
    return [...container.querySelectorAll(".c")].map(x=>x.classList.contains("on"));
  }

  // ---- Compatibility layer (keeps old saved data visible) ----
  function toBoolArray(v, n){
    if(Array.isArray(v)){
      // normalize to booleans, pad/truncate
      const out = v.map(Boolean).slice(0,n);
      while(out.length<n) out.push(false);
      return out;
    }
    if(typeof v === "number"){
      // treat number as count of completed circles
      const out = Array(n).fill(false);
      for(let i=0;i<Math.min(n, v);i++) out[i]=true;
      return out;
    }
    return Array(n).fill(false);
  }

  function normalizePage(raw){
    const pg = raw && typeof raw === "object" ? raw : {};
    // recite (10)
    const recite = pg.recite ?? pg.tilawa ?? pg.mem ?? pg.newMem ?? pg.hifz ?? pg.ghiban ?? pg.talaawa;
    // near (6)
    const near = pg.near ?? pg.close ?? pg.closeReview ?? pg.nearReview ?? pg.week ?? pg.week1 ?? pg.qareeba ?? pg.reviewClose;
    // far (4)
    const far = pg.far ?? pg.farReview ?? pg.month ?? pg.ba3eeda ?? pg.reviewFar ?? pg.longReview;
    // tasmee3 bool
    const tas = pg.tasmee3 ?? pg.tasme3 ?? pg.tasmee ?? pg.tasmee3Done ?? pg.tasmee3Checked ?? pg.tasmeeDone ?? false;

    return {
      recite: toBoolArray(recite, 10),
      near: toBoolArray(near, 6),
      far: toBoolArray(far, 4),
      tasmee3: !!tas,
      notes: (pg.notes ?? pg.note ?? pg.comment ?? "").toString()
    };
  }
  // ------------------------------------------------------------

  function rowForPage(pageNum, dataRaw={}){
    const data = normalizePage(dataRaw);

    const tr = document.createElement("tr");
    tr.dataset.page = String(pageNum);

    const tdPage = document.createElement("td"); tdPage.textContent = String(pageNum);

    const tdRecite = document.createElement("td");
    tdRecite.appendChild(makeCircles(10, 5, data.recite));

    const tdNear = document.createElement("td");
    tdNear.appendChild(makeCircles(6, 3, data.near));

    const tdFar = document.createElement("td");
    tdFar.appendChild(makeCircles(4, 2, data.far));

    const tdTas = document.createElement("td");
    const tasWrap = document.createElement("div");
    tasWrap.style.display = "flex";
    tasWrap.style.justifyContent = "center";
    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "tasmee3Box";
    chk.checked = !!data.tasmee3;
    chk.addEventListener("change", scheduleAutosave);
    tasWrap.appendChild(chk);
    tdTas.appendChild(tasWrap);

    const tdNotes = document.createElement("td");
    const notesWrap = document.createElement("div");
    notesWrap.style.display = "flex";
    notesWrap.style.justifyContent = "center";
    const inpNotes = document.createElement("input");
    inpNotes.placeholder = "اختياري";
    inpNotes.style.maxWidth = "210px";
    inpNotes.style.width = "100%";
    inpNotes.style.textAlign = "center";
    inpNotes.value = data.notes ?? "";
    inpNotes.addEventListener("input", scheduleAutosave);
    notesWrap.appendChild(inpNotes);
    tdNotes.appendChild(notesWrap);

    tr.append(tdPage, tdRecite, tdNear, tdFar, tdTas, tdNotes);
    rowsEl.appendChild(tr);
  }

  function pagesForPart(partNum){
    const r = PART_RANGES[String(partNum)];
    const out = [];
    for(let p=r.start; p<=r.end; p++) out.push(p);
    return out;
  }

  function collectPart(partNum){
    const pages = {};
    [...rowsEl.querySelectorAll("tr")].forEach(tr=>{
      const page = tr.dataset.page;
      const circles = tr.querySelectorAll(".circles");
      const tas = tr.querySelector("input.tasmee3Box")?.checked || false;
      const notes = tr.querySelector("td:last-child input")?.value?.trim() || "";
      pages[page] = {
        recite: readCircles(circles[0]),
        near: readCircles(circles[1]),
        far: readCircles(circles[2]),
        tasmee3: tas,
        notes
      };
    });
    return {
      details: el("details").value.trim(),
      partTasmee3: el("partTasmee3").checked,
      partTest: el("partTest").checked,
      pages,
      updatedAt: new Date().toISOString()
    };
  }

  function loadPartToUI(partNum, userDoc){
    el("partTitle").textContent = "الجزء " + partNum;
    const r = PART_RANGES[String(partNum)];
    el("partSubtitle").textContent = `صفحات: ${r.start}–${r.end} (مصحف المدينة)`;

    const part = userDoc.parts?.[String(partNum)] ?? {};
    el("details").value = (part.details ?? part.note ?? "").toString();
    el("partTasmee3").checked = !!(part.partTasmee3 ?? part.juzTasmee3 ?? false);
    el("partTest").checked = !!(part.partTest ?? part.juzTest ?? part.mawaqi3Test ?? false);

    lastSavedEl.textContent = "آخر تعديل: " + fmtDate(part.updatedAt);

    rowsEl.innerHTML = "";
    const pagesList = pagesForPart(partNum);
    const savedPages = part.pages ?? part.pageData ?? {};
    pagesList.forEach(p=> rowForPage(p, savedPages[String(p)] || {}));

    el("details").addEventListener("input", scheduleAutosave);
    el("partTasmee3").addEventListener("change", scheduleAutosave);
    el("partTest").addEventListener("change", scheduleAutosave);
  }

  function calcPartProgress(partRaw, partNum){
    const part = partRaw || {};
    const r = PART_RANGES[String(partNum)];
    const totalPages = (r.end - r.start + 1);

    const pagesObj = part.pages ?? part.pageData ?? {};

    //  نسبة الصفحات التي تم تسميعها (checkbox في عمود تسميع الصفحات)
    let memDone = 0;
    for(let p=r.start; p<=r.end; p++){
      const raw = pagesObj[String(p)] || {};
      const pg = normalizePage(raw);
      if(pg.tasmee3) memDone++;
    }
    const حفظPct = totalPages ? Math.round((memDone/totalPages)*100) : 0;

    // تثبيت: نسبة الدوائر/المتابعة لكل الصفحات (حتى لو صفحات غير موجودة بالداتا)
    const perPageTotal = 10 + 6 + 4 + 1; // recite + near + far + tasmee3
    const total = totalPages * perPageTotal;
    let on = 0;
    for(let p=r.start; p<=r.end; p++){
      const raw = pagesObj[String(p)] || {};
      const pg = normalizePage(raw);
      on += pg.recite.filter(Boolean).length;
      on += pg.near.filter(Boolean).length;
      on += pg.far.filter(Boolean).length;
      on += pg.tasmee3 ? 1 : 0;
    }
    const تثبيتPct = total ? Math.round((on/total)*100) : 0;

    const started = (on > 0);
    const done = (حفظPct === 100) && !!(part.partTasmee3 ?? part.juzTasmee3) && !!(part.partTest ?? part.juzTest ?? part.mawaqi3Test);
    return {started, done, حفظPct, تثبيتPct};
  }

  // =================== User Stats (stored) ===================
  // We store per-part memorization/fixation percentages under each user doc
  // so both the personal page and group pages can read them without re-computing.
  // This also avoids the "member summary is old" problem for specific users.
  function computeUserStatsFromParts(userDoc, isoNow){
    const parts = (userDoc && userDoc.parts && typeof userDoc.parts === "object") ? userDoc.parts : {};
    const byPart = {};
    let memSum = 0, memCnt = 0;
    let fixSum = 0, fixCnt = 0;

    for(let p=1; p<=30; p++){
      const raw = parts[String(p)];
      const pr = calcPartProgress(raw, p);
      byPart[String(p)] = {
        memPct: Number(pr.حفظPct || 0) || 0,
        fixPct: Number(pr.تثبيتPct || 0) || 0,
        done: !!pr.done,
        started: !!pr.started
      };
      // Averages on started parts only (more fair / matches user expectation)
      if(byPart[String(p)].memPct > 0){ memSum += byPart[String(p)].memPct; memCnt++; }
      if(byPart[String(p)].fixPct > 0){ fixSum += byPart[String(p)].fixPct; fixCnt++; }
    }

    const avgMemStarted = memCnt ? Math.round(memSum / memCnt) : 0;
    const avgFixStarted = fixCnt ? Math.round(fixSum / fixCnt) : 0;

    return {
      byPart,                 // {"1":{memPct,fixPct,done,started}, ...}
      avgMemStarted,
      avgFixStarted,
      updatedAt: isoNow || new Date().toISOString()
    };
  }

  // ===== Color state mapping for parts (v24_40) =====
function __applyPartStateClass(btn, pr){
  const mem = Number(pr?.حفظPct ?? 0) || 0;
  const fix = Number(pr?.تثبيتPct ?? 0) || 0;

  // reset
  btn.classList.remove("partInProgress","partMemDone","partFixDone");

  // logic:
  // green: mem==100 and fix==100
  if (mem >= 100 && fix >= 100){
    btn.classList.add("partFixDone");
    return;
  }
  // orange: mem==100 and fix<100
  if (mem >= 100){
    btn.classList.add("partMemDone");
    return;
  }
  // pink: started but not completed (either mem>0 or fix>0)
  if (mem > 0 || fix > 0){
    btn.classList.add("partInProgress");
    return;
  }
  // default: leave as-is (not started)
}

function buildPartsGrid(userDoc){
    partsGridEl.innerHTML = "";
    for(let p=1;p<=30;p++){
      const btn = document.createElement("button");
      btn.type="button";
      btn.className="partBtn";
      const part = userDoc.parts?.[String(p)];
      const st = userDoc?.stats?.byPart?.[String(p)];
      const pr = st ? { started:!!st.started, done:!!st.done, حفظPct:Number(st.memPct||0)||0, تثبيتPct:Number(st.fixPct||0)||0 }
                    : calcPartProgress(part, p);

      
      __applyPartStateClass(btn, pr);
const r = PART_RANGES[String(p)];

      let tagText = "";
      if(pr.done){
        tagText = `مكتمل ✅<br>تثبيت: ${pr.تثبيتPct}%`;
      }
    else{
        tagText = ` ${pr.حفظPct}%<br>تثبيت: ${pr.تثبيتPct}%`;
      }

      btn.innerHTML = `<div class="partNum">الجزء ${p}</div>
                       <div class="partMeta">صفحات ${r.start}–${r.end}</div>
                       <div class="tag">${tagText}</div>`;
      btn.addEventListener("click", ()=> openPart(p));
      partsGridEl.appendChild(btn);
    }
  }

  function friendlyAuthError(code){
    const map = {
      "auth/invalid-email":"الإيميل غير صحيح.",
      "auth/user-not-found":"ما في حساب بهذا الإيميل. جرّبي إنشاء حساب.",
      "auth/wrong-password":"كلمة المرور غير صحيحة.",
      "auth/email-already-in-use":"الإيميل مستخدم مسبقًا. جرّبي دخول.",
      "auth/weak-password":"كلمة المرور ضعيفة (6 أحرف على الأقل).",
      "auth/popup-closed-by-user":"تم إغلاق نافذة Google قبل إتمام الدخول.",
      "auth/operation-not-allowed":"فعّلي Google و Email/Password من Firebase Authentication.",
    };
    return map[code] || "حصل خطأ. جرّبي مرة أخرى.";
  }

  // Firebase init
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
// Persist login across refresh
setPersistence(auth, browserLocalPersistence).catch((e)=>{ console.error('persistence error', e); });
  const db = getFirestore(app);

// ===== Groups (v1) =====
const invitesListEl = el("invitesList");
const invitesEmptyEl = el("invitesEmpty");
const myGroupsListEl = el("myGroupsList");
const myGroupsEmptyEl = el("myGroupsEmpty");
let _myGroupsLoadToken = 0;

const groupNameEl = el("groupName");
const groupNEl = el("groupN");
const createGroupBtn = el("createGroupBtn");
const backToGroupsBtn = el("backToGroups");
const createdGroupBoxEl = el("createdGroupBox");
const createdGroupMetaEl = el("createdGroupMeta");
const inviteEmailEl = el("inviteEmail");
const sendInviteBtn = el("sendInviteBtn");
const sentInvitesListEl = el("sentInvitesList");
const sentInvitesEmptyEl = el("sentInvitesEmpty");

// Live invite listeners (avoid duplicated rendering / keep sender+receiver in sync)
let __invitesUnsub1 = null;
let __invitesUnsub2 = null;
let __sentInvitesUnsub = null;
let __groupInvitesUnsub = null;
let __renderInvitesTimer = null;

function stopInviteListeners(){
  try{ __invitesUnsub1 && __invitesUnsub1(); }catch(e){}
  try{ __invitesUnsub2 && __invitesUnsub2(); }catch(e){}
  try{ __sentInvitesUnsub && __sentInvitesUnsub(); }catch(e){}
  try{ __groupInvitesUnsub && __groupInvitesUnsub(); }catch(e){}
  __invitesUnsub1 = __invitesUnsub2 = __sentInvitesUnsub = __groupInvitesUnsub = null;
}

// =============================
// Reviews View
// =============================
function __applyReviewsPartCardEl(cardEl, partNum, userDoc){
  if(!cardEl) return;
  if(cardEl.classList.contains("partLocked")) return;
  const maxDays = __partReviewMaxAgeDays(partNum, userDoc);
  cardEl.classList.remove("staleWarn","staleHot");
  const cls = __partReviewClass(maxDays);
  if(cls) cardEl.classList.add(cls);
}

function renderReviewsParts(userDoc){
  if(!reviewsPartsGridEl) return;

  const onlyFixed = !!(reviewsOnlyFixedChk && reviewsOnlyFixedChk.checked);
  const statsByPart = (userDoc && userDoc.stats && userDoc.stats.byPart) ? userDoc.stats.byPart : {};

  reviewsPartsGridEl.innerHTML = "";
  for(let p=1; p<=30; p++){
    const st = statsByPart[String(p)] || {};
    const memPct = Number(st.memPct||0);
    const fixPct = Number(st.fixPct||0);
    // Unlock part for reviews if it contains at least ONE fully completed page (tasmee3 + all circles)
    const partRaw = (userDoc && userDoc.parts && userDoc.parts[String(p)]) ? userDoc.parts[String(p)] : null;
    const isComplete = __partHasAnyCompletedPage(partRaw, p);
    if(onlyFixed && fixPct < 100) continue;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "partBtn";
    card.dataset.part = String(p);

    if(!isComplete){
      card.classList.add("partLocked");
      card.disabled = true;
      card.title = "لا يوجد أي صفحة مكتملة في هذا الجزء (تسميع + تثبيت كامل).";
    }

    const pr = partRanges(p);
    const maxDays = __partReviewMaxAgeDays(p, userDoc);
    let label;
    if(!isComplete){
      label = `مقفول: لا يوجد صفحات مكتملة`;
    }else{
      label = (maxDays === 9999) ? "يوجد صفحات لم تُراجع بعد" : `أقدم مراجعة: ${__formatAgo(maxDays)}`;
    }

    card.innerHTML = `
      <div class="partNum">الجزء ${p}</div>
      <div class="partMeta">ص ${pr.start}–${pr.end}</div>
      <div class="tag">${label}</div>
    `;

    __applyReviewsPartCardEl(card, p, userDoc);

    if(isComplete){
      card.addEventListener("click", (ev)=>{
      try{
        activeReviewsPart = p;
        // Navigate first, then render (prevents render errors from blocking navigation)
        window.__setActiveView?.("reviewsPart");
        renderReviewsPages(p, userDoc);
      }catch(err){
        console.error("reviews part open error", err);
        // Still try to navigate even if rendering fails
        try{ window.__setActiveView?.("reviewsPart"); }catch(e){}
        toast("خطأ", "صار خطأ بفتح صفحات الجزء. افتحي Console وابعتيلي الخطأ.");
      }
      });
    }

    reviewsPartsGridEl.appendChild(card);
  }

  if(!reviewsPartsGridEl.children.length){
    reviewsPartsGridEl.innerHTML = `<div class="muted">لا يوجد أجزاء مطابقة للفلتر الحالي.</div>`;
  }

  // If we already opened a part, refresh its pages too
  if(activeReviewsPart){
    // Keep the part page fresh if user returns to it
    if((localStorage.getItem("activeView")||"") === "reviewsPart"){
      renderReviewsPages(activeReviewsPart, userDoc);
    }
  }
}

async function markPageReviewed(pageNum){
  if(!currentUser) return;
  // pageNum here is the page index (number). Do NOT call normalizePage (it normalizes page *objects*).
  const pg = Number(pageNum);
  if(!Number.isFinite(pg) || pg <= 0) return;

  const ref = doc(db, "quranTrackers", currentUser.uid);
  const field = `reviews.byPage.${pg}.lastReviewedAt`;
  try{
    // Use setDoc(merge) so it works even if the user doc doesn't exist yet
    await setDoc(ref, {
      [field]: serverTimestamp(),
      reviews: { updatedAt: serverTimestamp() },
    }, { merge: true });

    // Update cache immediately for UI responsiveness
    const now = Date.now();
    cachedDoc = cachedDoc || {};
    cachedDoc.reviews = cachedDoc.reviews || {};
    cachedDoc.reviews.byPage = cachedDoc.reviews.byPage || {};
    cachedDoc.reviews.byPage[String(pg)] = cachedDoc.reviews.byPage[String(pg)] || {};
    cachedDoc.reviews.byPage[String(pg)].lastReviewedAt = now;

    // Re-render current view
    const fresh = cachedDoc;
    renderReviewsParts(fresh);
    if(activeReviewsPart) renderReviewsPages(activeReviewsPart, fresh);
    toast("تم", `تم تسجيل مراجعة صفحة ${pg} ✅`);
  }catch(e){
    console.error(e);
    toast("خطأ", "تعذر حفظ المراجعة. تأكدي من الاتصال.");
  }
}

function renderReviewsPages(partNum, userDoc){
  if(!reviewsRowsEl || !reviewsPartTitleEl || !reviewsPartHintEl) return;
  const p = Number(partNum);
  if(!p){ return; }

  const pr = partRanges(p);
  reviewsPartTitleEl.textContent = `صفحات الجزء ${p}`;
  reviewsPartHintEl.textContent = `من صفحة ${pr.start} إلى ${pr.end}`;

  const pages = pagesForPart(p);
  const byPage = __getReviewsByPage(userDoc);
  const now = Date.now();

  reviewsRowsEl.innerHTML = "";

  for(const pg of pages){
    const rec = byPage[String(pg)];
    const rawPage = ((((userDoc && userDoc.parts && userDoc.parts[String(p)]) ? (userDoc.parts[String(p)].pages ?? userDoc.parts[String(p)].pageData ?? {}) : {})[String(pg)]) || {});
    const pgNorm = normalizePage(rawPage);
    const isPageComplete = __isPageFullyCompleted(pgNorm);
    const ms = __tsToMs(rec && rec.lastReviewedAt);
    const days = (ms === null) ? null : __daysBetween(now, ms);

    const tr = document.createElement("tr");
    tr.classList.add("reviewRow");
    tr.innerHTML = `
      <td style="text-align:center;font-weight:900">${pg}</td>
      <td style="text-align:center;color:var(--muted)">${__formatAgo(days)}</td>
      <td style="text-align:center">
        <button class="btn btnSmall btnPrimary" type="button" data-act="review" style="width:auto">راجعت ✅</button>
      </td>
    `;
    const btn = tr.querySelector('[data-act="review"]');
    if(!isPageComplete){
      tr.classList.add("rowLocked");
      if(btn){ btn.disabled = true; btn.classList.add("btnDisabled"); btn.textContent = "غير مكتملة"; }
    }else{
      // Highlight pages that require review:
      // - Never reviewed => red
      // - >14 days => red
      // - >7 days => yellow/orange
      if(days === null || days > 14) tr.classList.add("staleHot");
      else if(days > 7) tr.classList.add("staleWarn");
      btn?.addEventListener("click", ()=>markPageReviewed(pg));
    }
    reviewsRowsEl.appendChild(tr);
  }

  // Update part card coloring if the pages changed
  if(reviewsPartsGridEl){
    const card = reviewsPartsGridEl.querySelector(`[data-part="${p}"]`);
    if(card) __applyReviewsPartCardEl(card, p, userDoc);
  }
}

async function loadReviewsView(){
  if(!currentUser) return;
  try{
    const userDoc = (cachedDoc ?? await loadUserDoc());
    renderReviewsParts(userDoc);
  }catch(e){
    console.error(e);
    toast("خطأ", "تعذر تحميل المراجعات.");
  }
}



function __scheduleRenderInvites(renderFn){
  // Small debounce because we may merge two snapshots (back-compat queries)
  if(__renderInvitesTimer) clearTimeout(__renderInvitesTimer);
  __renderInvitesTimer = setTimeout(renderFn, 30);
}

// Group page
const groupTitleEl = el("groupTitle");
const groupSubEl = el("groupSub");
const backToGroupsFromGroupBtn = el("backToGroupsFromGroup");
const refreshGroupBtn = el("refreshGroup");

const pickPartsPanelEl = el("pickPartsPanel");
const myPartsSummaryTextEl = el("myPartsSummaryText");
const editMyPartsBtn = el("editMyPartsBtn");

// parts modal elements
const partsOverlayEl = el("partsOverlay");
const partsPickerGridModalEl = el("partsPickerGridModal");
const partsPickerCountModalEl = el("partsPickerCountModal");
const partsModalHintEl = el("partsModalHint");
const partsModalCloseBtn = el("partsModalClose");
const partsModalCancelBtn = el("partsModalCancel");
const partsModalSaveBtn = el("partsModalSave");

// member parts overlay
const memberPartsOverlayEl = el("memberPartsOverlay");
const memberPartsTitleEl = el("memberPartsTitle");
const memberPartsSubtitleEl = el("memberPartsSubtitle");
const memberPartsBodyEl = el("memberPartsBody");
const memberPartsCloseBtn = el("memberPartsClose");
const memberPartsOkBtn = el("memberPartsOk");

const pickPartsHintEl = el("pickPartsHint");
const partsPickerGridEl = el("partsPickerGrid");
const partsPickerCountEl = el("partsPickerCount");
const savePickedPartsBtn = el("savePickedParts");

const groupInviteEmailEl = el("groupInviteEmail");
const groupSendInviteBtn = el("groupSendInvite");
const groupInvitesListEl = el("groupInvitesList");
const groupInvitesEmptyEl = el("groupInvitesEmpty");

const groupMembersListEl = el("groupMembersList");
const groupMembersEmptyEl = el("groupMembersEmpty");

// Reviews view
const reviewsPartsGridEl = el("reviewsPartsGrid");
const reviewsRowsEl = el("reviewsRows");
const reviewsPartTitleEl = el("reviewsPartTitle");
const reviewsPartHintEl = el("reviewsPartHint");
const reviewsOnlyFixedChk = el("reviewsOnlyFixed");
const backToReviewsBtn = el("backToReviews");
let __reviewsGridBound = false;
if(reviewsPartsGridEl && !__reviewsGridBound){
  __reviewsGridBound = true;
  // Event delegation fallback (in case individual listeners are lost due to re-rendering quirks)
  reviewsPartsGridEl.addEventListener("click", (ev)=>{
    const btn = ev.target && ev.target.closest ? ev.target.closest(".partBtn") : null;
    if(!btn) return;
    const p = Number(btn.dataset.part);
    if(!p) return;
    if(btn.disabled || btn.classList.contains("partLocked")) return;
    try{
      activeReviewsPart = p;
      window.__setActiveView?.("reviewsPart");
      const userDoc = cachedDoc || {};
      renderReviewsPages(p, userDoc);
    }catch(err){
      console.error("reviews part delegation error", err);
    }
  });
}

let activeReviewsPart = null;

let activeGroupId = null;
let activeGroupGoalN = null;
let activeGroupName = null;
let pickedParts = [];
const refreshGroupsBtn = el("refreshGroups");

// realtime listener for members
let membersUnsub = null;

let currentUser = null;
      window.currentUser = null;
let pendingGroupsLoad = false; // if user clicks Groups before auth is ready

let currentUserEmail = null;
let createdGroupId = null;
const normEmail = (e)=> (e||"").trim().toLowerCase();
const inviteDocId = (groupId, emailLower)=> `${groupId}__${encodeURIComponent(emailLower)}`;

const fmtTime = (ts)=>{
  try{
    const d = ts?.toDate ? ts.toDate() : (ts instanceof Date ? ts : null);
    if(!d) return "";
    return d.toLocaleString("ar", { hour12:true });
  }catch(e){ return ""; }
};

function itemRow({title, sub, right}){
  const wrap = document.createElement("div");
  wrap.className = "item";
  const meta = document.createElement("div");
  meta.className = "meta";
  const t = document.createElement("div");
  t.className = "title";
  t.textContent = title;
  const s = document.createElement("div");
  s.className = "sub";
  s.textContent = sub || "";
  meta.appendChild(t); meta.appendChild(s);
  const actions = document.createElement("div");
  actions.className = "actions";
  if(right) actions.appendChild(right);
  wrap.appendChild(meta);
  wrap.appendChild(actions);
  return wrap;
}

function makeProgressRing(pct){
  const ring = document.createElement("div");
  ring.className = "progRing";
  const val = (pct===null || pct===undefined || Number.isNaN(Number(pct))) ? null : Math.max(0, Math.min(100, Math.round(Number(pct))));
  if(val === null){
    ring.classList.add("empty");
    ring.style.setProperty("--p", 0);
    ring.innerHTML = "<span>—</span>";
    ring.title = "لا يوجد ملخّص حفظ بعد";
  }else{
    ring.style.setProperty("--p", val);
    ring.innerHTML = `<span>${val}%</span>`;
    ring.title = `نسبة  ${val}%`;
  }
  return ring;
}


async function loadMyGroups(){
  const token = ++_myGroupsLoadToken;
  if(!currentUser){
    myGroupsListEl.innerHTML = "";
    myGroupsEmptyEl.style.display = "block";
    return;
  }
  myGroupsListEl.innerHTML = "";
  myGroupsEmptyEl.style.display = "none";

  let groups = [];
  try{
    const snap = await getDocs(collection(db, "userGroups", currentUser.uid, "groups"));
    console.log("[myGroups] uid:", currentUser.uid, "userGroups count:", snap.size);
    if(snap.size===0){ toast("تنبيه", "لا توجد مجموعات محفوظة تحت حسابك بعد الريفريش. تأكدي أن المجموعات موجودة في Firestore تحت userGroups/UID/groups."); }

    snap.forEach(d=>{ console.log("[myGroups] doc", d.id, d.data()); groups.push({ id: d.id, ...d.data() }); });
  }catch(e){
    console.error(e);
    toast("خطأ", e?.code ? `تعذر تحميل مجموعاتي: ${e.code}` : "تعذر تحميل مجموعاتي.");
  }

  if(token !== _myGroupsLoadToken) return;

  // Fallback: groups I created (حتى لو userGroups ما رجعت لأي سبب)
  if(groups.length === 0){
    try{
      const qOwn = query(collection(db, "groups"), where("createdByUid","==", currentUser.uid));
      const snap2 = await getDocs(qOwn);
      snap2.forEach(d=>{
        const g = d.data() || {};
        groups.push({
          id: d.id,
          groupId: d.id,
          name: g.name,
          goalType: g.goalType,
          goalN: g.goalN,
          joinedAt: g.createdAt
        });
      });
    }catch(e){
      console.error(e);
    }
  }

  if(token !== _myGroupsLoadToken) return;
  if(groups.length === 0){
    myGroupsEmptyEl.style.display = "block";
    return;
  }

  // Sort newest first by joinedAt/createdAt
  groups.sort((a,b)=>{
    const ta = a.joinedAt?.seconds || 0;
    const tb = b.joinedAt?.seconds || 0;
    return tb - ta;
  });

  groups.forEach(g=>{
    const btn = document.createElement("button");
    btn.className = "miniBtn";
    btn.textContent = "فتح";
    const gid = g.groupId || g.id;
    btn.onclick = ()=>openGroupPage(gid);
    const row = itemRow({
      title: g.name || "مجموعة",
      sub: `الهدف: ${g.goalN || "?"} أجزاء`,
      right: btn
    });
    myGroupsListEl.appendChild(row);
  });
}

function openGroupsTab(){ setDashView("groups"); }


async function openGroupPage(groupId){
  activeGroupId = groupId;
  localStorage.setItem("activeGroupId", groupId);
  __setActiveView("group");
  await loadGroupPage();
}

function renderPartsPickerInto(gridEl, countEl){
  if(!gridEl) return;
  gridEl.innerHTML = "";
  const total = 30;
  for(let p=1; p<=total; p++){
    const b = document.createElement("button");
    b.type = "button";
    b.className = "partBtn" + (pickedParts.includes(p) ? " active" : "");
    b.textContent = String(p);
    b.onclick = ()=>{
      if(pickedParts.includes(p)){
        pickedParts = pickedParts.filter(x=>x!==p);
      }else{
        if(activeGroupGoalN && pickedParts.length >= activeGroupGoalN){
          toast("تنبيه", `اختاري بالضبط ${activeGroupGoalN} أجزاء فقط.`);
          return;
        }
        pickedParts = [...pickedParts, p].sort((a,b)=>a-b);
      }
      renderPartsPickerInto(gridEl, countEl);
      updatePartsPickerCountInto(countEl);
    };
    gridEl.appendChild(b);
  }
}

function renderPartsPicker(){
  // legacy (hidden panel) - keep for compatibility
  renderPartsPickerInto(partsPickerGridEl, partsPickerCountEl);
}

function updatePartsPickerCountInto(countEl){
  const n = activeGroupGoalN || 0;
  if(countEl) countEl.textContent = `${pickedParts.length} / ${n}`;
}

function updatePartsPickerCount(){
  updatePartsPickerCountInto(partsPickerCountEl);
}

async function loadGroupInvites(){
  // Live list of *pending* invites for this group (sender view).
  // When the invite is accepted/declined, it disappears automatically.
  groupInvitesListEl.innerHTML = "";
  groupInvitesEmptyEl.style.display = "none";

  if(!activeGroupId) return;

  try{ __groupInvitesUnsub && __groupInvitesUnsub(); }catch(e){}
  __groupInvitesUnsub = null;

  const qInv = query(
    collection(db, "groupInvites"),
    where("groupId","==", activeGroupId),
    where("status","==","pending")
  );

  __groupInvitesUnsub = onSnapshot(qInv, (snap)=>{
    groupInvitesListEl.innerHTML = "";
    groupInvitesEmptyEl.style.display = "none";

    if(snap.empty){
      groupInvitesEmptyEl.textContent = "لا توجد دعوات معلّقة.";
      groupInvitesEmptyEl.style.display = "block";
      return;
    }

    const rows = [];
    snap.forEach(d=>{
      const inv = d.data() || {};
      const t = inv?.createdAt?.seconds ? inv.createdAt.seconds : 0;
      rows.push({ id: d.id, inv, t });
    });
    rows.sort((a,b)=> b.t - a.t);

    // Safety: avoid rendering duplicates even if the callback fires multiple times (cache/server).
    const seen = new Set();
    rows.forEach(({id, inv})=>{
      if(seen.has(id)) return;
      seen.add(id);

      const row = itemRow({
        title: inv.invitedEmail,
        sub: `بانتظار القبول • ${fmtTime(inv.createdAt)}`,
        right: null
      });
      row.dataset.inviteId = id;
      groupInvitesListEl.appendChild(row);
    });
  }, (e)=>{ console.error("groupInvites listener error", e); });
}


async function sendGroupInvite(){
  const emailRaw = (groupInviteEmailEl.value || "").trim();
  const emailLower = normEmail(emailRaw);
  if(!emailLower || !emailLower.includes("@")){ toast("تنبيه","اكتبي إيميل صحيح."); return; }
  if(!activeGroupId){ toast("تنبيه","لا يوجد GroupId."); return; }

  groupSendInviteBtn.disabled = true;
  try{
    const invId = inviteDocId(activeGroupId, emailLower);
    const invRef = doc(db, "groupInvites", invId);
    const invSnap = await getDoc(invRef);

    if(invSnap.exists()){
      const prev = invSnap.data() || {};
      if(prev.status === "pending"){ toast("تنبيه","هذه الدعوة موجودة بالفعل (بانتظار القبول)."); return; }
      if(prev.status === "accepted"){ toast("تنبيه","تم قبول الدعوة سابقًا."); return; }
    }

    await setDoc(invRef, {
      groupId: activeGroupId,
      groupName: activeGroupName || "مجموعة",
      invitedEmail: emailLower,
      invitedEmailLower: emailLower,
      invitedByUid: currentUser.uid,
      invitedByEmail: currentUserEmail,
      status: "pending",
      createdAt: serverTimestamp(),
      resentAt: invSnap.exists() ? serverTimestamp() : null
    }, { merge:true });

    groupInviteEmailEl.value = "";
    toast("تم","تم إرسال الدعوة ✅");
    await loadGroupInvites();
  }catch(e){
    console.error(e);
    toast("خطأ", e?.code ? `تعذر إرسال الدعوة: ${e.code}` : "تعذر إرسال الدعوة.");
  }finally{
    groupSendInviteBtn.disabled = false;
  }
}

function listenToGroupMembers(groupId){
  // Stop previous listener (if any)
  try{ if(membersUnsub) membersUnsub(); }catch(e){}
  membersUnsub = null;

  groupMembersListEl.innerHTML = "";
  groupMembersEmptyEl.style.display = "none";

  if(!groupId){
    groupMembersEmptyEl.style.display = "block";
    groupMembersEmptyEl.textContent = "لا يوجد أعضاء بعد.";
    return;
  }

  const qMem = query(collection(db, "groups", groupId, "members"), orderBy("joinedAt","asc"));
  membersUnsub = onSnapshot(qMem, (snap)=>{
    groupMembersListEl.innerHTML = "";
    groupMembersEmptyEl.style.display = "none";

    if(snap.empty){
      groupMembersEmptyEl.style.display = "block";
      return;
    }

    
const members=[];
    snap.forEach(d=>{
      const m=d.data()||{};
      const ps = m.progressSummary || null;
      const memPct = (ps && typeof ps.avgMem !== "undefined") ? Number(ps.avgMem) : null;

      members.push({
        uid:d.id,
        name:(m.displayName||"").trim() || (m.email? m.email.split("@")[0] : "عضوة"),
        parts: Array.isArray(m.selectedParts)? m.selectedParts : [],
        memPct: (Number.isFinite(memPct) ? memPct : null)
      });
    });

    // Sort by memorization progress (avgMem) descending, then by name
    members.sort((a,b)=>{
      const ap = (a.memPct===null ? -1 : a.memPct);
      const bp = (b.memPct===null ? -1 : b.memPct);
      if(bp !== ap) return bp - ap;
      return a.name.localeCompare(b.name,"ar");
    });

    members.forEach((m, idx) => {
      let subTxt = m.parts.length ? `الأجزاء: ${m.parts.join("، ")}` : "لم تختَر أجزاء بعد";
      const ring = makeProgressRing(m.memPct);
      const row = itemRow({ title: m.name + (m.uid===currentUser?.uid ? " (أنتِ)" : ""), sub: subTxt, right: ring });

const titleEl = row.querySelector(".title");
if(titleEl){
  titleEl.classList.add("titleFlex");
  const rb = document.createElement("div");
  rb.className = "rankBadge";
  rb.textContent = String(idx + 1);
  titleEl.prepend(rb);
}
      row.style.cursor = "pointer";
      row.addEventListener("click", ()=>{
        showMemberParts(m.name + (m.uid===currentUser?.uid ? " (أنتِ)" : ""), m.parts, m.uid);
      });
      groupMembersListEl.appendChild(row);
    });
  }, (err)=>{
    console.error(err);
    groupMembersEmptyEl.style.display = "block";
    toast("خطأ", err?.code ? `تعذر تحميل العضوات: ${err.code}` : "تعذر تحميل العضوات.");
  });
}

async function loadGroupPage(){
  if(!activeGroupId) return;

  const gSnap = await getDoc(doc(db,"groups",activeGroupId));
  if(!gSnap.exists()){
    toast("خطأ","المجموعة غير موجودة.");
    __setActiveView("groups");
    return;
  }
  const g=gSnap.data();
  activeGroupGoalN = Number(g.goalN || 0) || 0;
  activeGroupName = g.name || "مجموعة";
  groupTitleEl.textContent = activeGroupName;
  groupSubEl.textContent = `الهدف: ${activeGroupGoalN} أجزاء`;

  // load my selected parts
  const myMemSnap = await getDoc(doc(db,"groups",activeGroupId,"members",currentUser.uid));
  const myMem = myMemSnap.exists() ? myMemSnap.data() : {};
  pickedParts = Array.isArray(myMem.selectedParts) ? myMem.selectedParts.slice().sort((a,b)=>a-b) : [];
  pickPartsHintEl.textContent = `اختاري بالضبط ${activeGroupGoalN} أجزاء لهدفك في هذه المجموعة.`;
  updateMyPartsSummary();
  // (legacy hidden panel)
  renderPartsPicker();
  updatePartsPickerCount();
  // also prep modal count
  updatePartsPickerCountInto(partsPickerCountModalEl);

  await loadGroupInvites();
  listenToGroupMembers(activeGroupId);
}

async function savePickedParts(btnEl){
  if(!activeGroupId) return;
  if(pickedParts.length !== activeGroupGoalN){
    toast("تنبيه", `لازم تختاري بالضبط ${activeGroupGoalN} أجزاء.`);
    return;
  }
  const b = btnEl || savePickedPartsBtn;
  if(b) b.disabled = true;
  try{
    // setDoc with merge so first-time save works too
    await setDoc(doc(db,"groups",activeGroupId,"members",currentUser.uid), {
      selectedParts: pickedParts,
      updatedAt: serverTimestamp()
    }, { merge: true });

    toast("تم","تم حفظ الأجزاء ✅");
    updateMyPartsSummary();
    // update my published progress for this group (in case parts changed)
    try{ const myDoc = (cachedDoc ?? await loadUserDoc()); await syncMyProgressToGroup(activeGroupId, myDoc); }catch(e){}
  }catch(e){
    console.error(e);
    toast("خطأ", e?.code ? `تعذر  ${e.code}` : "تعذر حفظ الأجزاء.");
  }finally{
    if(b) b.disabled = false;
  }
}

function openPartsModal(){
  if(!activeGroupId || !currentUser) return;
  partsModalHintEl.textContent = `اختاري بالضبط ${activeGroupGoalN} أجزاء.`;
  updatePartsPickerCountInto(partsPickerCountModalEl);
  renderPartsPickerInto(partsPickerGridModalEl, partsPickerCountModalEl);
  partsOverlayEl.classList.remove("hide");
}

function closePartsModal(){
  partsOverlayEl.classList.add("hide");
}

let _memberPreviewToken = 0;
function escHtml(s){
  return String(s ?? "").replace(/[&<>"']/g, (c)=>({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[c]));
}


/* ========= Member progress sync (safe) =========
   We cannot read other users' quranTrackers due to privacy rules.
   So each member writes a *summary* of her progress into:
   groups/{groupId}/members/{uid}
   which is readable to signed-in users (group members), while write is self-only.
*/
function buildProgressFromTracker(userDoc, selectedParts){
  const p = Array.isArray(selectedParts) ? selectedParts.slice().sort((a,b)=>a-b) : [];
  const perPart = {};
  if(!p.length) return { summary:null, perPart:{} };

  let doneCount = 0;
  let avgMemSum = 0;
  let avgFixSumAll = 0;
  let avgFixSumStarted = 0;
  let avgFixCntStarted = 0;

  for(const partNum of p){
    // Prefer stored per-part stats if available
    const st = userDoc?.stats?.byPart?.[String(partNum)];
    const pr = st ? { done: !!st.done, حفظPct: Number(st.memPct||0)||0, تثبيتPct: Number(st.fixPct||0)||0 }
                  : calcPartProgress(userDoc?.parts?.[String(partNum)], partNum);
    if(pr.done) doneCount++;
    avgMemSum += pr.حفظPct;
    avgFixSumAll += pr.تثبيتPct;
    if(pr.تثبيتPct > 0){ avgFixSumStarted += pr.تثبيتPct; avgFixCntStarted++; }
    perPart[String(partNum)] = { memPct: pr.حفظPct, fixPct: pr.تثبيتPct, done: !!pr.done };
  }

  const avgMem = Math.round(avgMemSum / p.length);
  // More fair fixation avg: on started parts only (if none started, show 0)
  const avgFix = avgFixCntStarted ? Math.round(avgFixSumStarted / avgFixCntStarted) : 0;
  const avgFixAll = Math.round(avgFixSumAll / p.length);
  const pct = Math.round((doneCount / p.length) * 100);

  const summary = {
    total: p.length,
    done: doneCount,
    pct,
    avgMem,
    avgFix,
    avgFixAll
  };
  return { summary, perPart };
}

async function syncMyProgressToGroup(groupId, userDoc){
  try{
    if(!groupId || !currentUser?.uid) return;
    // Read my selected parts in this group
    const memRef = doc(db, "groups", groupId, "members", currentUser.uid);
    const memSnap = await getDoc(memRef);
    const mem = memSnap.exists() ? (memSnap.data()||{}) : {};
    const selected = Array.isArray(mem.selectedParts) ? mem.selectedParts : [];

    const { summary, perPart } = buildProgressFromTracker(userDoc, selected);

    await setDoc(memRef, {
      progressSummary: summary,       // {total, done, pct, avgMem, avgFix} or null
      partProgress: perPart,          // {"1":{memPct,fixPct,done}, ...}
      progressUpdatedAt: serverTimestamp()
    }, { merge:true });
  }catch(e){
    console.warn("[syncMyProgressToGroup] failed", groupId, e);
  }
}

async function syncMyProgressToAllGroups(userDoc){
  try{
    if(!currentUser?.uid) return;
    const snap = await getDocs(collection(db, "userGroups", currentUser.uid, "groups"));
    const gids = [];
    snap.forEach(d=>{
      const data=d.data()||{};
      gids.push(data.groupId || d.id);
    });
    // sequential (avoid rate limits)
    for(const gid of gids){
      await syncMyProgressToGroup(gid, userDoc);
    }
  }catch(e){
    console.warn("[syncMyProgressToAllGroups] failed", e);
  }
}

let _progressSyncTimer = null;
function scheduleProgressSync(userDoc){
  try{
    if(_progressSyncTimer) clearTimeout(_progressSyncTimer);
    _progressSyncTimer = setTimeout(()=>syncMyProgressToAllGroups(userDoc), 1200);
  }catch(e){}
}
/* ========= end member progress sync ========= */

async function showMemberParts(name, parts, memberUid){
  const token = ++_memberPreviewToken;
  const p = Array.isArray(parts) ? parts.slice().sort((a,b)=>a-b) : [];

  memberPartsTitleEl.textContent = `تقدّم ${name}`;
  memberPartsSubtitleEl.textContent = p.length ? `الأجزاء المختارة: ${p.length}` : "لم تختر أجزاء بعد";
  memberPartsBodyEl.innerHTML = "<div class='muted'>... جاري التحميل</div>";
  memberPartsOverlayEl.classList.remove("hide");

  // If no parts, nothing else to compute
  if(!p.length){
    if(token !== _memberPreviewToken) return;
    memberPartsBodyEl.innerHTML = "<div class='muted' style='font-size:14px;line-height:1.8'>لا يوجد اختيارات حتى الآن.</div>";
    return;
  }

  
// Read member public progress summary from:
// groups/{groupId}/members/{uid}  (safe to read for signed-in users)
let memberMem = null;
try{
  if(activeGroupId && memberUid){
    const snap = await getDoc(doc(db, "groups", activeGroupId, "members", memberUid));
    if(snap.exists()) memberMem = snap.data();
  }
}catch(e){
  console.warn("[memberProgress] cannot read member summary for", memberUid, e);
  memberMem = null;
}

if(token !== _memberPreviewToken) return;

// Build UI
const header = document.createElement("div");
header.style.marginBottom = "12px";

const sum = memberMem?.progressSummary || null;
const per = memberMem?.partProgress || null;

if(!sum || !per){
  // Fallback: show parts only (still useful)
  header.innerHTML = `<div class='tag' style='text-align:right'>الأجزاء: ${escHtml(p.join("، "))}</div>`;
  memberPartsBodyEl.innerHTML = "";
  memberPartsBodyEl.appendChild(header);
  memberPartsBodyEl.insertAdjacentHTML("beforeend",
    `<div class='muted' style='margin-top:10px;line-height:1.8'>ملاحظة: لم يتم نشر ملخّص التقدّم لهذه العضوة بعد. يظهر تلقائيًا بعد قبولها الدعوة للمجموعة أو بعد حفظ اختيار الأجزاء.</div>`
  );
  return;
}


// Use the published summary (no need to read private quranTrackers)
const doneCount = Number(sum.done || 0);
const avgMem = Number(sum.avgMem || 0);
const avgFix = Number(sum.avgFix || 0);
const pct = Number(sum.pct || 0);

const rows = [];
for(const partNum of p){
  const pp = per[String(partNum)] || {};
  const pr = { حفظPct: Number(pp.memPct||0), تثبيتPct: Number(pp.fixPct||0), done: !!pp.done };
  rows.push({ partNum, pr });
}

header.innerHTML = `
  <div class='row' style='margin-top:0'>
    <div class='tag' style='text-align:right'>مكتمل: ${doneCount} / ${p.length} (${pct}%)</div>
    <div class='tag' style='text-align:right'>متوسط  ${avgMem}% • متوسط التثبيت: ${avgFix}%</div>
  </div>
`;

const list = document.createElement("div");
  list.style.display = "grid";
  list.style.gap = "10px";

  rows.forEach(({partNum, pr})=>{
    const r = PART_RANGES[String(partNum)];
    const box = document.createElement("div");
    box.className = "panel";
    box.style.padding = "12px";
    box.innerHTML = `
      <div style='display:flex;justify-content:space-between;gap:10px;align-items:flex-start;flex-wrap:wrap'>
        <div style='font-weight:900'>الجزء ${partNum}</div>
        <div class='tag'>صفحات ${r.start}–${r.end}</div>
      </div>
      <div class='muted' style='margin-top:6px'> <b>${pr.حفظPct}%</b> • تثبيت: <b>${pr.تثبيتPct}%</b> ${pr.done ? "• <b>مكتمل ✅</b>" : ""}</div>
    `;
    list.appendChild(box);
  });

  memberPartsBodyEl.innerHTML = "";
  memberPartsBodyEl.appendChild(header);
  memberPartsBodyEl.appendChild(list);
}
function closeMemberParts(){
  memberPartsOverlayEl.classList.add("hide");
}

function updateMyPartsSummary(){
  if(!myPartsSummaryTextEl) return;
  const p = Array.isArray(pickedParts) ? pickedParts : [];
  myPartsSummaryTextEl.textContent = p.length ? `الأجزاء المختارة: ${p.join("، ")}` : "لم تختر أجزاء بعد.";
}




async function loadMyInvites(){
  // Live (onSnapshot): renders pending invites only and prevents duplicates.
  if(!currentUserEmail) return;

  // stop previous listeners (e.g., if user switches)
  try{ __invitesUnsub1 && __invitesUnsub1(); }catch(e){}
  try{ __invitesUnsub2 && __invitesUnsub2(); }catch(e){}
  __invitesUnsub1 = __invitesUnsub2 = null;

  invitesListEl.innerHTML = "";
  invitesEmptyEl.style.display = "none";

  const emailLower = normEmail(currentUserEmail);

  // Merge results from two queries for backward compatibility.
  const merged = new Map();

  const render = ()=>{
    invitesListEl.innerHTML = "";
    invitesEmptyEl.style.display = "none";

    const rows = [];
    for(const [id, inv] of merged.entries()){
      const t = inv?.createdAt?.seconds ? inv.createdAt.seconds : 0;
      rows.push({ id, inv, t });
    }
    rows.sort((a,b)=>b.t-a.t);

    if(rows.length === 0){
      invitesEmptyEl.style.display = "block";
      return;
    }

    rows.forEach(({id, inv})=>{
      const accept = document.createElement("button");
      accept.className = "miniBtn";
      accept.textContent = "قبول";
      accept.onclick = ()=>respondInvite(id, "accepted", inv);

      const decline = document.createElement("button");
      decline.className = "miniBtn";
      decline.textContent = "رفض";
      decline.onclick = ()=>respondInvite(id, "declined", inv);

      const actions = document.createElement("div");
      actions.className = "actions";
      actions.appendChild(accept);
      actions.appendChild(decline);

      const row = itemRow({
        title: inv.groupName || "دعوة مجموعة",
        sub: `من: ${inv.invitedByEmail || ""} • ${fmtTime(inv.createdAt)}`,
        right: actions
      });
      row.dataset.inviteId = id;
      invitesListEl.appendChild(row);
    });
  };

  const onSnap = (snap)=>{
    snap.docChanges().forEach(ch=>{
      const id = ch.doc.id;
      const inv = ch.doc.data() || {};

      if(ch.type === "removed"){
        merged.delete(id);
      }else{
        // Keep ONLY pending
        if(inv.status === "pending") merged.set(id, inv);
        else merged.delete(id);
      }
    });
    __scheduleRenderInvites(render);
  };

  const q1 = query(
    collection(db, "groupInvites"),
    where("invitedEmailLower", "==", emailLower),
    where("status", "==", "pending")
  );

  const q2 = query(
    collection(db, "groupInvites"),
    where("invitedEmail", "==", currentUserEmail),
    where("status", "==", "pending")
  );

  __invitesUnsub1 = onSnapshot(q1, onSnap, (e)=>{ console.error("invites q1 error", e); });
  __invitesUnsub2 = onSnapshot(q2, onSnap, (e)=>{ console.error("invites q2 error", e); });
}



// ===== Invite actions (accept/decline) =====
// When a member accepts an invite, she already agreed that group-related data
// (selected parts + progress summary) are visible to the group.
// So we:
// 1) mark the invite status
// 2) create membership doc + userGroups link
// 3) publish progress summary for that group immediately (safe: reads only her own tracker)
async function respondInvite(inviteId, newStatus, inv){
  try{
    if(!inviteId) return;

    // 1) update invite status
    await updateDoc(doc(db, "groupInvites", inviteId), {
      status: newStatus,
      respondedAt: serverTimestamp(),
      respondedByUid: currentUser?.uid || null,
      respondedByEmail: currentUserEmail || null
    });

    // 2) if accepted, add membership + userGroups
    if(newStatus === "accepted"){
      const groupId = inv?.groupId;
      if(!groupId){
        toast("خطأ","الدعوة غير صالحة (groupId مفقود). ");
      }else{
        // read group meta (goal/name) once
        const gSnap = await getDoc(doc(db, "groups", groupId));
        const g = gSnap.exists() ? (gSnap.data()||{}) : {};

        const batch = writeBatch(db);
        batch.set(doc(db, "groups", groupId, "members", currentUser.uid), {
          uid: currentUser.uid,
          email: currentUserEmail,
          displayName: currentUser.displayName || "",
          role: "member",
          joinedAt: serverTimestamp()
        }, { merge:true });

        batch.set(doc(db, "userGroups", currentUser.uid, "groups", groupId), {
          groupId,
          name: g.name || inv?.groupName || "مجموعة",
          goalType: g.goalType || "juz_count",
          goalN: Number(g.goalN || 0) || 0,
          role: "member",
          joinedAt: serverTimestamp()
        }, { merge:true });

        await batch.commit();

        // 3) publish progress summary now (so others don't see the warning)
        try{
          const myDoc = (cachedDoc ?? await loadUserDoc());
          await syncMyProgressToGroup(groupId, myDoc);
        }catch(e){ /* silent */ }

        toast("تم", "تم قبول الدعوة ✅");
      }
    }else{
      toast("تم", newStatus === "declined" ? "تم رفض الدعوة." : "تم تحديث الدعوة.");
    }

    // refresh lists
    await loadMyInvites();
    await loadMyGroups();

  }catch(e){
    console.error(e);
    toast("خطأ", e?.code ? `تعذر تنفيذ العملية: ${e.code}` : "تعذر تنفيذ العملية.");
  }
}

// Guard against double execution (double-click, duplicated listeners, form submit, etc.)
let __creatingGroup = false;
async function createGroup(){
  if(__creatingGroup) return;
  __creatingGroup = true;
  createGroupBtn && (createGroupBtn.disabled = true, createGroupBtn.style.pointerEvents = "none");
  const name = (groupNameEl.value || "").trim();
  const n = Number(groupNEl.value || 0);

  if(!currentUser){ toast("تنبيه", "سجّلي دخول أولاً."); return; }
  if(!name){ toast("تنبيه", "اكتبي اسم المجموعة."); return; }
  if(!n || n<1 || n>30){ toast("تنبيه", "اختاري عدد أجزاء صحيح (1–30)."); return; }

  
  try{
    // Create id first so we can write multiple docs atomically
    const gRef = doc(collection(db, "groups"));
    const groupId = gRef.id;

    const batch = writeBatch(db);

    // 1) group doc
    batch.set(gRef, {
      name,
      goalType: "juz_count",
      goalN: n,
      createdByUid: currentUser.uid,
      createdByEmail: currentUserEmail,
      createdAt: serverTimestamp()
    });

    // 2) membership doc
    batch.set(doc(db, "groups", groupId, "members", currentUser.uid), {
      uid: currentUser.uid,
      email: currentUserEmail,
      displayName: currentUser.displayName || "",
      role: "owner",
      joinedAt: serverTimestamp(),
      selectedParts: []
    }, { merge:true });

    // 3) userGroups link (THIS is what makes it persist in "مجموعاتي")
    batch.set(doc(db, "userGroups", currentUser.uid, "groups", groupId), {
      groupId,
      name,
      goalType: "juz_count",
      goalN: n,
      role: "owner",
      joinedAt: serverTimestamp()
    }, { merge:true });

    await batch.commit();

    createdGroupMetaEl.textContent = `الهدف: ${n} أجزاء • يمكنك الآن إرسال دعوات بالإيميل.`;
    createdGroupBoxEl.style.display = "block";
    toast("تم", "تم إنشاء المجموعة ✅");

    // refresh lists
    await loadMyGroups();

    // optional: if group page exists in this build, open it
    try{ if(typeof openGroupPage==="function") await openGroupPage(groupId); }catch(e){ console.error(e); }

  }catch(e){
    console.error(e);
    toast("خطأ", e?.code ? `تعذر إنشاء المجموعة: ${e.code}` : "تعذر إنشاء المجموعة.");
  }finally{
    createGroupBtn.disabled = false;
    __creatingGroup = false;
  }
}

async function loadSentInvites(){
  // Live (onSnapshot): show pending invites for the selected/created group.
  // When the invite is accepted/declined, it disappears automatically here.
  if(!createdGroupId) return;

  try{ __sentInvitesUnsub && __sentInvitesUnsub(); }catch(e){}
  __sentInvitesUnsub = null;

  sentInvitesListEl.innerHTML = "";
  sentInvitesEmptyEl.style.display = "none";

  const q = query(
    collection(db, "groupInvites"),
    where("groupId", "==", createdGroupId),
    where("status", "==", "pending")
  );

  __sentInvitesUnsub = onSnapshot(q, (snap)=>{
    sentInvitesListEl.innerHTML = "";
    sentInvitesEmptyEl.style.display = "none";

    if(snap.empty){
      sentInvitesEmptyEl.textContent = "لا توجد دعوات معلّقة.";
      sentInvitesEmptyEl.style.display = "block";
      return;
    }

    const rows=[];
    snap.forEach(d=>{
      const inv = d.data() || {};
      const t = inv?.createdAt?.seconds ? inv.createdAt.seconds : 0;
      rows.push({id:d.id, inv, t});
    });
    rows.sort((a,b)=>b.t-a.t);

    rows.forEach(({id, inv})=>{
      const row = itemRow({
        title: inv.invitedEmail,
        sub: `بانتظار القبول • ${fmtTime(inv.createdAt)}`,
        right: null
      });
      row.dataset.inviteId = id;
      sentInvitesListEl.appendChild(row);
    });
  }, (e)=>{ console.error("sentInvites listener error", e); });
}



async function sendInvite(){
  if(!createdGroupId){ toast("تنبيه", "أنشئي مجموعة أولاً."); return; }
  const emailRaw = (inviteEmailEl.value || "").trim();
  const emailLower = normEmail(emailRaw);
  if(!emailLower || !emailLower.includes("@")){ toast("تنبيه", "اكتبي إيميل صحيح."); return; }
  if(!currentUser){ toast("تنبيه", "سجّلي دخول أولاً."); return; }

  sendInviteBtn.disabled = true;
  try{
    const gSnap = await getDoc(doc(db, "groups", createdGroupId));
    const g = gSnap.exists() ? gSnap.data() : { name: "مجموعة" };

    const invId = inviteDocId(createdGroupId, emailLower);
    const invRef = doc(db, "groupInvites", invId);
    const invSnap = await getDoc(invRef);

    if(invSnap.exists()){
      const prev = invSnap.data() || {};
      if(prev.status === "pending"){ toast("تنبيه","هذه الدعوة موجودة بالفعل (بانتظار القبول)."); return; }
      if(prev.status === "accepted"){ toast("تنبيه","تم قبول الدعوة سابقًا."); return; }
    }

    await setDoc(invRef, {
      groupId: createdGroupId,
      groupName: g.name || "مجموعة",
      invitedEmail: emailLower,
      invitedEmailLower: emailLower,
      invitedByUid: currentUser.uid,
      invitedByEmail: currentUserEmail,
      status: "pending",
      createdAt: serverTimestamp(),
      resentAt: invSnap.exists() ? serverTimestamp() : null
    }, { merge:true });

    inviteEmailEl.value = "";
    toast("تم", "تم إرسال الدعوة ✅");
    await loadSentInvites();
  }catch(e){
    console.error(e);
    toast("خطأ", "تعذر إرسال الدعوة.");
  }finally{
    sendInviteBtn.disabled = false;
  }
}


  let uid = null;
  let currentPart = null;
  let cachedDoc = null;

  async function loadUserDoc(){
    const ref = doc(db, "quranTrackers", uid);
    const snap = await getDoc(ref);
    if(snap.exists()) return snap.data();
    return { profile:{}, parts:{} };
  }
  async function saveUserDoc(userDoc){
    // Keep a simple updatedAt stamp for UI + syncing
    const isoNow = new Date().toISOString();
    userDoc.updatedAt = isoNow;
    // Persist computed stats (per-part memorization/fixation percentages)
    // so we can render personal + group views without recalculating.
    try{ userDoc.stats = computeUserStatsFromParts(userDoc, isoNow); }catch(e){}
    const ref = doc(db, "quranTrackers", uid);
    await setDoc(ref, userDoc, { merge:true });
    // Push my summary (حفظ + تثبيت) إلى المجموعات التي أنا فيها
    try{ scheduleProgressSync(userDoc); }catch(e){}
  }

  function setGreeting(userDoc){
    const name = userDoc.profile?.name?.trim();
    greetEl.textContent = name ? ("") : "";
    globalLastEl.textContent = userDoc.updatedAt ? ("آخر تعديل: " + fmtDate(userDoc.updatedAt)) : "";
  }

  function maybeHelloToast(userDoc){ return; }

  // Name modal
  function showNameModal(show){
    el("nameOverlay").classList.toggle("hide", !show);
    el("displayName").value = "";
    el("nameStatus").textContent = show ? "اكتبي اسمك للترحيب 🌸" : "✨";
  }

  el("saveNameBtn").addEventListener("click", async ()=>{
    const nm = el("displayName").value.trim();
    if(!nm){ el("nameStatus").textContent = "اكتبي اسمًا أولاً."; return; }
    try{
      const userDoc = (cachedDoc ?? await loadUserDoc());
      userDoc.profile = userDoc.profile || {};
      userDoc.profile.name = nm;
      await saveUserDoc(userDoc);
      cachedDoc = userDoc;

      scheduleProgressSync(userDoc);
      setGreeting(userDoc);
      showNameModal(false);
      showToast("السلام عليكم يا " + nm);
      // show intro after name set if not seen
      if(!userDoc.profile?.seenIntro){ openIntro(); }
    }catch(e){
      console.error(e);
      el("nameStatus").textContent = "تعذر الحفظ، جرّبي مرة أخرى.";
    }
  });

  el("skipNameBtn").addEventListener("click", async ()=>{
    showNameModal(false);
    const userDoc = (cachedDoc ?? await loadUserDoc());
    if(!userDoc.profile?.seenIntro){ openIntro(); }
  });

  async function markIntroSeen(){
    if(!uid) return;
    try{
      const userDoc = (cachedDoc ?? await loadUserDoc());
      userDoc.profile = userDoc.profile || {};
      userDoc.profile.seenIntro = true;
      userDoc.updatedAt = new Date().toISOString();
      await saveUserDoc(userDoc);
      cachedDoc = userDoc;
      setGreeting(userDoc);
    }catch(e){
      console.error(e);
    }
  }

  // autosave debounce
  let autosaveTimer = null;
  let saving = false;
  let pending = false;

  function scheduleAutosave(){
    if(!uid || !currentPart) return;
    if(autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(()=> autosaveNow(), 900);
  }

  async function autosaveNow(){
    if(!uid || !currentPart) return;
    if(saving){ pending = true; return; }
    saving = true;
    try{
      const userDoc = (cachedDoc ?? await loadUserDoc());
      userDoc.parts = userDoc.parts || {};
      userDoc.profile = userDoc.profile || {};

      userDoc.parts[String(currentPart)] = collectPart(currentPart);
      userDoc.updatedAt = new Date().toISOString();

      await saveUserDoc(userDoc);
      cachedDoc = userDoc;

      const part = userDoc.parts[String(currentPart)];
      lastSavedEl.textContent = "آخر تعديل: " + fmtDate(part.updatedAt);
      setGreeting(userDoc);
    }catch(e){
      console.error(e);
    }finally{
      saving = false;
      if(pending){ pending = false; autosaveNow(); }
    }
  }

  
// --- Dash view switcher (My / Groups) ---
function setDashView(which){
  localStorage.setItem("dashView", which);

  const viewMyEl = el("viewMy");
  const viewGroupsEl = el("viewGroups");
  const navMyBtn = el("navMy");
  const navGroupsBtn = el("navGroups");

  if(viewMyEl && viewGroupsEl){
    viewMyEl.classList.toggle("show", which === "my");
    viewGroupsEl.classList.toggle("show", which === "groups");
  }
  if(navMyBtn && navGroupsBtn){
    navMyBtn.classList.toggle("active", which === "my");
    navGroupsBtn.classList.toggle("active", which === "groups");
  }

  if(which === "groups"){
    // force load groups every time we enter the tab
    console.log("[ui] entering groups tab -> loading groups");
    if(!currentUser){
      // user clicked before auth state is ready — defer until onAuthStateChanged fires
      pendingGroupsLoad = true;
      return;
    }
    pendingGroupsLoad = false;
    loadMyGroups().catch(console.error);
    loadMyInvites().catch(console.error);
    // safety: run again shortly in case DOM just switched
    setTimeout(()=>{ loadMyGroups().catch(console.error); }, 150);
  }
}

function wireDashNav(){
  try{ el("navMy")?.addEventListener("click", ()=>setDashView("my")); }catch(e){console.error(e);}
  try{ el("navGroups")?.addEventListener("click", ()=>setDashView("groups")); }catch(e){console.error(e);}
  try{ el("bottomMy")?.addEventListener("click", ()=>setDashView("my")); }catch(e){console.error(e);}
  try{ el("bottomGroups")?.addEventListener("click", ()=>setDashView("groups")); }catch(e){console.error(e);}
}

wireDashNav();

// --- Reviews nav fallback (in case nav.js handlers are blocked by legacy handlers / overlays) ---
try{
  el("navReviews")?.addEventListener("click", (e)=>{ e.preventDefault(); window.__setActiveView?.("reviews"); });
}catch(e){ console.error(e); }
try{
  el("mNavReviews")?.addEventListener("click", (e)=>{ e.preventDefault(); window.__setActiveView?.("reviews"); });
}catch(e){ console.error(e); }


async function openDash(){
    cachedDoc = await loadUserDoc();
    setGreeting(cachedDoc);
    buildPartsGrid(cachedDoc);
    showOnly("dash");
    setDashView(localStorage.getItem("dashView") || "my");

    maybeHelloToast(cachedDoc);

    if(!cachedDoc.profile?.name){
      showNameModal(true);
    }else{
      if(!cachedDoc.profile?.seenIntro){ openIntro(); }
    }
  }

  async function openPart(partNum){
    cachedDoc = await loadUserDoc();
    setGreeting(cachedDoc);
    currentPart = partNum;
    loadPartToUI(partNum, cachedDoc);
    showOnly("part");

    maybeHelloToast(cachedDoc);
  }

  // Help button shows wizard anytime
  el("helpBtn").addEventListener("click", openIntro);

  // Auth actions
  el("googleBtn").addEventListener("click", async ()=>{
    try{
      setAuthStatus("جاري فتح Google...", "");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setAuthStatus("تم ✅", "ok");
    }catch(e){
      console.error(e);
      setAuthStatus(friendlyAuthError(e.code), "warn");
    }
  });

  el("signInBtn").addEventListener("click", async ()=>{
    try{
      setAuthStatus("جاري تسجيل الدخول...", "");
      await signInWithEmailAndPassword(auth, el("email").value.trim(), el("password").value);
      setAuthStatus("تم ✅", "ok");
    }catch(e){
      console.error(e);
      setAuthStatus(friendlyAuthError(e.code), "warn");
    }
  });

  el("signUpBtn").addEventListener("click", async ()=>{
    try{
      setAuthStatus("جاري إنشاء الحساب...", "");
      await createUserWithEmailAndPassword(auth, el("email").value.trim(), el("password").value);
      setAuthStatus("تم إنشاء الحساب ✅", "ok");
    }catch(e){
      console.error(e);
      setAuthStatus(friendlyAuthError(e.code), "warn");
    }
  });

  el("resetPwBtn").addEventListener("click", async ()=>{
    const email = el("email").value.trim();
    if(!email){ setAuthStatus("اكتبي الإيميل أولاً.", "warn"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      setAuthStatus("تم إرسال رابط إعادة التعيين ✅", "ok");
    }catch(e){
      console.error(e);
      setAuthStatus(friendlyAuthError(e.code), "warn");
    }
  });

  el("backBtn").addEventListener("click", async ()=>{
    if(autosaveTimer){ clearTimeout(autosaveTimer); await autosaveNow(); }
    await openDash();

      // If the saved active view is "groups" (or user clicked Groups before auth was ready),
      // make sure we actually load groups immediately.
      try{
        const wantsGroups =
          (localStorage.getItem("activeView")==="groups") ||
          (localStorage.getItem("dashView")==="groups") ||
          pendingGroupsLoad;
        if(wantsGroups){
          setDashView("groups");
        }
      }catch(e){ console.error(e); }

      // Restore last dash view (and load groups if needed)
      setDashView(localStorage.getItem('dashView') || 'my');

      try{ await loadMyInvites(); }catch(e){ console.error(e); }
      try{ await loadMyGroups(); }catch(e){ console.error(e); }
  });

  el("logoutBtn").addEventListener("click", async ()=>{ await signOut(auth); });
  el("logoutBtn2").addEventListener("click", async ()=>{ await signOut(auth); });

  onAuthStateChanged(auth, async (user)=>{
    if(user){
      currentUser = user;
      window.currentUser = user;
      currentUserEmail = normEmail(user.email);
      uid = user.uid;
      await openDash();
    }else{
      uid = null; currentPart = null; cachedDoc = null;
      greetEl.textContent = "";
      globalLastEl.textContent = "";
      showOnly("auth");
      setAuthStatus("سجّلي دخولك للمتابعة.", "");
      sessionStorage.removeItem("helloShown");
    }
  });
// ===== Groups: UI listeners =====
if (createGroupBtn && !createGroupBtn.dataset.bound) {
  createGroupBtn.dataset.bound = "1";
  createGroupBtn.addEventListener("click", createGroup);
}
  backToGroupsFromGroupBtn?.addEventListener("click", ()=>__setActiveView("groups"));
  groupSendInviteBtn?.addEventListener("click", sendGroupInvite);

  // ===== Parts (Popup) =====
  editMyPartsBtn?.addEventListener("click", openPartsModal);
  partsModalCloseBtn?.addEventListener("click", closePartsModal);
  partsModalCancelBtn?.addEventListener("click", closePartsModal);
  // close when clicking on overlay background
  partsOverlayEl?.addEventListener("click", (e)=>{ if(e.target===partsOverlayEl) closePartsModal(); });

  partsModalSaveBtn?.addEventListener("click", async ()=>{
    await savePickedParts(partsModalSaveBtn);
    closePartsModal();
  });

  // ===== Member parts (view) =====
  memberPartsCloseBtn?.addEventListener("click", closeMemberParts);
  memberPartsOkBtn?.addEventListener("click", closeMemberParts);
  memberPartsOverlayEl?.addEventListener("click", (e)=>{ if(e.target===memberPartsOverlayEl) closeMemberParts(); });

  groupInviteEmailEl?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendGroupInvite(); });
  savePickedPartsBtn?.addEventListener("click", savePickedParts);

backToGroupsBtn?.addEventListener("click", ()=>window.__setActiveView?.("groups"));
sendInviteBtn?.addEventListener("click", sendInvite);
inviteEmailEl?.addEventListener("keydown", (e)=>{ if(e.key==="Enter") sendInvite(); });
refreshGroupsBtn?.addEventListener("click", async ()=>{ await loadMyInvites(); await loadMyGroups(); });

// When view changes (inside the shell navigator), refresh groups automatically.
// Important: __setActiveView is created in the non-module script on DOMContentLoaded,
// so we wrap it AFTER DOMContentLoaded to avoid "undefined" at module load time.
window.addEventListener("DOMContentLoaded", ()=>{
  try{
    const _oldSetActive = window.__setActiveView;
    if(typeof _oldSetActive === "function" && !_oldSetActive.__wrappedForGroups){
      const wrapped = (which)=>{
        _oldSetActive(which);
        // Stop realtime members listener when leaving the group view
        if(which !== "group"){
          try{ if(membersUnsub) membersUnsub(); }catch(e){}
          membersUnsub = null;
        }
        if(which==="groups"){
          // refresh lists
          loadMyInvites().catch(console.error);
          loadMyGroups().catch(console.error);
        }
        if(which==="group"){
          loadGroupPage().catch(console.error);
        }
      };
      wrapped.__wrappedForGroups = true;
      window.__setActiveView = wrapped;
    }
  }catch(e){ console.error(e); }
});

// After login, load lists
// (called from auth state handler below)

// Expose some actions for safety (in case any inline handlers exist)
window.sendInvite = sendInvite;
window.createGroup = createGroup;
window.openGroupPage = openGroupPage;


window.showToast = showToast;
window.setDashView = setDashView;
window.loadMyGroups = loadMyGroups;
try{ el('navGroups')?.addEventListener('click', openGroupsTab); }catch(e){console.error(e);} 
try{ el('bottomGroups')?.addEventListener('click', openGroupsTab); }catch(e){console.error(e);} 

window.openGroupsTab = openGroupsTab;
try{ el("navMy")?.addEventListener("click", ()=>setDashView("my")); }catch(e){console.error(e);} 
try{ el("navGroups")?.addEventListener("click", ()=>setDashView("groups")); }catch(e){console.error(e);} 
try{ el("bottomMy")?.addEventListener("click", ()=>setDashView("my")); }catch(e){console.error(e);} 
try{ el("bottomGroups")?.addEventListener("click", ()=>setDashView("groups")); }catch(e){console.error(e);}

function bindDashNav(){
  const bind = (id, which)=>{
    const b = el(id);
    if(!b) return;
    b.addEventListener("click", (e)=>{
      e.preventDefault();
      console.log(`[ui] click ${id} -> ${which}`);
      setDashView(which);
    }, { passive:false });
  };
  bind("navMy","my");
  bind("mNavMy","my");
  bind("bottomMy","my");
  bind("navGroups","groups");
  bind("mNavGroups","groups");
  bind("bottomGroups","groups");
  bind("goCreateFromGroups","groups"); // keep dashView in sync when opening groups then create
}

// bind once after module loads
bindDashNav();

// Reviews UI bindings
try{
  reviewsOnlyFixedChk?.addEventListener("change", async ()=>{ if(!currentUser) return; const d=(cachedDoc ?? await loadUserDoc()); renderReviewsParts(d); });
  backToReviewsBtn?.addEventListener("click", ()=>{
    window.__setActiveView?.("reviews");
    try{ window.scrollTo({ top: 0, behavior: "smooth" }); }catch(e){ window.scrollTo(0,0); }
  });
}catch(e){}


// =============================
// View lifecycle (prevents duplicated listeners)
// nav.js calls window.__viewLifecycle.enter/leave
// =============================
function __cleanupGroupsView(){
  // Groups view uses the incoming invites listeners
  try{ stopInviteListeners(); }catch(e){}
}

function __cleanupGroupView(){
  // Group details view uses members + group-invites + sent-invites listeners
  try{ if(membersUnsub) membersUnsub(); }catch(e){}
  membersUnsub = null;
  try{ stopInviteListeners(); }catch(e){}
}

window.__viewLifecycle = {
  enter: async (which)=>{
    // Note: avoid throwing from here; nav should stay responsive.
    try{
      if(which === 'groups'){
        if(!currentUser){ pendingGroupsLoad = true; return; }
        pendingGroupsLoad = false;
        await loadMyInvites();
        await loadMyGroups();
      }
      if(which === 'group'){
        if(activeGroupId) await loadGroupPage();
      }
      if(which === 'reviews'){
        await loadReviewsView();
      }
      if(which === 'reviewsPart'){
        if(!currentUser){ return; }
        const userDoc = (cachedDoc ?? await loadUserDoc());
        if(!activeReviewsPart){
          // Safety: if user landed here without choosing part
          window.__setActiveView?.('reviews');
          return;
        }
        renderReviewsPages(activeReviewsPart, userDoc);
      }
      // create/my: no special listeners here
    }catch(e){ console.error('enter view error', which, e); }
  },
  leave: (which)=>{
    try{
      if(which === 'groups') __cleanupGroupsView();
      if(which === 'group') __cleanupGroupView();
      if(which === 'create') { /* nothing for now */ }
      // my: nothing
    }catch(e){ console.error('leave view error', which, e); }
  }
};

