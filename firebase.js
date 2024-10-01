// backend/firebase.js  
require('dotenv').config();  
const admin = require('firebase-admin');  

const serviceAccount = {  
    projectId: process.env.FIREBASE_PROJECT_ID,  
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),  
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,  
};  

admin.initializeApp({  
    credential: admin.credential.cert(serviceAccount),  
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`  
});  

const db = admin.firestore();  

module.exports = db;