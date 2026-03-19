window.addEventListener('DOMContentLoaded', ()=>{
    const sideBar = document.getElementById("sideBar");
    const collapseBtn = document.getElementById("collapseBtn");

    const btns = {
      my: document.getElementById("navMy"),
      groups: document.getElementById("navGroups"),
      reviews: document.getElementById("navReviews"),
      logout: document.getElementById("navLogout"),
    };
    const views = {
      my: document.getElementById("viewMy"),
      groups: document.getElementById("viewGroups"),
      group: document.getElementById("viewGroup"),
      create: document.getElementById("viewCreate"),
      reviews: document.getElementById("viewReviews"),
      reviewsPart: document.getElementById("viewReviewsPart"),
    };

    const m = {
      my: document.getElementById("mNavMy"),
      groups: document.getElementById("mNavGroups"),
      reviews: document.getElementById("mNavReviews"),
      more: document.getElementById("mNavMore"),
    };
    const sheetBackdrop = document.getElementById("sheetBackdrop");
    const bottomSheet = document.getElementById("bottomSheet");
    const sheetLogout = document.getElementById("sheetLogout");

    function isMobile(){ return window.matchMedia("(max-width: 980px)").matches; }

    function closeSheet(){
      sheetBackdrop?.classList.remove("show");
      bottomSheet?.classList.remove("show");
      bottomSheet?.setAttribute("aria-hidden","true");
    }
    function openSheet(){
      sheetBackdrop?.classList.add("show");
      bottomSheet?.classList.add("show");
      bottomSheet?.setAttribute("aria-hidden","false");
    }

    let _currentView = null;

    function callLeave(prev){
      try{ window.__viewLifecycle?.leave?.(prev); }catch(e){ console.error('view leave error', e); }
    }
    function callEnter(next){
      try{ window.__viewLifecycle?.enter?.(next); }catch(e){ console.error('view enter error', e); }
    }

    function setActive(which){
      const prev = _currentView || (localStorage.getItem("activeView") || "my");
      if(prev && prev !== which){ callLeave(prev); }

      // Force-hide all views (hard reset)
      Object.values(views).forEach(v=>{
        if(!v) return;
        v.classList.remove("show");
        v.style.display = "none";
      });

      // Activate selected view
      const target = views[which];
      if(target){
        target.style.display = "block";
        target.classList.add("show");
      }

      // Desktop nav active
      Object.values(btns).forEach(b=>b && b.classList.remove("active"));
      if(btns[which]) btns[which].classList.add("active");
      if((which==="group" || which==="create") && btns.groups) btns.groups.classList.add("active");
      if(which==="reviewsPart" && btns.reviews) btns.reviews.classList.add("active");

      // Mobile nav active
      Object.values(m).forEach(b=>b && b.classList.remove("active"));
      if(which==="my" && m.my) m.my.classList.add("active");
      if((which==="groups" || which==="group" || which==="create") && m.groups) m.groups.classList.add("active");
      if((which==="reviews" || which==="reviewsPart") && m.reviews) m.reviews.classList.add("active");

      closeSheet();
      localStorage.setItem("activeView", which);

      _currentView = which;
      callEnter(which);

      try{ window.scrollTo({ top: 0, behavior: "smooth" }); }catch(e){ window.scrollTo(0,0); }
    }

    const saved = localStorage.getItem("activeView") || "my";
    setActive(saved);

    // Desktop collapse
    collapseBtn?.addEventListener("click", ()=>{
      const collapsed = sideBar.classList.toggle("collapsed");
      document.body.classList.toggle("sidebarCollapsed", collapsed);
      collapseBtn.textContent = collapsed ? "❯❯" : "❮❮";
      localStorage.setItem("sideCollapsed", collapsed ? "1" : "0");
    });
    const c = localStorage.getItem("sideCollapsed")==="1";
    if(c && !isMobile()){
      sideBar.classList.add("collapsed");
      document.body.classList.add("sidebarCollapsed");
      collapseBtn.textContent = "❯❯";
    }

    // Desktop nav handlers
    btns.my?.addEventListener("click", ()=>setActive("my"));
    btns.groups?.addEventListener("click", ()=>setActive("groups"));
    btns.reviews?.addEventListener("click", ()=>setActive("reviews"));
    btns.logout?.addEventListener("click", ()=>{
      const b = document.getElementById("logoutBtn2") || document.getElementById("logoutBtn");
      b?.click();
    });

    // Mobile bottom nav handlers
    m.my?.addEventListener("click", ()=>setActive("my"));
    m.groups?.addEventListener("click", ()=>setActive("groups"));
    m.reviews?.addEventListener("click", ()=>setActive("reviews"));
    m.more?.addEventListener("click", ()=>openSheet());
    sheetBackdrop?.addEventListener("click", closeSheet);

    sheetLogout?.addEventListener("click", ()=>{
      closeSheet();
      const b = document.getElementById("logoutBtn2") || document.getElementById("logoutBtn");
      b?.click();
    });

    // groups page create button
    document.getElementById("goCreateFromGroups")?.addEventListener("click", ()=>setActive("create"));

    window.__setActiveView = setActive;
    });
