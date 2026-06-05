// Firebase telah digantikan oleh Supabase.
// File ini hanya meneruskan export agar tidak ada import error pada file lain.
export { supabase as auth, supabase as db, supabase as storage } from "./supabase-config.js";

// Stub fungsi Firestore yang tidak lagi digunakan
export const collection  = () => null;
export const addDoc      = async () => ({ id: null });
export const serverTimestamp = () => new Date().toISOString();
export const ref         = () => null;
export const uploadBytes = async () => null;
export const getDownloadURL = async () => "";
export const doc         = () => null;
export const getDoc      = async () => ({ exists: () => false, data: () => ({}) });
export const getDocs     = async () => ({ empty: true, forEach: () => {} });
export const query       = () => null;
export const orderBy     = () => null;
