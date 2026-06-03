import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDM8hPnYZ_jq1dpXFtZe7V3QnwcrtzkMjg",
  authDomain: "inamidashboard.firebaseapp.com",
  projectId: "inamidashboard",
  storageBucket: "inamidashboard.firebasestorage.app",
  messagingSenderId: "670763598335",
  appId: "1:670763598335:web:b31d8ef132bb4bd1bba7ca",
  measurementId: "G-37JTSH7Q8X"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export {
  auth,
  db,
  storage,
  collection,
  addDoc,
  serverTimestamp,
  ref,
  uploadBytes,
  getDownloadURL,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy
};