const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000", // Địa chỉ frontend của bạn
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    projectId: process.env.FIREBASE_PROJECT_ID,
  }),
});

const db = admin.firestore();
const collection = db.collection("movies"); // Đổi thành "bookings" nếu đó là tên bộ sưu tập bạn đang dùng

// 1. Tạo đặt vé mới: POST
app.post("/bookings", async (req, res) => {
  try {
    const { movieName, userName, seatNumber, showTime } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!movieName || !userName || !seatNumber || !showTime) {
      return res.status(400).send("All fields are required");
    }

    const booking = { movieName, userName, seatNumber, showTime };
    const docRef = await collection.add(booking);
    res
      .status(201)
      .send({ id: docRef.id, message: "Booking created successfully" });
  } catch (error) {
    console.error("Error creating booking:", error); // Log lỗi
    res.status(500).send("Error creating booking: " + error.message);
  }
});

// 2. Đọc tất cả đặt vé: GET
app.get("/bookings", async (req, res) => {
  try {
    const snapshot = await collection.get();
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Fetched bookings:", bookings); // Log dữ liệu đã lấy
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error); // Log lỗi
    res
      .status(500)
      .json({ error: "Error fetching bookings", details: error.message });
  }
});

// 3. Đọc đặt vé theo ID: GET/id
app.get("/bookings/:id", async (req, res) => {
  try {
    const doc = await collection.doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).send("Booking not found");
    }
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Error fetching booking:", error); // Log lỗi
    res.status(500).send("Error fetching booking: " + error.message);
  }
});

// 4. Cập nhật đặt vé theo ID: PUT/id
app.put("/bookings/:id", async (req, res) => {
  try {
    const { movieName, userName, seatNumber, showTime } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!movieName && !userName && !seatNumber && !showTime) {
      return res.status(400).send("At least one field is required for update");
    }

    const updatedBooking = { movieName, userName, seatNumber, showTime };
await collection.doc(req.params.id).update(updatedBooking);
    res.status(200).send("Booking updated successfully");
  } catch (error) {
    console.error("Error updating booking:", error); // Log lỗi
    res.status(500).send("Error updating booking: " + error.message);
  }
});

// 5. Xóa đặt vé theo ID: DELETE/id
app.delete("/bookings/:id", async (req, res) => {
  try {
    const bookingDoc = await collection.doc(req.params.id).get();
    if (!bookingDoc.exists) {
      return res.status(404).send("Booking not found");
    }
    await collection.doc(req.params.id).delete();
    res.status(200).send("Booking deleted successfully");
  } catch (error) {
    console.error("Error deleting booking:", error); // Log lỗi
    res.status(500).send("Error deleting booking: " + error.message);
  }
});

// 6. Tính tổng số vé đã đặt: GET /bookings/total
app.get("/bookings/total", async (req, res) => {
  try {
    const snapshot = await collection.get();
    const totalBookings = snapshot.size;
    res.status(200).json({ totalBookings });
  } catch (error) {
    console.error("Error fetching total bookings:", error); // Log lỗi
    res.status(500).send("Error fetching total bookings: " + error.message);
  }
});

// 7. Đọc đặt vé theo tên phim: GET /bookings/movie/:movieName
app.get("/bookings/movie/:movieName", async (req, res) => {
  try {
    const movieName = req.params.movieName;
    const snapshot = await collection.where("movieName", "==", movieName).get();

    if (snapshot.empty) {
      return res.status(404).send("No bookings found for this movie");
    }

    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Fetched bookings for movie:", movieName, bookings); // Log dữ liệu đã lấy
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error); // Log lỗi
    res.status(500).send("Error fetching bookings: " + error.message);
  }
});

// 8. Hủy đặt vé theo ID: DELETE /bookings/cancel/:id
app.delete("/bookings/cancel/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const bookingDoc = await collection.doc(bookingId).get();

    if (!bookingDoc.exists) {
      return res.status(404).send("Booking not found");
    }

    await collection.doc(bookingId).delete();
    res.status(200).send("Booking canceled successfully");
  } catch (error) {
    console.error("Error canceling booking:", error); // Log lỗi
    res.status(500).send("Error canceling booking: " + error.message);
  }
});

// Chạy server với port online hoặc 5000 local
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});