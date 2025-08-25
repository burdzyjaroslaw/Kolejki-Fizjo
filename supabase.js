import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (url && anon) ? createClient(url, anon, {
  auth: { persistSession: false }
}) : null;

export async function checkSupabase(){
  try{
    if(!supabase) return { ok:false, reason: 'Brak VITE_SUPABASE_URL lub VITE_SUPABASE_ANON_KEY' };
    // próbujemy odpytać tabelę healthcheck (jeszcze może nie istnieć)
    const { data, error, status } = await supabase.from('healthcheck').select('id').limit(1);
    if(error){
      // jeśli tabela nie istnieje -> serwer osiągalny, ale wymaga inicjalizacji
      const msg = String(error.message||'').toLowerCase();
      if (msg.includes('does not exist') || status === 404){
        return { ok:true, needsInit:true };
      }
      return { ok:false, reason: error.message };
    }
    return { ok:true };
  }catch(e){
    return { ok:false, reason: String(e) };
  }
}
