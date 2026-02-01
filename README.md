# 🛵 Scooter & Bike Booking Web Application

A web-based platform designed to simplify scooter and bike bookings for students in **Bidholi and Kandoli**, replacing the inefficient call-based booking system with a centralized digital solution.

---

## 📌 Problem Statement

Students from Bidholi and Kandoli frequently book scooters or bikes to travel to the city. Currently, bookings are handled through phone calls, which leads to:

- Miscommunication  
- Double bookings  
- Poor record management  
- Difficulty in tracking vehicle availability  

Vendors also face challenges managing bookings manually, especially during peak hours.

---

## 🎯 Objective

To build a **web-based booking system** that allows students to book vehicles online while enabling vendors/admins to efficiently manage vehicle availability and bookings.

---

## ✨ Features

### 👨‍🎓 Student Panel
- Select location (Bidholi / Kandoli)  
- Choose vehicle pickup point  
- Book scooter or bike online  
- Fill a digital **NOC (No Objection Certificate)** form  
- Upload a valid **Driving License**  
- Receive booking confirmation  

### 🛠️ Admin Panel
- Add and manage vehicles  
- Update vehicle availability  
- View all bookings  
- Track which student has booked which vehicle  
- Change vehicle status (Available / Booked / Under Maintenance)  

---

## 🧠 How It Works

1. Student selects location and pickup point  
2. Student books a vehicle and fills the NOC form  
3. Driving License is uploaded for verification  
4. Booking data is stored in the database  
5. Admin reviews bookings and manages vehicle availability  

---

## 🏗️ Tech Stack

- **Frontend:** HTML, CSS, JavaScript  
  *(UI/UX designed using Figma)*  
- **Backend:** Python  
- **Database:** MongoDB  
- **Authentication:** JWT / Session-based  

---

## 📂 Project Structure (Example)

```
/frontend
  ├── index.html
  ├── booking.html
  └── styles.css

/backend
  ├── app.py
  ├── routes/
  ├── models/
  └── config/

README.md
```

---

## 📄 License

This project is created for academic and learning purposes.
