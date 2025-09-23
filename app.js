const LS_KEY = "simple_expenses";
const LS_START = "simple_start";
const LS_BUDGET = "daily_budget";

let expenses = loadExpenses();
let startDate = localStorage.getItem(LS_START);
let DAILY_BUDGET = parseInt(localStorage.getItem(LS_BUDGET), 10) || null;

/* ---------- 앱 처음 실행 시: 하루 사용금액 설정 ---------- */
if (!DAILY_BUDGET || !startDate) {
  const input = prompt("하루 사용 금액을 설정하세요 (원):", "10000");
  const budget = parseInt(input, 10);
  if (!isNaN(budget) && budget > 0) {
    DAILY_BUDGET = budget;
    localStorage.setItem(LS_BUDGET, DAILY_BUDGET);
    const today = new Date();
    startDate = fmt(today);
    localStorage.setItem(LS_START, startDate);
  } else {
    alert("올바른 금액을 입력해야 합니다. 기본 10,000원으로 설정됩니다.");
    DAILY_BUDGET = 10000;
    localStorage.setItem(LS_BUDGET, DAILY_BUDGET);
    const today = new Date();
    startDate = fmt(today);
    localStorage.setItem(LS_START, startDate);
  }
}

/* ---------- 마이그레이션 ---------- */
function migrateExpensesFormat(raw) {
  const out = {};
  for (const [date, val] of Object.entries(raw || {})) {
    if (Array.isArray(val)) out[date] = val;
    else if (typeof val === "number")
      out[date] = val > 0 ? [{ item: "기존합계", amount: val }] : [];
    else out[date] = [];
  }
  return out;
}
function loadExpenses() {
  let parsed = {};
  try {
    parsed = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {}
  const migrated = migrateExpensesFormat(parsed);
  localStorage.setItem(LS_KEY, JSON.stringify(migrated));
  return migrated;
}

function saveExpenses() {
  localStorage.setItem(LS_KEY, JSON.stringify(expenses));
}

/* ---------- 날짜 유틸 ---------- */
function pad(n) {
  return String(n).padStart(2, "0");
}
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function parseISO(s) {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}

/* ---------- 전역 상태 ---------- */
let today = new Date();
let viewYear = today.getFullYear();
let viewMonth = today.getMonth();

const monthLabel = document.getElementById("monthLabel");
const grid = document.getElementById("grid");
const prevBtn = document.getElementById("prevMonth");
const nextBtn = document.getElementById("nextMonth");

const detailDate = document.getElementById("detailDate");
const totalSpentEl = document.getElementById("totalSpent");
const expenseList = document.getElementById("expenseList");
const newItemInput = document.getElementById("newItem");
const newAmountInput = document.getElementById("newAmount");
const addExpenseBtn = document.getElementById("addExpenseBtn");
const resetBtn = document.getElementById("resetBtn");

let currentKey = null;
let selectedCell = null;

/* ---------- 달력 유틸 ---------- */
function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDay = first.getDay();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++)
    cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getItems(key) {
  return Array.isArray(expenses[key]) ? expenses[key] : [];
}
function getTotalSpent(key) {
  return getItems(key).reduce((s, e) => s + e.amount, 0);
}

function calcBalanceUntil(date) {
  const start = parseISO(startDate);
  if (date < start) return null;
  let carry = 0;
  let d = new Date(start);
  while (d <= date) {
    const key = fmt(d);
    const spent = getTotalSpent(key);
    const budget = DAILY_BUDGET + carry;
    const left = budget - spent;
    carry = left;
    d.setDate(d.getDate() + 1);
  }
  return carry;
}

/* ---------- 상세 영역 ---------- */
function showDetail(key, cellEl) {
  currentKey = key;

  if (selectedCell) {
    selectedCell.classList.remove("selected");
  }
  if (cellEl) {
    cellEl.classList.add("selected");
    selectedCell = cellEl;
  }

  detailDate.textContent = key;
  const total = getTotalSpent(key);
  totalSpentEl.textContent =
    total > 0 ? `총합: ${total.toLocaleString()}원` : "";

  expenseList.innerHTML = "";
  getItems(key).forEach((e, idx) => {
    const li = document.createElement("li");
    li.textContent = `${e.item || "항목없음"} - ${e.amount.toLocaleString()}원`;
    li.addEventListener("click", () => {
      if (confirm("삭제할까요?")) {
        const items = getItems(key);
        items.splice(idx, 1);
        if (items.length === 0) delete expenses[key];
        else expenses[key] = items;
        saveExpenses();
        render();
        showDetail(key, document.querySelector(`[data-key="${key}"]`));
      }
    });
    expenseList.appendChild(li);
  });

  newItemInput.value = "";
  newAmountInput.value = "";
}

/* ---------- 지출 추가 ---------- */
addExpenseBtn.onclick = () => {
  if (!currentKey) {
    alert("먼저 날짜를 선택하세요!");
    return;
  }
  const item = newItemInput.value.trim();
  const amount = parseInt(newAmountInput.value, 10);
  if (isNaN(amount) || amount <= 0) {
    alert("금액을 입력해 주세요!");
    return;
  }

  const d = parseISO(currentKey);
  const balance = calcBalanceUntil(d);

  if (amount > balance) {
    const ok = confirm(
      `잔여금(${balance.toLocaleString()}원)보다 큰 금액입니다. 등록하시겠습니까?`
    );
    if (!ok) return;
  }

  const items = getItems(currentKey);
  items.push({ item, amount });
  expenses[currentKey] = items;
  saveExpenses();
  render();
  showDetail(currentKey, document.querySelector(`[data-key="${currentKey}"]`));
};

/* ---------- 전체 초기화 ---------- */
resetBtn.addEventListener("click", () => {
  if (confirm("정말 전체 초기화할까요? 모든 내역과 설정이 삭제됩니다.")) {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_START);
    localStorage.removeItem(LS_BUDGET);
    location.reload();
  }
});

/* ---------- 달력 렌더 ---------- */
function render() {
  const cells = buildMonth(viewYear, viewMonth);
  monthLabel.textContent = `${viewYear}년 ${viewMonth + 1}월`;

  grid.innerHTML = "";
  cells.forEach((d) => {
    const div = document.createElement("div");
    div.className = "cell" + (!d ? " blank" : "");
    if (!d) {
      grid.appendChild(div);
      return;
    }

    const key = fmt(d);
    div.dataset.key = key;

    const balance = calcBalanceUntil(d);
    if (balance === null) {
      div.classList.add("blank");
      grid.appendChild(div);
      return;
    }

    const dateEl = document.createElement("div");
    dateEl.className = "date";
    dateEl.textContent = d.getDate();

    const balEl = document.createElement("div");
    balEl.className = "balance";
    balEl.textContent = balance.toLocaleString() + "원";

    if (balance < 0) {
      balEl.style.color = "red";
      balEl.style.fontWeight = "bold";
    }

    div.appendChild(dateEl);
    div.appendChild(balEl);

    // --- 오늘 날짜 표시 ---
    const todayKey = fmt(new Date());
    if (key === todayKey) {
      div.classList.add("today");
    }

    div.addEventListener("click", () => showDetail(key, div));
    grid.appendChild(div);

    if (key === currentKey) {
      div.classList.add("selected");
      selectedCell = div;
    }
  });
}

/* ---------- 네비 ---------- */
prevBtn.addEventListener("click", () => {
  if (viewMonth === 0) {
    viewMonth = 11;
    viewYear--;
  } else viewMonth--;
  render();
});
nextBtn.addEventListener("click", () => {
  if (viewMonth === 11) {
    viewMonth = 0;
    viewYear++;
  } else viewMonth++;
  render();
});

render();

/* ---------- Enter 키로 추가 ---------- */
[newItemInput, newAmountInput].forEach((input) => {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addExpenseBtn.click();
    }
  });
});
