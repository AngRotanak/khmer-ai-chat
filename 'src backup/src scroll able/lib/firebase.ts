// File: src/lib/firebase.ts
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyCf74kd-SHJ673M4BET05eejjxHk_z_0es",
  authDomain: "facebook-manager-5a03a.firebaseapp.com",
  databaseURL: "https://facebook-manager-5a03a-default-rtdb.firebaseio.com",
  projectId: "facebook-manager-5a03a",
  storageBucket: "facebook-manager-5a03a.firebasestorage.app",
  messagingSenderId: "713754249880",
  appId: "1:713754249880:web:d89bac012eab04f9861eed",
  measurementId: "G-2PNJ5M5Z1D"
};

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { app, db }
