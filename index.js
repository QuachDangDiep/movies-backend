const express = require('express');  
const bodyParser = require('body-parser');  
const morgan = require('morgan');  
const admin = require('firebase-admin');  

// Khởi tạo Firebase Admin SDK  
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Đường dẫn tới tệp JSON  
admin.initializeApp({  
    credential: admin.credential.cert(serviceAccount),  
    databaseURL: 'https://Movie-ticket-sales.firebaseio.com' // Thay thế bằng URL của database của bạn  
});  

const app = express();  
const PORT = process.env.PORT || 3000;  

// Middleware  
app.use(bodyParser.json());  
app.use(morgan('dev'));  

// Lấy danh sách sự kiện từ Firestore  
app.get('/api/events', async (req, res) => {  
    const eventsRef = admin.firestore().collection('events');  
    const snapshot = await eventsRef.get();  
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));  
    res.json(events);  
});  

// Tạo sự kiện mới  
app.post('/api/events', async (req, res) => {  
    const { name, date, ticketsAvailable } = req.body;  
    const newEvent = { name, date, ticketsAvailable };  

    const eventsRef = admin.firestore().collection('events');  
    const docRef = await eventsRef.add(newEvent);  
    res.status(201).json({ id: docRef.id, ...newEvent });  
});  

// Đặt vé cho sự kiện  
app.post('/api/events/:id/tickets', async (req, res) => {  
    const eventId = req.params.id;  
    const { quantity } = req.body;  

    const eventRef = admin.firestore().collection('events').doc(eventId);  
    const eventDoc = await eventRef.get();  
    if (!eventDoc.exists) {  
        return res.status(404).send('Event not found');  
    }  

    const event = eventDoc.data();  
    if (event.ticketsAvailable < quantity) {  
        return res.status(400).send('Not enough tickets available');  
    }  

    const updatedTicketsAvailable = event.ticketsAvailable - quantity;  
    await eventRef.update({ ticketsAvailable: updatedTicketsAvailable });  

    res.status(200).json({ message: `Successfully booked ${quantity} tickets for ${event.name}` });  
});  

// Xử lý lỗi 404  
app.use((req, res) => {  
    res.status(404).send('404 Not Found');  
});  

// Xử lý lỗi chung  
app.use((err, req, res) => {  
    console.error(err.stack);  
    res.status(500).send('Something went wrong!');  
});  

// Khởi động máy chủ  
app.listen(PORT, () => {  
    console.log(`Server is running on http://localhost:${PORT}`);  
});