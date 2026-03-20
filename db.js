const { createClient } = supabase; // CDN으로 불러온 라이브러리 사용
const _supabase = createClient(
  "https://hgavlarfuneusnloqmpr.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhnYXZsYXJmdW5ldXNubG9xbXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MjcwNjAsImV4cCI6MjA4OTMwMzA2MH0.7Vr3_mNqOwhe8Z0xrXaN6U-KrV_5fZSpgSDFdpyW7so",
);

// 예: 데이터 불러오기
async function getExpenses() {
  const { data, error } = await _supabase.from("expenses").select("*");
  console.log(data); // DB에 저장된 가계부 내역이 출력됨!
}
