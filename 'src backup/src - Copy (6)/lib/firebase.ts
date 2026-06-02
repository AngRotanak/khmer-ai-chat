import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged  } from 'firebase/auth'
import { getStorage } from 'firebase/storage'
// import { getFirestore } from 'firebase/firestore' // ✅ Add this
import { getDatabase } from 'firebase/database' // ✅ Add this
import { getFirestore } from 'firebase/firestore' // ✅ Firestore

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
const db = getDatabase(app) // ✅ Use Realtime Database
const db_firestore = getFirestore(app) // ✅ Use Firestore
const auth = getAuth(app)
const storage = getStorage(app)


onAuthStateChanged(auth, user => {
  if (user) {
    console.log('✅ Signed in as', user.uid)
  } else {
    console.log('❌ Not signed in')
  }
})

export { app, db, storage, auth, db_firestore }

setPersistence(auth, browserLocalPersistence)





