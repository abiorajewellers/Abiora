// ABIORA FIREBASE CONFIGURATION

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";


const firebaseConfig = {

    apiKey: "AIzaSyBvJMAQnpRIyXfyODLcFQYcidxCLTM2I8Y",

    authDomain: "abiora.firebaseapp.com",

    projectId: "abiora",

    storageBucket: "abiora.firebasestorage.app",

    messagingSenderId: "858122060158",

    appId: "1:858122060158:web:52fafadb6f225a3207332f"

};


const app =
initializeApp(firebaseConfig);


const auth =
getAuth(app);


const db =
getFirestore(app);


const storage =
getStorage(app);


export {
    app,
    auth,
    db,
    storage,
    firebaseConfig
};