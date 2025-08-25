# Krok 1 — Podłączenie do Supabase (staging)

1) Wejdź do swojego projektu Supabase → **SQL editor** → **New query**.
2) Wklej treść z pliku: `supabase/schema_step1_healthcheck.sql` i **Run**.
3) Uruchom aplikację:
   ```bash
   npm install
   npm run dev
   ```
4) W nagłówku zobaczysz status:
   - **Chmura: OK** — wszystko podpięte,
   - **Chmura: połączono (wymaga inicjalizacji)** — projekt działa, ale nie ma jeszcze tabel (uruchom SQL z pkt 2),
   - **Chmura: offline** — brak połączenia (sprawdź internet/klucz/URL).

Dane dostępowe do Supabase masz już wpisane w `.env` (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).
