import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL  = "https://awlebphylpznwhboydqc.supabase.co";
const SUPABASE_ANON = "GANTI_DENGAN_SUPABASE_ANON_KEY"; // anon key dari Supabase Dashboard → API

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
