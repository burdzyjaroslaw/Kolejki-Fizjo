# Deploy „Kolejki Fizjo” jako aplikacja web (Vercel)

## Najprościej (bez budowania na swoim komputerze)
1. Wejdź na https://github.com → „New repository” → nazwij np. `kolejki-fizjo-staging` (może być Private).
2. W repozytorium kliknij „Upload files” i **wrzuć zawartość tego ZIP-a** (nie cały ZIP).
3. Wejdź na https://vercel.com → „New Project” → „Import Git Repository” → wybierz to repo.
4. W kreatorze Vercel:
   - Framework: **Other** (Vite) – Vercel sam wykryje.
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**: dodaj dwie zmienne:
     - `VITE_SUPABASE_URL` = `https://pwlpqftcjjetrcldxpqt.supabase.co`
     - `VITE_SUPABASE_ANON_KEY` = (wartość z Twojego Supabase – to publiczny klucz anon)  
       *(możesz skopiować z `.env.example`)*
5. Kliknij **Deploy**. Vercel sam zainstaluje paczki i zbuduje aplikację w chmurze.
6. Po deployu dostaniesz adres URL (np. `https://kolejki-fizjo-staging.vercel.app`). Otwórz stronę – w nagłówku zobaczysz status „Chmura: OK / sprawdzam…”.

## Inicjalizacja bazy (jednorazowo w Supabase)
- Wejdź do **Supabase → SQL editor** i uruchom plik `supabase/schema_step1_healthcheck.sql` (znajdziesz go w repo).
- Po uruchomieniu odśwież stronę – status powinien być **Chmura: OK**.

## Ważne
- **Nie commituj** pliku `.env` – używamy `.env.example`. Prawdziwe wartości wpisujesz w panelu Vercel (Project → Settings → Environment Variables).
- Po przejściu testów w staging, zrobimy analogiczny projekt **production** (drugi projekt w Vercel + drugi projekt w Supabase).

## Aktualizacje aplikacji
- Wrzucasz zmiany do repo (GitHub) → Vercel automatycznie robi nowy deploy.
- W razie problemów: w Vercel można wybrać „Promote previous deployment” (rollback).

Powodzenia! Jeśli utkniesz na którymś ekranie Vercel/GitHub, zrób screen – powiem dokładnie co kliknąć.
