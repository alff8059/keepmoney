const { createClient } = supabase; // CDN으로 불러온 라이브러리 사용
const _supabase = createClient(
  "https://hgavlarfuneusnloqmpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYXZsYXJmdW5ldXNubG9xbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjcwNjAsImV4cCI6MjA4OTMwMzA2MH0.7Vr3_mNqOwhe8Z0xrXaN6U-KrV_5fZSpgSDFdpyW7so",
);

// 데이터 불러오기
async function getExpenses(uidx) {
  const { data, error } = await _supabase
    .from("expense")
    .select("*")
    .eq("userIdx", uidx);
  console.log(data); // DB에 저장된 가계부 내역이 출력됨!
}
async function getUsers() {
  const { data, error } = await _supabase.from("user").select("*");
  console.log(data);
}

// 회원가입
async function signUp(email, password) {
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
  });

  console.log("signUp data:", data);
  console.log("signUp error:", error);
}

// 지출내역 db인서트
async function insertExpenseToDB({ dataName, price }) {
  // 1) 현재 로그인된 사용자 확인
  const {
    data: { user },
    error: userErr,
  } = await _supabase.auth.getUser();

  if (userErr || !user) {
    throw new Error("로그인이 필요합니다.");
  }

  // 2) 현재 날짜 생성 (YYYY-MM-DD 형식)
  // 한국 시간 기준으로 하고 싶다면 .toLocaleDateString('en-CA') 등을 사용합니다.
  const today = new Date().toISOString().split("T")[0];

  // 3) 실제 DB 삽입
  const { data, error } = await _supabase
    .from("expenses")
    .insert([
      {
        user_id: user.id,
        dataName: dataName,
        price: price,
        workday: today, // 생성한 오늘 날짜 삽입
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("insertExpenseToDB error", error);
    throw error;
  }

  return data;
}
