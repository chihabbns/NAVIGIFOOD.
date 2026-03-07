// إعدادات الاتصال بقاعدة بيانات Supabase
window.SUPABASE_URL = 'https://nnkzvezmonvvvtbzjfun.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ua3p2ZXptb252dnZ0YnpqZnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTg0ODUsImV4cCI6MjA4ODA3NDQ4NX0.yXdE36To1IOrjJg0JsEu5szowTv-Xs3VjOPMpPgzkzQ';

// إنشاء كائن الاتصال (المفتاح السحري للوصول للبيانات)
window.supabaseClient = window.supabase ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY) : null;
if (!window.supabaseClient) {
    console.error("Supabase library not loaded. Check internet connection or adblocker.");
    alert("تأكد من اتصالك بالإنترنت أو قم بتعطيل مانع الإعلانات (Adblocker) لكي يعمل النظام بشكل كامل.");
}
