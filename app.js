(function () {
  const D = window.DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const col = (i) => "#" + D.colors[D.pal[i % D.pal.length]];

  // ---------- storage
  const store = {
    get() { try { return JSON.parse(localStorage.getItem("cleanplanner") || "{}"); } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem("cleanplanner", JSON.stringify(o)); } catch (e) {} },
  };
  let S = store.get();
  const toggle = (k) => { if (S[k]) delete S[k]; else S[k] = 1; store.set(S); };
  const wipe = (prefix) => { Object.keys(S).forEach((k) => k.startsWith(prefix) && delete S[k]); store.set(S); render(); };
  function weekKey() {
    const d = new Date(); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  const year = new Date().getFullYear();
  const W = weekKey();

  // ---------- widgets
  function box(key, color) {
    const b = el("button", "box"); b.type = "button"; b.style.setProperty("--c", color);
    if (S[key]) b.classList.add("on");
    b.setAttribute("aria-pressed", !!S[key]);
    b.addEventListener("click", () => { toggle(key); b.classList.toggle("on"); b.setAttribute("aria-pressed", b.classList.contains("on")); progress(); });
    return b;
  }
  function row(label, key, color) {
    const r = el("div", "row"); r.appendChild(el("span", "lbl", label)); r.appendChild(box(key, color)); return r;
  }
  function section(title, color) { const h = el("h3", "sec", title); h.style.background = color; return h; }
  function resetBtn(prefix, text) {
    const b = el("button", "reset", text || "Clear checks"); b.type = "button";
    b.onclick = () => confirm("Clear all checkmarks in this tab?") && wipe(prefix); return b;
  }
  function dayGrid(items, prefix) {
    const wrap = el("div", "grid");
    const head = el("div", "ghead"); head.appendChild(el("span", "lbl", ""));
    "SMTWTFS".split("").forEach((l, i) => { const s = el("span", "dl", l); s.style.background = col(i); head.appendChild(s); });
    wrap.appendChild(head);
    items.forEach((t, ti) => {
      const r = el("div", "grow"); r.appendChild(el("span", "lbl", t));
      for (let i = 0; i < 7; i++) r.appendChild(box(`${prefix}:${W}:${ti}:${i}`, col(i)));
      wrap.appendChild(r);
    });
    return wrap;
  }
  function checklist(title, items, prefix, colorIdx) {
    const f = el("div", "card");
    f.appendChild(section(title, col(colorIdx)));
    items.forEach((t, i) => f.appendChild(row(t, `${prefix}:${i}`, col(colorIdx))));
    return f;
  }

  // ---------- tabs
  const T = {};
  T.Today = () => {
    const f = el("div"); const dow = (new Date().getDay() + 6) % 7; const dayName = D.days[dow];
    f.appendChild(el("p", "hint", new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })));
    const w = D.weekly[dayName];
    const c1 = el("div", "card"); c1.appendChild(section("Daily tasks", col(0)));
    D.daily.forEach((t, i) => c1.appendChild(row(t, `today:${new Date().toDateString()}:d${i}`, col(0))));
    f.appendChild(c1);
    const c2 = el("div", "card"); c2.appendChild(section(`${dayName} — ${w.area}`, col(dow)));
    w.tasks.forEach((t, i) => c2.appendChild(row(t, `today:${new Date().toDateString()}:w${i}`, col(dow))));
    f.appendChild(c2);
    f.appendChild(resetBtn("today:", "Clear today"));
    return f;
  };
  T.Daily = () => {
    const f = el("div"); f.appendChild(el("p", "hint", "Week of " + W)); f.appendChild(dayGrid(D.daily, "daily"));
    f.appendChild(resetBtn("daily:")); return f;
  };
  T.Weekly = () => {
    const f = el("div"); f.appendChild(el("p", "hint", "Week of " + W));
    D.days.forEach((d, i) => { const w = D.weekly[d]; const c = el("div", "card"); c.appendChild(section(`${d} — ${w.area}`, col(i)));
      w.tasks.forEach((t, j) => c.appendChild(row(t, `weekly:${W}:${i}:${j}`, col(i)))); f.appendChild(c); });
    f.appendChild(resetBtn("weekly:")); return f;
  };
  T.Monthly = () => {
    const f = el("div"); f.appendChild(el("p", "hint", year + " — tap the months you've done each task"));
    const mk = (title, items, labels, prefix, ci) => {
      const c = el("div", "card"); c.appendChild(section(title, col(ci)));
      items.forEach((t, i) => { const r = el("div", "mrow"); r.appendChild(el("div", "lbl", t));
        const g = el("div", "mgrid");
        labels.forEach((m, j) => { const cell = el("div", "mcell"); cell.appendChild(el("small", "", m)); cell.appendChild(box(`${prefix}:${year}:${i}:${j}`, col(i + j))); g.appendChild(cell); });
        r.appendChild(g); c.appendChild(r); });
      return c;
    };
    f.appendChild(mk("Monthly", D.monthly, D.monthNames, "month", 0));
    f.appendChild(mk("Quarterly", D.quarterly, D.quarters, "quarter", 3));
    f.appendChild(mk("Semi-annual", D.semi, ["Jan–Jun", "Jul–Dec"], "semi", 4));
    f.appendChild(checklist("Annual", D.annual, `annual:${year}`, 2));
    f.appendChild(resetBtn("month:")); return f;
  };
  T.Routine = () => {
    const f = el("div"); let i = 0;
    Object.entries(D.routine).forEach(([k, items]) => f.appendChild(checklist(k + " routine", items, `routine:${new Date().toDateString()}:${k}`, i++ * 2)));
    f.appendChild(resetBtn("routine:", "Reset for new day")); return f;
  };
  T.Rooms = () => {
    const f = el("div"); let i = 0;
    Object.entries(D.rooms).forEach(([k, items]) => f.appendChild(checklist(k, items, `room:${k}`, i++)));
    f.appendChild(resetBtn("room:")); return f;
  };
  T.Maintenance = () => {
    const f = el("div"); let i = 0;
    Object.entries(D.maint).forEach(([k, items]) => f.appendChild(checklist(k, items, `maint:${k}`, i++)));
    f.appendChild(resetBtn("maint:")); return f;
  };
  T.Declutter = () => {
    const f = el("div"); const done = D.declutter.filter((_, i) => S["dc:" + i]).length;
    const p = el("div", "bar"); const inner = el("i"); inner.id = "dcbar"; inner.style.width = (done / D.declutter.length * 100) + "%"; p.appendChild(inner); f.appendChild(p);
    f.appendChild(el("p", "hint", `${done} of ${D.declutter.length} days done`));
    const areas = []; D.declutter.forEach((d) => areas.includes(d.area) || areas.push(d.area));
    areas.forEach((a, ai) => { const c = el("div", "card"); c.appendChild(section(a, col(ai)));
      D.declutter.forEach((d, i) => d.area === a && c.appendChild(row(`Day ${i + 1}: ${d.task}`, "dc:" + i, col(ai)))); f.appendChild(c); });
    f.appendChild(resetBtn("dc:", "Restart challenge")); return f;
  };
  T.Family = () => {
    const f = el("div"); f.appendChild(el("p", "hint", "Tap a person's name to rename. Tap a chore to edit it."));
    const names = S.__names || D.family.people.slice();
    const chores = S.__chores || {};
    names.forEach((n, pi) => {
      const c = el("div", "card"); const h = section(n, col(pi)); h.contentEditable = "true"; h.spellcheck = false;
      h.addEventListener("blur", () => { names[pi] = h.textContent.trim() || n; S.__names = names; store.set(S); });
      c.appendChild(h);
      for (let k = 0; k < 4; k++) {
        const r = el("div", "frow");
        const days = el("div", "fdays");
        D.days.forEach((d, di) => {
          const cell = el("div", "fcell");
          const ck = `${pi}:${k}:${di}`;
          const lab = el("span", "fl", chores[ck] != null ? chores[ck] : D.family.chores[(pi * 4 + k + di * 3) % D.family.chores.length]);
          lab.contentEditable = "true"; lab.spellcheck = false;
          lab.addEventListener("blur", () => { chores[ck] = lab.textContent.trim(); S.__chores = chores; store.set(S); });
          const dl = el("small", "", d.slice(0, 3));
          cell.appendChild(dl); cell.appendChild(lab); cell.appendChild(box(`fam:${W}:${ck}`, col(di)));
          days.appendChild(cell);
        });
        r.appendChild(days); c.appendChild(r);
      }
      f.appendChild(c);
    });
    f.appendChild(resetBtn("fam:", "New week (clear checks)")); return f;
  };

  const TABS = [["Today", "Today"], ["Daily", "Daily"], ["Weekly", "Weekly"], ["Monthly", "Monthly+"], ["Routine", "Routine"], ["Rooms", "Rooms"], ["Maintenance", "Home"], ["Declutter", "30-Day"], ["Family", "Chores"]];
  let current = location.hash.slice(1) || "Today";
  if (!T[current]) current = "Today";

  function progress() {
    const bar = $("#dcbar"); if (bar) bar.style.width = (D.declutter.filter((_, i) => S["dc:" + i]).length / D.declutter.length * 100) + "%";
  }
  function render() {
    const nav = $("#tabs"); nav.innerHTML = "";
    TABS.forEach(([id, label], ti) => { const b = el("button", id === current ? "tab active" : "tab", label); b.style.setProperty("--t", col(ti)); b.onclick = () => { current = id; history.replaceState(null, "", "#" + id); render(); window.scrollTo(0, 0); }; nav.appendChild(b); });
    const main = $("#main"); main.innerHTML = "";
    const full = TABS.find((t) => t[0] === current)[1];
    const titles = { Today: "Today's Pages", Daily: "Daily Cleaning", Weekly: "Weekly Schedule", Monthly: "Monthly & Seasonal", Routine: "Daily Routine", Rooms: "Room Cards", Maintenance: "Home Maintenance", Declutter: "30-Day Declutter", Family: "Family Chore Chart" };
    main.appendChild(el("h2", "page-title", titles[current] || full));
    main.appendChild(T[current]());
    const act = $(".tab.active"); if (act && act.scrollIntoView) act.scrollIntoView({ inline: "center", block: "nearest" });
  }
  render();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
