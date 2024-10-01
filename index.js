// backend/server.js  
const express = require("express");  
const admin = require("firebase-admin");  
const cors = require("cors");  
const http = require("http");  
const socketIo = require("socket.io");  
require("dotenv").config();  

// Khởi tạo Firebase  
const serviceAccount = {  
  projectId: process.env.FIREBASE_PROJECT_ID,  
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),  
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,  
};  

admin.initializeApp({  
  credential: admin.credential.cert(serviceAccount),  
  databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,  
});  

const db = admin.firestore();  
const app = express();  
app.use(express.json());  
app.use(  
  cors({  
    origin: "http://localhost:3000",  
    methods: ["GET", "POST", "PUT", "DELETE"],  
    allowedHeaders: ["Content-Type", "Authorization"],  
  })  
);  

const server = http.createServer(app);  
const io = socketIo(server);  
const collection = db.collection("trees"); // Collection trees trong Firestore  

// 1. Tạo cây mới: POST  
app.post("/trees", async (req, res) => {  
  try {  
    const { name, description, img } = req.body;  
    const tree = { name, description, img };  
    const docRef = await collection.add(tree);  
    res.status(201).send({ id: docRef.id, message: "Tree created successfully" });  
  } catch (error) {  
    res.status(500).send("Error creating tree: " + error.message);  
  }  
});  

// 2. Lấy tất cả cây: GET  
app.get("/trees", async (req, res) => {  
  try {  
    const snapshot = await collection.get();  
    const trees = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));  
    res.status(200).json(trees);  
  } catch (error) {  
    res.status(500).json({ error: "Error fetching trees", details: error.message });  
  }  
});  

// 3. Lấy một cây theo ID: GET/id  
app.get("/trees/:id", async (req, res) => {  
  try {  
    const doc = await collection.doc(req.params.id).get();  
    if (!doc.exists) {  
      return res.status(404).send("Tree not found");  
    }  
    res.status(200).json({ id: doc.id, ...doc.data() });  
  } catch (error) {  
    res.status(500).send("Error fetching tree: " + error.message);  
  }  
});  

// 4. Cập nhật một cây theo ID: PUT/id  
app.put("/trees/:id", async (req, res) => {  
  try {  
    const { name, description, img } = req.body;  
    const updatedTree = { name, description, img };  
    await collection.doc(req.params.id).update(updatedTree);  
    io.emit("treeUpdated", { id: req.params.id, ...updatedTree });  
    res.status(200).send("Tree updated successfully");  
  } catch (error) {  
    res.status(500).send("Error updating tree: " + error.message);  
  }  
});  

// 5. Xóa một cây theo ID: DELETE/id  
app.delete("/trees/:id", async (req, res) => {  
  try {  
    await collection.doc(req.params.id).delete();  
    res.status(200).send("Tree deleted successfully");  
  } catch (error) {  
    res.status(500).send("Error deleting tree: " + error.message);  
  }  
});  

// Chạy server với port online hoặc 5000 local  
const PORT = process.env.PORT || 5000;  
server.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});