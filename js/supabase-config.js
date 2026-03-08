// Supabase connection settings
window.SUPABASE_URL = 'https://nnkzvezmonvvvtbzjfun.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ua3p2ZXptb252dnZ0YnpqZnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0OTg0ODUsImV4cCI6MjA4ODA3NDQ4NX0.yXdE36To1IOrjJg0JsEu5szowTv-Xs3VjOPMpPgzkzQ';

// Create the Supabase client
window.supabaseClient = (typeof window.supabase !== 'undefined')
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

if (!window.supabaseClient) {
    // We avoid alert() because it blocks page execution — show a soft banner instead
    console.error('[NavigiFood] Supabase library not loaded. Check internet connection or adblocker.');
    document.addEventListener('DOMContentLoaded', () => {
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#e74c3c;color:#fff;text-align:center;padding:10px 20px;font-size:0.9rem;';
        banner.innerHTML = '⚠️ Could not connect to the server. Please check your internet connection or disable your adblocker. <button onclick="this.parentElement.remove()" style="background:none;border:1px solid #fff;color:#fff;padding:2px 8px;margin-right:10px;border-radius:4px;cursor:pointer;">✕</button>';
        document.body.prepend(banner);
    });
}
