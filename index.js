const express = require("express");  
const admin = require("firebase-admin");  
const cors = require("cors");  
require("dotenv").config();  

const app = express();  
app.use(express.json());  
app.use(  
  cors({  
    origin: "http://localhost:3000", // Thay đổi nếu cần  
    methods: ["GET", "POST", "PUT", "DELETE"],  
    allowedHeaders: ["Content-Type", "Authorization"],  
  })  
);  

// Khởi tạo Firebase SDK  
admin.initializeApp({  
  credential: admin.credential.cert({  
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),  
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,  
    projectId: process.env.FIREBASE_PROJECT_ID,  
  }),  
});  

const db = admin.firestore();  
const collection = db.collection("Tickets"); // Thay đổi tên collection cho vé  

// 1. Tạo vé mới: POST  
app.post("/tickets", async (req, res) => {  
  try {  
    const { event, price, quantity } = req.body; // Dữ liệu vé nhận từ request body  
    const ticket = { event, price, quantity };  
    const docRef = await collection.add(ticket);  
    res  
      .status(201)  
      .send({ id: docRef.id, message: "Ticket created successfully" });  
  } catch (error) {  
    res.status(500).send("Error creating ticket: " + error.message);  
  }  
});  

// 2. Lấy danh sách tất cả vé: GET  
app.get("/tickets", async (req, res) => {  
  try {  
    const snapshot = await collection.get();  
    const tickets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));  
    res.status(200).json(tickets);  
  } catch (error) {  
    res.status(500).json({ error: "Error fetching tickets", details: error.message });  
  }  
});  

// 3. Lấy vé theo ID: GET/id  
app.get("/tickets/:id", async (req, res) => {  
  try {  
    const doc = await collection.doc(req.params.id).get();  
    if (!doc.exists) {  
      return res.status(404).send("Ticket not found");  
    }  
    res.status(200).json({ id: doc.id, ...doc.data() });  
  } catch (error) {  
    res.status(500).send("Error fetching ticket: " + error.message);  
  }  
});  

// 4. Cập nhật vé theo ID: PUT/id  
app.put("/tickets/:id", async (req, res) => {  
  try {  
    const { event, price, quantity } = req.body; // Các trường mới hoặc cập nhật  
    const updatedTicket = { event, price, quantity };  
    await collection.doc(req.params.id).update(updatedTicket);  
    res.status(200).send("Ticket updated successfully");  
  } catch (error) {  
    res.status(500).send("Error updating ticket: " + error.message);  
  }  
});  

// 5. Xóa vé theo ID: DELETE/id  
app.delete("/tickets/:id", async (req, res) => {  
  try {  
    await collection.doc(req.params.id).delete();  
    res.status(200).send("Ticket deleted successfully");  
  } catch (error) {  
    res.status(500).send("Error deleting ticket: " + error.message);  
  }  
});  

// Chạy server  
const PORT = process.env.PORT || 5000;  
app.listen(PORT, () => {  
  console.log(`Server is running on port ${PORT}`);  
});