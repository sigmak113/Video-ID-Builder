(() => {
  const STORAGE_KEY = "video-id-builder-state-v1";
  const TYPES_KEY = "video-id-builder-types-v1";
  const PRODUCTS_KEY = "video-id-builder-products-v1";
  const LINES_KEY = "video-id-builder-lines-v1";
  const ADD_VALUE = "__add__";

  const DEFAULT_TYPES = [
    { code: "P", label: "프로모션", builtin: true },
    { code: "K", label: "기획", builtin: true },
    { code: "S", label: "자체제작", builtin: true },
  ];
  // 제품은 항상 "라인코드+번호" 형태로 통일. 지금은 라인당 제품이 하나뿐이어도
  // 나중에 같은 라인에 제품이 추가되면 번호만 이어붙이면 되도록 처음부터 번호를 붙여둔다.
  const DEFAULT_LINES = [
    { code: "A", label: "A" },
    { code: "B", label: "B" },
    { code: "C", label: "C" },
    { code: "D", label: "D" },
  ];
  const DEFAULT_PRODUCTS = [
    { code: "A1", label: "A", lineCode: "A", builtin: true },
    { code: "B1", label: "B", lineCode: "B", builtin: true },
    { code: "C1", label: "C", lineCode: "C", builtin: true },
    { code: "D1", label: "D", lineCode: "D", builtin: true },
  ];

  const defaultState = {
    type: "P",
    product: "A1",
    year: 26,
    round: 0,
    script: 0,
    intro: 0,
    copy: false,
    banner: false,
    ratio: "916",
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaultState };
      return { ...defaultState, ...JSON.parse(raw) };
    } catch (e) {
      return { ...defaultState };
    }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

  function loadList(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [...defaults];
      const custom = JSON.parse(raw);
      const codes = new Set(defaults.map(d => d.code));
      return [...defaults, ...custom.filter(c => !codes.has(c.code))];
    } catch (e) {
      return [...defaults];
    }
  }
  function saveList(key, list) { localStorage.setItem(key, JSON.stringify(list)); }

  let state = loadState();
  let typeList = loadList(TYPES_KEY, DEFAULT_TYPES);
  let productList = loadList(PRODUCTS_KEY, DEFAULT_PRODUCTS);
  let lineList = loadList(LINES_KEY, DEFAULT_LINES);

  function pad2(n) {
    n = Math.max(0, Math.min(99, Number(n) || 0));
    return String(n).padStart(2, "0");
  }

  function buildId() {
    const yr = pad2(state.year), rd = pad2(state.round), sc = pad2(state.script), it = pad2(state.intro);
    const cp = state.copy ? "1" : "0", bn = state.banner ? "1" : "0";
    return `${state.type}-${state.product}-${yr}R${rd}-S${sc}-I${it}-C${cp}-B${bn}-${state.ratio}`;
  }

  function lineLabelOf(code) {
    const line = lineList.find(l => l.code === code);
    return line ? line.label : code;
  }

  // ---------- 영상형태 select ----------
  function fillTypeSelect() {
    const sel = document.getElementById("typeSelect");
    sel.innerHTML = "";
    typeList.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.code;
      opt.textContent = item.code;
      opt.title = item.label || item.code;
      sel.appendChild(opt);
    });
    const addOpt = document.createElement("option");
    addOpt.value = ADD_VALUE;
    addOpt.className = "opt-add";
    addOpt.textContent = "+ 추가";
    sel.appendChild(addOpt);
    sel.value = state.type;
    sel.title = (typeList.find(t => t.code === state.type) || {}).label || "";
  }

  // ---------- 제품 select (라인은 optgroup으로 그룹핑) ----------
  function fillProductSelect() {
    const sel = document.getElementById("productSelect");
    sel.innerHTML = "";
    const noLine = productList.filter(p => !p.lineCode);
    noLine.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item.code;
      opt.textContent = item.code;
      opt.title = item.label || item.code;
      sel.appendChild(opt);
    });
    const lineCodes = [...new Set(productList.filter(p => p.lineCode).map(p => p.lineCode))];
    lineCodes.forEach(lc => {
      const group = document.createElement("optgroup");
      group.label = lineLabelOf(lc);
      productList.filter(p => p.lineCode === lc).forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.code;
        opt.textContent = item.code;
        opt.title = `${lineLabelOf(lc)} · ${item.label}`;
        group.appendChild(opt);
      });
      sel.appendChild(group);
    });
    const addOpt = document.createElement("option");
    addOpt.value = ADD_VALUE;
    addOpt.className = "opt-add";
    addOpt.textContent = "+ 추가";
    sel.appendChild(addOpt);
    sel.value = state.product;
    const cur = productList.find(p => p.code === state.product);
    sel.title = cur ? (cur.lineCode ? `${lineLabelOf(cur.lineCode)} · ${cur.label}` : cur.label) : "";
  }

  function addType() {
    let code = window.prompt("새 영상형태 코드를 입력하세요 (영문 1자, 예: W)");
    if (!code) return false;
    code = code.trim().toUpperCase().slice(0, 1);
    if (!/^[A-Z0-9]$/.test(code)) { alert("영문 또는 숫자 1자만 가능합니다."); return false; }
    if (typeList.some(t => t.code === code)) { alert("이미 있는 코드입니다."); return false; }
    const label = window.prompt(`"${code}"의 이름을 입력하세요 (예: 외주제작)`, "") || code;
    const item = { code, label: (label || code).trim() || code, builtin: false };
    typeList.push(item);
    saveList(TYPES_KEY, typeList.filter(t => !t.builtin));
    state.type = code;
    return true;
  }

  function addProduct() {
    const existingLines = lineList.map(l => `${l.code}=${l.label}`).join(", ");
    let lineCode = window.prompt(
      `라인 코드를 입력하세요 (영문 1자)\n` +
      (existingLines ? `기존 라인: ${existingLines}\n같은 라인이면 같은 코드를 입력하세요.` : `아직 등록된 라인이 없습니다. 새 코드를 만들어주세요.`)
    );
    if (!lineCode) return false;
    lineCode = lineCode.trim().toUpperCase().slice(0, 1);
    if (!/^[A-Z0-9]$/.test(lineCode)) { alert("영문 또는 숫자 1자만 가능합니다."); return false; }

    let line = lineList.find(l => l.code === lineCode);
    if (!line) {
      const lineLabel = window.prompt(`"${lineCode}" 라인의 이름을 입력하세요 (예: 리프팅라인)`, "") || lineCode;
      line = { code: lineCode, label: (lineLabel || lineCode).trim() || lineCode };
      lineList.push(line);
      saveList(LINES_KEY, lineList);
    }

    const existingNums = productList
      .filter(p => p.lineCode === lineCode)
      .map(p => parseInt(p.code.slice(1), 10) || 0);
    const nextNum = existingNums.length ? Math.max(...existingNums) + 1 : 1;

    let numStr;
    if (existingNums.length === 0) {
      // 이 라인의 첫 제품은 묻지 않고 자동으로 1번 부여
      numStr = "1";
    } else {
      numStr = window.prompt(`"${line.label}" 라인 안에서 제품 번호를 입력하세요`, String(nextNum));
      if (numStr === null) return false;
      numStr = numStr.trim() || String(nextNum);
      if (!/^\d{1,2}$/.test(numStr)) { alert("숫자 1~2자리만 가능합니다."); return false; }
    }

    const code = `${lineCode}${numStr}`;
    if (productList.some(p => p.code === code)) { alert("이미 있는 코드입니다."); return false; }

    const label = window.prompt(`제품 이름을 입력하세요 (예: 주름크림)`, "") || code;
    const item = { code, label: (label || code).trim() || code, lineCode, builtin: false };
    productList.push(item);
    saveList(PRODUCTS_KEY, productList.filter(p => !p.builtin));
    state.product = code;
    return true;
  }

  function render() {
    const id = buildId();
    document.getElementById("idText").textContent = id;
    document.getElementById("ffmpegId").textContent = id;

    fillTypeSelect();
    fillProductSelect();

    document.querySelector('select[data-field-input="year"]').value = state.year;
    document.querySelector('select[data-field-input="round"]').value = state.round;
    document.querySelector('select[data-field-input="script"]').value = state.script;
    document.querySelector('select[data-field-input="intro"]').value = state.intro;

    document.getElementById("copySelect").value = state.copy ? "1" : "0";
    document.getElementById("bannerSelect").value = state.banner ? "1" : "0";
    document.getElementById("ratioSelect").value = state.ratio;

    saveState();
  }

  // ---------- 이벤트 바인딩 ----------
  document.getElementById("typeSelect").addEventListener("change", (e) => {
    if (e.target.value === ADD_VALUE) {
      const ok = addType();
      if (!ok) { fillTypeSelect(); return; }
    } else {
      state.type = e.target.value;
    }
    render();
  });

  document.getElementById("productSelect").addEventListener("change", (e) => {
    if (e.target.value === ADD_VALUE) {
      const ok = addProduct();
      if (!ok) { fillProductSelect(); return; }
    } else {
      state.product = e.target.value;
    }
    render();
  });

  const NUMERIC_FIELDS = ["year", "round", "script", "intro"];
  NUMERIC_FIELDS.forEach(field => {
    const select = document.querySelector(`select[data-field-input="${field}"]`);
    for (let n = 0; n <= 99; n++) {
      const opt = document.createElement("option");
      opt.value = n;
      opt.textContent = pad2(n);
      select.appendChild(opt);
    }
    select.addEventListener("change", () => { state[field] = Number(select.value); render(); });
    select.closest(".select-box").addEventListener("wheel", e => {
      e.preventDefault();
      const val = Math.max(0, Math.min(99, Number(state[field]) + (e.deltaY < 0 ? 1 : -1)));
      state[field] = val;
      render();
    }, { passive: false });
  });

  document.getElementById("copySelect").addEventListener("change", (e) => { state.copy = e.target.value === "1"; render(); });
  document.getElementById("bannerSelect").addEventListener("change", (e) => { state.banner = e.target.value === "1"; render(); });
  document.getElementById("ratioSelect").addEventListener("change", (e) => { state.ratio = e.target.value; render(); });

  // copy button
  const copyBtn = document.getElementById("copyBtn");
  copyBtn.addEventListener("click", async () => {
    await copyText(buildId());
    copyBtn.textContent = "복사됨 ✓";
    copyBtn.classList.add("copied");
    setTimeout(() => { copyBtn.textContent = "ID 복사"; copyBtn.classList.remove("copied"); }, 1200);
  });

  const ffmpegToggle = document.getElementById("ffmpegToggle");
  const ffmpegBox = document.getElementById("ffmpegBox");
  ffmpegToggle.addEventListener("click", () => ffmpegBox.classList.toggle("show"));

  const ffmpegCopyBtn = document.getElementById("ffmpegCopyBtn");
  ffmpegCopyBtn.addEventListener("click", async () => {
    const cmd = `ffmpeg -i 원본.mp4 -metadata comment="${buildId()}" -codec copy 결과.mp4`;
    await copyText(cmd);
    ffmpegCopyBtn.textContent = "복사됨 ✓";
    setTimeout(() => { ffmpegCopyBtn.textContent = "명령어 복사"; }, 1200);
  });

  document.getElementById("resetBtn").addEventListener("click", () => { state = { ...defaultState }; render(); });

  async function copyText(text) {
    if (window.electronAPI && window.electronAPI.copyToClipboard) {
      window.electronAPI.copyToClipboard(text);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
  }

  // ---------- 영상 파일 드래그앤드롭 / 선택으로 ID 기록 ----------
  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("fileInput");
  const dzStatus = document.getElementById("dzStatus");

  function setStatus(el, text, kind) {
    el.textContent = text;
    el.className = "dz-status" + (kind ? " " + kind : "");
  }

  async function tagFile(filePath) {
    if (!filePath) return;
    if (!window.electronAPI || !window.electronAPI.embedId) {
      setStatus(dzStatus, "이 기능은 데스크톱 앱에서만 동작합니다.", "err");
      return;
    }
    const id = buildId();
    dropzone.classList.add("busy");
    setStatus(dzStatus, `"${id}" 기록 중...`, "busy");
    const result = await window.electronAPI.embedId(filePath, id);
    dropzone.classList.remove("busy");
    if (result.success) setStatus(dzStatus, "완료 — 파일에 ID가 기록됐습니다.", "ok");
    else setStatus(dzStatus, `실패: ${result.error}`, "err");
  }

  dropzone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) tagFile(file.path);
    fileInput.value = "";
  });
  ["dragenter", "dragover"].forEach(evt => {
    dropzone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.add("dragover"); });
  });
  ["dragleave", "drop"].forEach(evt => {
    dropzone.addEventListener(evt, e => { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove("dragover"); });
  });
  dropzone.addEventListener("drop", e => {
    const file = e.dataTransfer.files[0];
    if (file) tagFile(file.path);
  });

  // ---------- 다른 파일의 ID 확인하기 ----------
  const checkFileBtn = document.getElementById("checkFileBtn");
  const checkFileInput = document.getElementById("checkFileInput");
  const checkStatus = document.getElementById("checkStatus");

  checkFileBtn.addEventListener("click", () => checkFileInput.click());
  checkFileInput.addEventListener("change", async () => {
    const file = checkFileInput.files[0];
    checkFileInput.value = "";
    if (!file) return;
    if (!window.electronAPI || !window.electronAPI.readId) {
      setStatus(checkStatus, "이 기능은 데스크톱 앱에서만 동작합니다.", "err");
      return;
    }
    setStatus(checkStatus, "확인 중...", "busy");
    const result = await window.electronAPI.readId(file.path);
    if (!result.success) setStatus(checkStatus, `실패: ${result.error}`, "err");
    else if (result.id) setStatus(checkStatus, `기록된 ID: ${result.id}`, "ok");
    else setStatus(checkStatus, "이 파일엔 기록된 ID가 없습니다.", "err");
  });

  render();
})();
