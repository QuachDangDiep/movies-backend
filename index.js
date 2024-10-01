// backend/server.js  
require('dotenv').config();  
const express = require('express');  
const http = require('http');  
const socketIo = require('socket.io');  
const cors = require('cors');  
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

const app = express();  
const server = http.createServer(app);  
const io = socketIo(server);  

app.use(cors());  
app.use(express.json());  
app.use(express.static('../frontend')); // Đường dẫn tới thư mục frontend  

const PORT = process.env.PORT || 3000;  

// Lấy vé từ Firestore  
app.get('/api/tickets', async (req, res) => {  
    try {  
        const snapshot = await db.collection('tickets').get();  
        let tickets = [];  
        snapshot.forEach(doc => {  
            tickets.push({ id: doc.id, ...doc.data() });  
        });  
        res.json(tickets);  
    } catch (error) {  
        res.status(500).json({ error: "Error fetching tickets", details: error.message });  
    }  
});  

// Đặt vé  
app.post('/api/tickets/book', async (req, res) => {  
    const { ticketId } = req.body;  
    const ticketRef = db.collection('tickets').doc(ticketId);  
    const ticket = await ticketRef.get();  

    if (ticket.exists && ticket.data().status === 'available') {  
        await ticketRef.update({  
            status: 'locked',  
            lockedUntil: admin.firestore.Timestamp.now(),  
        });  
        const updatedTicket = { id: ticketId, ...ticket.data(), status: 'locked' };  
        io.emit('ticketUpdated', updatedTicket);  
        res.json({ success: true, ticket: updatedTicket });  
    } else {  
        res.status(400).json({ success: false, message: 'Ticket not available' });  
    }  
});  

// Cập nhật trạng thái vé sau 10 phút  
setInterval(async () => {  
    const snapshot = await db.collection('tickets').get();  
    snapshot.forEach(async (doc) => {  
        const ticketData = doc.data();  
        const lockedUntil = ticketData.lockedUntil?.toDate();  

        if (ticketData.status === 'locked' && Date.now() > lockedUntil?.getTime()) {  
            await db.collection('tickets').doc(doc.id).update({ status: 'available' });  
            io.emit('ticketUpdated', { id: doc.id, ...ticketData, status: 'available' });  
        }  
    });  
}, 60000); // Kiểm tra mỗi phút  

io.on('connection', (socket) => {  
    console.log('New client connected');  
    socket.on('disconnect', () => {  
        console.log('Client disconnected');  
    });  
});  

server.listen(PORT, () => {  
    console.log(`Server is running on port ${PORT}`);  
});  

module.exports = db;