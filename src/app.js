const STORAGE = {
  clocks: "wc_clocks",
  theme: "wc_theme",
  pinned: "wc_pinned",
  hour12: "wc_hour12",
  settings: "wc_settings"
};

const LOCAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

const DEFAULT_TIME_BANDS = [
  { name: "Day",     startTime: "09:00", color: "#22c55e" },
  { name: "Evening", startTime: "19:00", color: "#eab308" },
  { name: "Night",   startTime: "22:00", color: "#ef4444" },
  { name: "Morning", startTime: "06:00", color: "#eab308" }
];

const DEFAULT_SETTINGS = {
  fontFamily: "system",
  fontSize: "medium",
  dateFormat: "MDY",
  showSeconds: true,
  showMeta: true,
  scorpionEnabled: true,
  greetingsEnabled: true,
  scorpionModel: "classic",
  scorpionColor: "accent",
  timeBands: DEFAULT_TIME_BANDS.map((b) => ({ ...b })),
  blendMinutes: 30
};

const state = {
  clocks: [],
  theme: "light",
  pinned: false,
  hour12: true,
  dirty: false,
  settings: { ...DEFAULT_SETTINGS }
};

const $list = document.getElementById("clockList");
const $addBtn = document.getElementById("addBtn");
const $saveBtn = document.getElementById("saveBtn");
const $themeBtn = document.getElementById("themeBtn");
const $themeIcon = document.getElementById("themeIcon");
const $pinBtn = document.getElementById("pinBtn");
const $hourBtn = document.getElementById("hourFormatBtn");
const $hourLabel = document.getElementById("hourFormatLabel");
const $settingsBtn = document.getElementById("settingsBtn");
const $settingsPanel = document.getElementById("settingsPanel");
const $settingsBackdrop = document.getElementById("settingsBackdrop");
const $settingsClose = document.getElementById("settingsClose");
const $settingsSaveBtn = document.getElementById("settingsSaveBtn");
const $setFontFamily = document.getElementById("setFontFamily");
const $setFontSize = document.getElementById("setFontSize");
const $setDateFormat = document.getElementById("setDateFormat");
const $setShowSeconds = document.getElementById("setShowSeconds");
const $setShowMeta = document.getElementById("setShowMeta");
const $setScorpion = document.getElementById("setScorpion");
const $setGreetings = document.getElementById("setGreetings");
const $mascot = document.getElementById("mascot");
const $mascotBubble = document.getElementById("mascotBubble");
const $scorpionGrid = document.getElementById("scorpionGrid");
const $colorGrid = document.getElementById("colorGrid");
const $timeBandsList = document.getElementById("timeBandsList");
const $setBlendMinutes = document.getElementById("setBlendMinutes");
const $status = document.getElementById("statusText");
const $tpl = document.getElementById("clockTemplate");
const $search = document.getElementById("globalSearch");
const $searchClear = document.getElementById("globalSearchClear");
const $searchResults = document.getElementById("globalSearchResults");

let pendingSelection = null;

const storage = {
  get(keys) {
    const out = {};
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (raw == null) continue;
      try {
        out[k] = JSON.parse(raw);
      } catch (_) {
        out[k] = raw;
      }
    }
    return out;
  },
  set(obj) {
    for (const k of Object.keys(obj)) {
      localStorage.setItem(k, JSON.stringify(obj[k]));
    }
  }
};

function getTauriWindow() {
  const t = window.__TAURI__;
  if (!t || !t.window) return null;
  return t.window.getCurrentWindow ? t.window.getCurrentWindow() : t.window.getCurrent();
}

async function setAlwaysOnTopNative(value) {
  try {
    const w = getTauriWindow();
    if (w) await w.setAlwaysOnTop(!!value);
  } catch (e) {
    console.warn("setAlwaysOnTop failed:", e);
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function newClock(overrides = {}) {
  return {
    id: uid(),
    country: "",
    city: "",
    ...overrides
  };
}

function resolveTimezone(clock) {
  if (!clock.country || clock.country === "Local") return LOCAL_TZ;
  const cities = window.TIMEZONES[clock.country];
  if (!cities) return LOCAL_TZ;
  if (clock.city && cities[clock.city]) return cities[clock.city];
  const first = Object.values(cities)[0];
  return first || LOCAL_TZ;
}

const dateFmtCache = new Map();
function getFormatter(tz, hour12) {
  const key = `${tz}|${hour12}`;
  if (!dateFmtCache.has(key)) {
    dateFmtCache.set(
      key,
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        weekday: "short",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12
      })
    );
  }
  return dateFmtCache.get(key);
}

function formatDateTimeParts(date, tz, hour12) {
  const parts = getFormatter(tz, hour12).formatToParts(date);
  const pick = (t) => parts.find((p) => p.type === t)?.value || "";
  const hour = pick("hour");
  const minute = pick("minute");
  const second = pick("second");
  const period = pick("dayPeriod");
  const m = pick("month");
  const d = pick("day");
  const y = pick("year");
  let dateText;
  switch (state.settings.dateFormat) {
    case "DMY": dateText = `${d}/${m}/${y}`; break;
    case "YMD": dateText = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`; break;
    default: dateText = `${m}/${d}/${y}`;
  }
  return {
    timeHM: `${hour}:${minute}`,
    timeSec: hour12 && period ? `${second} ${period}` : second,
    weekday: pick("weekday").toUpperCase(),
    dateText
  };
}

function getTzMeta(tz) {
  const now = new Date();
  let abbr = "";
  let offset = "";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short"
    }).formatToParts(now);
    abbr = parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch (_) {}
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset"
    }).formatToParts(now);
    offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
  } catch (_) {}
  return { abbr, offset };
}

let SEARCH_INDEX = null;
function buildSearchIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const out = [];
  for (const country of Object.keys(window.TIMEZONES)) {
    out.push({
      country,
      city: "",
      label: country,
      sub: "Country",
      hay: country.toLowerCase()
    });
    for (const city of Object.keys(window.TIMEZONES[country])) {
      out.push({
        country,
        city,
        label: city,
        sub: country,
        hay: (city + " " + country).toLowerCase()
      });
    }
  }
  out.sort((a, b) => a.label.localeCompare(b.label));
  SEARCH_INDEX = out;
  return out;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function highlight(text, query) {
  if (!query) return escapeHtml(text);
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let out = "";
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      out += escapeHtml(text.slice(i));
      break;
    }
    out += escapeHtml(text.slice(i, idx));
    out += "<mark>" + escapeHtml(text.slice(idx, idx + q.length)) + "</mark>";
    i = idx + q.length;
  }
  return out;
}

function searchEntries(query, limit = 20) {
  const idx = buildSearchIndex();
  const q = query.trim().toLowerCase();
  if (!q) return idx.slice(0, limit);
  const starts = [];
  const contains = [];
  for (const entry of idx) {
    const pos = entry.hay.indexOf(q);
    if (pos === -1) continue;
    if (pos === 0 || entry.hay[pos - 1] === " ") starts.push(entry);
    else contains.push(entry);
    if (starts.length + contains.length > limit * 3) break;
  }
  return starts.concat(contains).slice(0, limit);
}

function populateCountrySelect(select, currentCountry) {
  select.innerHTML = "";
  const opts = [["Local", "Local Time"]];
  Object.keys(window.TIMEZONES)
    .sort((a, b) => a.localeCompare(b))
    .forEach((c) => opts.push([c, c]));
  for (const [val, label] of opts) {
    const o = document.createElement("option");
    o.value = val;
    o.textContent = label;
    if (val === (currentCountry || "Local")) o.selected = true;
    select.appendChild(o);
  }
}

function populateCitySelect(select, country, currentCity) {
  select.innerHTML = "";
  if (!country || country === "Local") {
    const o = document.createElement("option");
    o.value = "";
    o.textContent = "— System —";
    select.appendChild(o);
    select.disabled = true;
    return;
  }
  select.disabled = false;
  const cities = window.TIMEZONES[country] || {};
  const names = Object.keys(cities).sort((a, b) => a.localeCompare(b));
  names.forEach((city) => {
    const o = document.createElement("option");
    o.value = city;
    o.textContent = city;
    if (city === currentCity) o.selected = true;
    select.appendChild(o);
  });
  if (!names.includes(currentCity) && names.length) {
    select.value = names[0];
  }
}

function renderClock(clock) {
  const node = $tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = clock.id;

  const countrySel = node.querySelector(".country-select");
  const citySel = node.querySelector(".city-select");
  const removeBtn = node.querySelector(".remove-btn");

  populateCountrySelect(countrySel, clock.country || "Local");
  populateCitySelect(citySel, clock.country || "Local", clock.city || "");

  countrySel.addEventListener("change", () => {
    clock.country = countrySel.value === "Local" ? "" : countrySel.value;
    clock.city = "";
    populateCitySelect(citySel, countrySel.value, "");
    if (citySel.value) clock.city = citySel.value;
    tickClock(node, clock);
    markDirty();
  });

  citySel.addEventListener("change", () => {
    clock.city = citySel.value;
    tickClock(node, clock);
    markDirty();
  });

  removeBtn.addEventListener("click", () => {
    state.clocks = state.clocks.filter((c) => c.id !== clock.id);
    node.remove();
    markDirty();
  });

  attachCardDnD(node, clock);

  $list.appendChild(node);
  tickClock(node, clock);
}

let dragSrcId = null;

function clearDropTargets() {
  $list.querySelectorAll(".drop-above, .drop-below").forEach((el) => {
    el.classList.remove("drop-above", "drop-below");
  });
}

function attachCardDnD(node, clock) {
  const handle = node.querySelector(".drag-handle");

  const disarm = () => node.setAttribute("draggable", "false");
  handle.addEventListener("mousedown", () => {
    node.setAttribute("draggable", "true");
  });
  handle.addEventListener("mouseup", disarm);

  node.addEventListener("dragstart", (e) => {
    if (node.getAttribute("draggable") !== "true") {
      e.preventDefault();
      return;
    }
    dragSrcId = clock.id;
    node.classList.add("dragging");
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", clock.id); } catch (_) {}
    }
  });

  node.addEventListener("dragend", () => {
    dragSrcId = null;
    node.classList.remove("dragging");
    disarm();
    clearDropTargets();
  });

  node.addEventListener("dragenter", (e) => {
    if (!dragSrcId || dragSrcId === clock.id) return;
    e.preventDefault();
  });

  node.addEventListener("dragover", (e) => {
    if (!dragSrcId || dragSrcId === clock.id) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    const rect = node.getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    if (before) {
      if (!node.classList.contains("drop-above")) {
        clearDropTargets();
        node.classList.add("drop-above");
      }
    } else {
      if (!node.classList.contains("drop-below")) {
        clearDropTargets();
        node.classList.add("drop-below");
      }
    }
  });

  node.addEventListener("drop", (e) => {
    if (!dragSrcId || dragSrcId === clock.id) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = node.getBoundingClientRect();
    const before = e.clientY - rect.top < rect.height / 2;
    clearDropTargets();
    reorderClocks(dragSrcId, clock.id, before);
  });
}

function reorderClocks(srcId, dstId, before) {
  const srcIdx = state.clocks.findIndex((c) => c.id === srcId);
  if (srcIdx === -1) return;
  const [moved] = state.clocks.splice(srcIdx, 1);
  const dstIdx = state.clocks.findIndex((c) => c.id === dstId);
  if (dstIdx === -1) {
    state.clocks.splice(srcIdx, 0, moved);
    return;
  }
  const insertAt = before ? dstIdx : dstIdx + 1;
  state.clocks.splice(insertAt, 0, moved);

  const srcNode = $list.querySelector(`[data-id="${srcId}"]`);
  const dstNode = $list.querySelector(`[data-id="${dstId}"]`);
  if (srcNode && dstNode) {
    if (before) $list.insertBefore(srcNode, dstNode);
    else $list.insertBefore(srcNode, dstNode.nextSibling);
  }
  markDirty();
}

const tzHourFmtCache = new Map();
function getTzHourFormatter(tz) {
  if (!tzHourFmtCache.has(tz)) {
    tzHourFmtCache.set(tz, new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }));
  }
  return tzHourFmtCache.get(tz);
}

function getZonedHMS(tz, date) {
  const parts = getTzHourFormatter(tz).formatToParts(date);
  const num = (t) => Number(parts.find((p) => p.type === t)?.value || 0);
  let h = num("hour");
  if (h === 24) h = 0;
  return { h, m: num("minute"), s: num("second") };
}

function parseHexColor(hex) {
  if (typeof hex !== "string") return { r: 0, g: 0, b: 0 };
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  const c = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

function blendColors(a, b, t) {
  const A = parseHexColor(a);
  const B = parseHexColor(b);
  return rgbToHex(
    A.r + (B.r - A.r) * t,
    A.g + (B.g - A.g) * t,
    A.b + (B.b - A.b) * t
  );
}

function timeStringToMinutes(s) {
  if (typeof s !== "string") return 0;
  const [h, m] = s.split(":").map(Number);
  const hh = Number.isFinite(h) ? ((h % 24) + 24) % 24 : 0;
  const mm = Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0;
  return hh * 60 + mm;
}

function getTimeOfDayColor(h, m, s) {
  const bands = Array.isArray(state.settings.timeBands) ? state.settings.timeBands : [];
  if (!bands.length) return null;
  const blend = Math.max(0, Number(state.settings.blendMinutes) || 0);
  const t = h * 60 + m + (s || 0) / 60;

  const sorted = bands
    .map((b) => ({ color: b.color || "#888888", startMin: timeStringToMinutes(b.startTime) }))
    .sort((a, b) => a.startMin - b.startMin);

  let currIdx = sorted.length - 1;
  for (let i = 0; i < sorted.length; i++) {
    const s1 = sorted[i].startMin;
    const s2 = sorted[(i + 1) % sorted.length].startMin;
    if (s1 < s2) {
      if (t >= s1 && t < s2) { currIdx = i; break; }
    } else {
      if (t >= s1 || t < s2) { currIdx = i; break; }
    }
  }

  const curr = sorted[currIdx];
  const next = sorted[(currIdx + 1) % sorted.length];
  const prev = sorted[(currIdx - 1 + sorted.length) % sorted.length];

  let distToNext = next.startMin - t;
  if (distToNext < 0) distToNext += 1440;
  let distFromPrev = t - curr.startMin;
  if (distFromPrev < 0) distFromPrev += 1440;

  if (blend > 0 && distToNext < blend) {
    const ratio = 0.5 * (1 - distToNext / blend);
    return blendColors(curr.color, next.color, ratio);
  }
  if (blend > 0 && distFromPrev < blend) {
    const ratio = 0.5 + 0.5 * (distFromPrev / blend);
    return blendColors(prev.color, curr.color, ratio);
  }
  return curr.color;
}

function tickClock(node, clock) {
  const tz = resolveTimezone(clock);
  const now = new Date();
  const f = formatDateTimeParts(now, tz, state.hour12);
  node.querySelector(".time-hm").textContent = f.timeHM;
  node.querySelector(".time-sec").textContent = f.timeSec;
  node.querySelector(".weekday").textContent = f.weekday;
  node.querySelector(".date-num").textContent = f.dateText;
  const { abbr, offset } = getTzMeta(tz);
  const tzName = clock.country && clock.country !== "Local"
    ? `${clock.city || ""}${clock.city ? ", " : ""}${clock.country} · ${abbr || tz}`
    : `Local · ${abbr || tz}`;
  node.querySelector(".tz-name").textContent = tzName;
  node.querySelector(".tz-offset").textContent = offset;

  const dot = node.querySelector(".time-status-dot");
  if (dot) {
    const { h, m, s } = getZonedHMS(tz, now);
    const color = getTimeOfDayColor(h, m, s);
    if (color) {
      dot.style.color = color;
      dot.hidden = false;
    } else {
      dot.hidden = true;
    }
  }
}

function tickAll() {
  const cards = $list.querySelectorAll(".clock-card");
  cards.forEach((node) => {
    const id = node.dataset.id;
    const clock = state.clocks.find((c) => c.id === id);
    if (clock) tickClock(node, clock);
  });
}

function render() {
  $list.innerHTML = "";
  state.clocks.forEach(renderClock);
}

function addClock() {
  const sel = pendingSelection;
  const clock = newClock(
    sel ? { country: sel.country, city: sel.city } : {}
  );
  state.clocks.push(clock);
  renderClock(clock);
  clearPendingSelection();
  const node = $list.querySelector(`[data-id="${clock.id}"]`);
  if (node) node.scrollIntoView({ block: "nearest", behavior: "smooth" });
  markDirty();
}

function setPendingSelection(entry) {
  pendingSelection = { country: entry.country, city: entry.city };
  $search.value = entry.city
    ? `${entry.city}, ${entry.country}`
    : entry.country;
  $searchClear.hidden = false;
  $addBtn.classList.add("armed");
  $addBtn.title = `Add ${entry.city ? entry.city + ", " : ""}${entry.country}`;
}

function clearPendingSelection() {
  pendingSelection = null;
  $search.value = "";
  $searchClear.hidden = true;
  $addBtn.classList.remove("armed");
  $addBtn.title = "Add selected as new clock";
  hideSearchResults();
}

let searchActiveIdx = -1;
let searchEntriesCurrent = [];

function renderSearchResults(query) {
  searchEntriesCurrent = searchEntries(query, 30);
  searchActiveIdx = -1;
  if (!searchEntriesCurrent.length) {
    $searchResults.innerHTML = '<li class="empty">No matches</li>';
    $searchResults.hidden = false;
    return;
  }
  const q = query.trim();
  $searchResults.innerHTML = searchEntriesCurrent
    .map((e, i) => {
      const main = highlight(e.label, q);
      const sub = highlight(e.sub, q);
      return `<li role="option" data-i="${i}"><span class="sr-main">${main}</span><span class="sr-country">${sub}</span></li>`;
    })
    .join("");
  $searchResults.hidden = false;
}

function hideSearchResults() {
  $searchResults.hidden = true;
  searchActiveIdx = -1;
}

function setSearchActive(i) {
  const items = $searchResults.querySelectorAll("li[data-i]");
  items.forEach((el) => el.classList.remove("active"));
  if (i >= 0 && i < items.length) {
    items[i].classList.add("active");
    items[i].scrollIntoView({ block: "nearest" });
    searchActiveIdx = i;
  } else {
    searchActiveIdx = -1;
  }
}

function initGlobalSearch() {
  $search.addEventListener("input", () => {
    if (pendingSelection) {
      pendingSelection = null;
      $addBtn.classList.remove("armed");
      $addBtn.title = "Add selected as new clock";
    }
    const v = $search.value;
    $searchClear.hidden = !v;
    renderSearchResults(v);
  });

  $search.addEventListener("focus", () => {
    if (!pendingSelection) renderSearchResults($search.value);
  });

  $search.addEventListener("blur", () => {
    setTimeout(hideSearchResults, 120);
  });

  $search.addEventListener("keydown", (e) => {
    if ($searchResults.hidden) {
      if (e.key === "Enter" && pendingSelection) {
        e.preventDefault();
        addClock();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSearchActive(Math.min(searchActiveIdx + 1, searchEntriesCurrent.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSearchActive(Math.max(searchActiveIdx - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = searchActiveIdx >= 0 ? searchActiveIdx : 0;
      const entry = searchEntriesCurrent[idx];
      if (entry) {
        setPendingSelection(entry);
        hideSearchResults();
      }
    } else if (e.key === "Escape") {
      hideSearchResults();
      $search.blur();
    }
  });

  $searchResults.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li[data-i]");
    if (!li) return;
    e.preventDefault();
    const i = Number(li.dataset.i);
    const entry = searchEntriesCurrent[i];
    if (entry) {
      setPendingSelection(entry);
      hideSearchResults();
    }
  });

  $searchClear.addEventListener("click", () => {
    clearPendingSelection();
    $search.focus();
  });
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.dataset.theme = theme;
  $themeIcon.innerHTML = theme === "dark" ? "&#9728;" : "&#9789;";
  $themeBtn.title = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
}

function applyPinned(pinned) {
  state.pinned = pinned;
  $pinBtn.classList.toggle("pinned", pinned);
  $pinBtn.title = pinned ? "Unpin window" : "Pin window (always on top)";
  setAlwaysOnTopNative(pinned);
}

function applyHour12(hour12) {
  state.hour12 = hour12;
  $hourLabel.textContent = hour12 ? "12h" : "24h";
  dateFmtCache.clear();
  tickAll();
}

function markDirty() {
  state.dirty = true;
  $status.textContent = "Unsaved changes";
  $status.classList.add("dirty");
}

function clearDirty() {
  state.dirty = false;
  $status.textContent = "Saved";
  $status.classList.remove("dirty");
  setTimeout(() => {
    if (!state.dirty) $status.textContent = "";
  }, 2000);
}

function loadState() {
  const data = storage.get([
    STORAGE.clocks,
    STORAGE.theme,
    STORAGE.pinned,
    STORAGE.hour12,
    STORAGE.settings
  ]);

  applyTheme(data[STORAGE.theme] === "dark" ? "dark" : "light");
  applyPinned(data[STORAGE.pinned] === true);
  applyHour12(data[STORAGE.hour12] !== false);

  const savedSettings = data[STORAGE.settings] && typeof data[STORAGE.settings] === "object"
    ? data[STORAGE.settings]
    : {};
  state.settings = { ...DEFAULT_SETTINGS, ...savedSettings };
  if (!Array.isArray(state.settings.timeBands) || !state.settings.timeBands.length) {
    state.settings.timeBands = DEFAULT_TIME_BANDS.map((b) => ({ ...b }));
  } else {
    state.settings.timeBands = state.settings.timeBands.map((b) => ({
      name: typeof b.name === "string" ? b.name : "",
      startTime: typeof b.startTime === "string" ? b.startTime : "00:00",
      color: typeof b.color === "string" ? b.color : "#888888"
    }));
  }
  if (!Number.isFinite(state.settings.blendMinutes)) state.settings.blendMinutes = 30;
  applySettings();
  syncSettingsUI();

  const saved = Array.isArray(data[STORAGE.clocks]) ? data[STORAGE.clocks] : null;
  if (saved && saved.length) {
    state.clocks = saved.map((c) => ({
      id: c.id || uid(),
      country: c.country || "",
      city: c.city || ""
    }));
  } else {
    state.clocks = [newClock()];
  }
  render();
  $status.textContent = "";
}

function saveState() {
  storage.set({
    [STORAGE.clocks]: state.clocks.map((c) => ({
      id: c.id,
      country: c.country,
      city: c.city
    })),
    [STORAGE.theme]: state.theme,
    [STORAGE.pinned]: state.pinned,
    [STORAGE.hour12]: state.hour12,
    [STORAGE.settings]: state.settings
  });
  clearDirty();
}

function applySettings() {
  const s = state.settings;
  document.documentElement.dataset.font = s.fontFamily;
  document.documentElement.dataset.size = s.fontSize;
  document.body.classList.toggle("hide-seconds", !s.showSeconds);
  document.body.classList.toggle("hide-meta", !s.showMeta);
  document.body.classList.toggle("mascot-on", !!s.scorpionEnabled);
  if ($mascot) {
    $mascot.hidden = !s.scorpionEnabled;
    if (!s.scorpionEnabled) hideBubble();
  }
  applyScorpionModel(s.scorpionModel);
  applyScorpionColor(s.scorpionColor);
  dateFmtCache.clear();
  tickAll();
}

function applyScorpionModel(modelId) {
  const models = window.SCORPION_MODELS || [];
  const model = models.find((m) => m.id === modelId) || models[0];
  if (!model) return;
  document.querySelectorAll(".brand-icon, .mascot-sprite svg").forEach((svg) => {
    svg.innerHTML = model.svg;
  });
}

function applyScorpionColor(colorId) {
  const colors = window.SCORPION_COLORS || [];
  const color = colors.find((c) => c.id === colorId);
  if (!color || !color.value) {
    document.documentElement.style.removeProperty("--scorpion-color");
  } else {
    document.documentElement.style.setProperty("--scorpion-color", color.value);
  }
}

function buildScorpionGrid() {
  if (!$scorpionGrid || !window.SCORPION_MODELS) return;
  $scorpionGrid.innerHTML = "";
  for (const model of window.SCORPION_MODELS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "scorpion-swatch";
    btn.dataset.id = model.id;
    btn.title = model.name;
    btn.innerHTML =
      '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      model.svg +
      "</svg>";
    btn.addEventListener("click", () => {
      state.settings.scorpionModel = model.id;
      applyScorpionModel(model.id);
      syncSwatchSelection();
      persistSettings();
    });
    $scorpionGrid.appendChild(btn);
  }
}

function buildColorGrid() {
  if (!$colorGrid || !window.SCORPION_COLORS) return;
  $colorGrid.innerHTML = "";
  for (const c of window.SCORPION_COLORS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "color-swatch";
    btn.dataset.id = c.id;
    btn.title = c.name;
    if (c.value) {
      btn.style.background = c.value;
    } else {
      btn.classList.add("color-accent");
    }
    btn.addEventListener("click", () => {
      state.settings.scorpionColor = c.id;
      applyScorpionColor(c.id);
      syncSwatchSelection();
      persistSettings();
    });
    $colorGrid.appendChild(btn);
  }
}

function normalize24h(raw) {
  if (!raw) return "";
  let s = String(raw).trim().replace(/\s+/g, "");
  const ampm = s.match(/(am|pm)$/i);
  if (ampm) s = s.slice(0, -2);
  let h, m;
  const colon = s.match(/^(\d{1,2}):(\d{1,2})$/);
  const digits = s.match(/^(\d{1,4})$/);
  if (colon) {
    h = parseInt(colon[1], 10);
    m = parseInt(colon[2], 10);
  } else if (digits) {
    const d = digits[1].padStart(4, "0");
    h = parseInt(d.slice(0, 2), 10);
    m = parseInt(d.slice(2), 10);
  } else {
    return "";
  }
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  if (ampm) {
    const tag = ampm[1].toLowerCase();
    if (h < 1 || h > 12) return "";
    if (tag === "pm" && h !== 12) h += 12;
    if (tag === "am" && h === 12) h = 0;
  }
  if (h < 0 || h > 23 || m < 0 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function buildTimeBandsList() {
  if (!$timeBandsList) return;
  $timeBandsList.innerHTML = "";
  const bands = state.settings.timeBands || [];
  bands.forEach((band, idx) => {
    const row = document.createElement("div");
    row.className = "time-band-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "band-name";
    nameInput.value = band.name || "";
    nameInput.placeholder = "Label";

    const startInput = document.createElement("input");
    startInput.type = "text";
    startInput.className = "band-start";
    startInput.value = normalize24h(band.startTime) || "00:00";
    startInput.placeholder = "HH:MM";
    startInput.maxLength = 5;
    startInput.inputMode = "numeric";
    startInput.pattern = "^([01]\\d|2[0-3]):[0-5]\\d$";
    startInput.title = "24-hour format, HH:MM";
    startInput.setAttribute("aria-label", "Band start time (24-hour HH:MM)");

    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "band-color";
    colorInput.value = band.color || "#888888";

    nameInput.addEventListener("change", () => {
      state.settings.timeBands[idx].name = nameInput.value;
      persistSettings();
    });
    startInput.addEventListener("change", () => {
      const clean = normalize24h(startInput.value) || state.settings.timeBands[idx].startTime || "00:00";
      startInput.value = clean;
      state.settings.timeBands[idx].startTime = clean;
      tickAll();
      persistSettings();
    });
    colorInput.addEventListener("input", () => {
      state.settings.timeBands[idx].color = colorInput.value;
      tickAll();
      persistSettings();
    });

    row.appendChild(nameInput);
    row.appendChild(startInput);
    row.appendChild(colorInput);
    $timeBandsList.appendChild(row);
  });
}

function syncSwatchSelection() {
  document.querySelectorAll(".scorpion-swatch").forEach((b) => {
    b.classList.toggle("selected", b.dataset.id === state.settings.scorpionModel);
  });
  document.querySelectorAll(".color-swatch").forEach((b) => {
    b.classList.toggle("selected", b.dataset.id === state.settings.scorpionColor);
  });
}

function syncSettingsUI() {
  const s = state.settings;
  $setFontFamily.value = s.fontFamily;
  $setFontSize.value = s.fontSize;
  $setDateFormat.value = s.dateFormat;
  $setShowSeconds.checked = s.showSeconds;
  $setShowMeta.checked = s.showMeta;
  $setScorpion.checked = s.scorpionEnabled;
  $setGreetings.checked = s.greetingsEnabled;
  if ($setBlendMinutes) $setBlendMinutes.value = s.blendMinutes;
  buildTimeBandsList();
  syncSwatchSelection();
}

function persistSettings() {
  storage.set({ [STORAGE.settings]: state.settings });
}

function openSettings() {
  syncSettingsUI();
  $settingsPanel.hidden = false;
  $settingsBackdrop.hidden = false;
  $settingsPanel.setAttribute("aria-hidden", "false");
}

function closeSettings() {
  $settingsPanel.hidden = true;
  $settingsBackdrop.hidden = true;
  $settingsPanel.setAttribute("aria-hidden", "true");
}

const GREETINGS = [
  "Hello!", "Hi!", "Hey!", "Howdy!", "Hola!", "Ciao!", "Bonjour!",
  "Tick tock!", "What time is it?", "Have a nice day!", "Cheers!",
  "Stay sharp!", "Don't be late!", "Time flies!", "Click click!"
];

let mascotX = 20;
let mascotDir = 1;
const MASCOT_SPEED = 0.5;
const MASCOT_WIDTH = 44;
let mascotLastGreet = 0;
let mascotBubbleTimer = null;
let mascotLastFrame = 0;
let mascotRunning = false;

function showBubble(text) {
  if (!$mascotBubble) return;
  $mascotBubble.textContent = text;
  $mascotBubble.hidden = false;
  clearTimeout(mascotBubbleTimer);
  mascotBubbleTimer = setTimeout(hideBubble, 2400);
}

function hideBubble() {
  if (!$mascotBubble) return;
  $mascotBubble.hidden = true;
  clearTimeout(mascotBubbleTimer);
}

function mascotFrame(ts) {
  if (!state.settings.scorpionEnabled) {
    mascotLastFrame = 0;
    mascotRunning = false;
    return;
  }
  if (!mascotLastFrame) mascotLastFrame = ts;
  const dt = Math.min(48, ts - mascotLastFrame);
  mascotLastFrame = ts;

  const footer = document.querySelector(".app-footer");
  const max = (footer ? footer.clientWidth : window.innerWidth) - MASCOT_WIDTH - 8;
  mascotX += MASCOT_SPEED * mascotDir * (dt / 16.67);
  if (mascotX >= max) { mascotX = max; mascotDir = -1; }
  else if (mascotX <= 4) { mascotX = 4; mascotDir = 1; }

  const bob = Math.sin(ts / 110) * 1.2;
  const flip = mascotDir === 1 ? -1 : 1;
  $mascot.style.transform = `translate(${mascotX}px, ${bob}px) scaleX(${flip})`;
  if ($mascotBubble && !$mascotBubble.hidden) {
    $mascotBubble.style.transform = `translateX(-50%) scaleX(${flip})`;
  }

  if (state.settings.greetingsEnabled) {
    if (!mascotLastGreet) mascotLastGreet = ts + 4000;
    if (ts >= mascotLastGreet) {
      const g = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      showBubble(g);
      mascotLastGreet = ts + 6000 + Math.random() * 9000;
    }
  } else {
    hideBubble();
    mascotLastGreet = 0;
  }

  requestAnimationFrame(mascotFrame);
}

function startMascot() {
  if (mascotRunning) return;
  if (!state.settings.scorpionEnabled) return;
  mascotRunning = true;
  mascotLastFrame = 0;
  requestAnimationFrame(mascotFrame);
}


$addBtn.addEventListener("click", addClock);
$saveBtn.addEventListener("click", saveState);

$themeBtn.addEventListener("click", () => {
  const next = state.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  storage.set({ [STORAGE.theme]: next });
});

$pinBtn.addEventListener("click", () => {
  const next = !state.pinned;
  applyPinned(next);
  storage.set({ [STORAGE.pinned]: next });
});

$hourBtn.addEventListener("click", () => {
  const next = !state.hour12;
  applyHour12(next);
  storage.set({ [STORAGE.hour12]: next });
});

$settingsBtn.addEventListener("click", openSettings);
$settingsClose.addEventListener("click", closeSettings);
$settingsBackdrop.addEventListener("click", closeSettings);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !$settingsPanel.hidden) closeSettings();
});

$setFontFamily.addEventListener("change", () => {
  state.settings.fontFamily = $setFontFamily.value;
  applySettings();
  persistSettings();
});
$setFontSize.addEventListener("change", () => {
  state.settings.fontSize = $setFontSize.value;
  applySettings();
  persistSettings();
});
$setDateFormat.addEventListener("change", () => {
  state.settings.dateFormat = $setDateFormat.value;
  applySettings();
  persistSettings();
});
$setShowSeconds.addEventListener("change", () => {
  state.settings.showSeconds = $setShowSeconds.checked;
  applySettings();
  persistSettings();
});
$setShowMeta.addEventListener("change", () => {
  state.settings.showMeta = $setShowMeta.checked;
  applySettings();
  persistSettings();
});
$setScorpion.addEventListener("change", () => {
  state.settings.scorpionEnabled = $setScorpion.checked;
  applySettings();
  persistSettings();
  if (state.settings.scorpionEnabled) startMascot();
});
$setGreetings.addEventListener("change", () => {
  state.settings.greetingsEnabled = $setGreetings.checked;
  persistSettings();
});
if ($setBlendMinutes) {
  $setBlendMinutes.addEventListener("input", () => {
    const v = Number($setBlendMinutes.value);
    state.settings.blendMinutes = Number.isFinite(v) && v >= 0 ? v : 0;
    tickAll();
    persistSettings();
  });
}

$settingsSaveBtn.addEventListener("click", () => {
  saveState();
  closeSettings();
});

initGlobalSearch();
buildScorpionGrid();
buildColorGrid();
loadState();
tickAll();
setInterval(tickAll, 1000);
startMascot();
