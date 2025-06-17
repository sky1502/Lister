import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDy2O1ZyumZciixQLWbAk_QQEpn-8Udqbs",
  authDomain: "lister-31e56.firebaseapp.com",
  projectId: "lister-31e56",
  storageBucket: "lister-31e56.firebasestorage.app",
  messagingSenderId: "939337269120",
  appId: "1:939337269120:web:0a348dfed55cb7a0e58b65",
  measurementId: "G-FM812CQRS6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const analytics = getAnalytics(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, signInWithPopup, signOut };
