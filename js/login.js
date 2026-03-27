// supabase 기반 인증 전용 auth.js
// 전제: 전역 _supabase( createClient(...) )가 이미 존재한다.

(function () {
  const overlay = document.getElementById("authOverlay");
  const emailEl = document.getElementById("authEmail");
  const pwEl = document.getElementById("authPassword");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const authMsg = document.getElementById("authMsg");

  function showOverlay(msg) {
    if (overlay) {
      overlay.style.display = "flex";
      if (msg) authMsg.textContent = msg;
    }
  }

  function hideOverlay() {
    if (overlay) {
      overlay.style.display = "none";
      authMsg.textContent = "";
    }
  }

  function setMsg(m) {
    if (authMsg) authMsg.textContent = m || "";
  }

  async function signIn(email, password) {
    setMsg("로그인 중...");
    const { data, error } = await _supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data?.user ?? null;
  }

  async function signUp(email, password) {
    setMsg("가입 중...");
    const { data, error } = await _supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async function logout() {
    try {
      await _supabase.auth.signOut();
    } catch (e) {
      console.warn("signOut error", e);
    }
  }

  window.appLogout = logout;

  async function initAuth() {
    try {
      const { data } = await _supabase.auth.getUser();
      const user = data?.user ?? null;
      if (user) {
        hideOverlay();
        return;
      }
    } catch (e) {
      console.warn("getUser failed", e);
    }
    showOverlay();
  }

  async function syncLocalExpenses(user) {
    const raw = localStorage.getItem("expenses");
    if (!raw) return;

    let localExpenses;
    try {
      localExpenses = JSON.parse(raw);
    } catch (e) {
      console.error("expenses parse error", e);
      return;
    }

    if (!localExpenses || typeof localExpenses !== "object") return;

    const rows = [];

    Object.keys(localExpenses).forEach((dateKey) => {
      const items = localExpenses[dateKey];
      if (!Array.isArray(items)) return;

      items.forEach((row) => {
        const itemName = (row.item || "").trim();
        const amount = parseInt(row.amount, 10);

        if (!itemName) return;
        if (isNaN(amount) || amount <= 0) return;

        rows.push({
          uid: user.id,
          dataName: itemName,
          price: amount,
          cateIdx: null,
          workday: dateKey + "T12:00:00+09:00",
        });
      });
    });

    if (!rows.length) return;

    const { error } = await _supabase.from("expenses").insert(rows);
    if (error) throw error;

    localStorage.removeItem("expenses");
  }

  if (_supabase?.auth?.onAuthStateChange) {
    _supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        hideOverlay();
      } else if (event === "SIGNED_OUT") {
        showOverlay();
      }
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      setMsg("");

      const email = (emailEl?.value || "").trim();
      const pw = (pwEl?.value || "").trim();

      if (!email || !pw) {
        setMsg("이메일과 비밀번호를 입력하세요.");
        return;
      }

      try {
        const user = await signIn(email, pw);
        await syncLocalExpenses(user);
        hideOverlay();
        setMsg("");
      } catch (err) {
        console.error(err);
        setMsg(err?.message || "로그인 실패");
      }
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      setMsg("");

      const email = (emailEl?.value || "").trim();
      const pw = (pwEl?.value || "").trim();

      if (!email || !pw) {
        setMsg("이메일과 비밀번호를 입력하세요.");
        return;
      }

      try {
        const res = await signUp(email, pw);
        if (res?.user) {
          setMsg("가입 및 로그인 완료");
        } else {
          setMsg("가입 완료. 이메일 확인 후 로그인 해주세요.");
        }
      } catch (err) {
        console.error(err);
        setMsg(err?.message || "회원가입 실패");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initAuth);
})();
