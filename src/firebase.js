
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCtv5Y6IcO_keQ-ZxbPIlx0HzSCfnEIc1s",
  authDomain: "expense-tracker-3e596.firebaseapp.com",
  projectId: "expense-tracker-3e596",
  storageBucket: "expense-tracker-3e596.firebasestorage.app",
  messagingSenderId: "616933221447",
  appId: "1:616933221447:web:fc6a9b9e628ef34060bd62"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const databaseURL =
  "https://expense-tracker-3e596-default-rtdb.firebaseio.com";