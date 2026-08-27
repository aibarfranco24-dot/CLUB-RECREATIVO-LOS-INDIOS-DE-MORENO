import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey:"AIzaSyBooXNSoi1clqjgIkkSovXQZ55icMbbXBc" ,
    authDomain: "club-los-indios-308cf.firebaseapp.com",
    projectId: "club-los-indios-308cf",
    storageBucket: "club-los-indios-308cf.firebasestorage.app",
    messagingSenderId: "364857138073",
    appId: "1:364857138073:web:f45eaa3c18638abe7d1108",
    measurementId: "G-Y30GF8TFFD"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
