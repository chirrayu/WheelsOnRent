🛵 Scooter & Bike Booking Web Application
A web-based platform designed to simplify scooter and bike bookings for students in Bidholi and Kandoli, replacing the inefficient call-based booking system with a centralized digital solution.

📌 Problem Statement
Students from Bidholi and Kandoli frequently book scooters or bikes to travel to the city. Currently, bookings are handled through phone calls, which leads to:
💠Miscommunication
💠Double bookings
💠Poor record management
💠Difficulty in tracking vehicle availability
💠Vendors face challenges managing bookings manually, especially during peak hours.

🎯 Objective
To build a web-based booking system that allows students to book vehicles online and enables vendors/admins to manage vehicle availability efficiently.

✨ Features
👨‍🎓 Student Panel
💠Select location (Bidholi / Kandoli)
💠Choose vehicle pickup point
💠Book scooter or bike online
💠Fill a digital NOC (No Objection Certificate) form
💠Upload valid Driving License
💠Receive booking confirmation

🛠️ Admin Panel
💠Add and manage vehicles
💠Update vehicle availability
💠View all bookings
💠Track which student has booked which vehicle
💠Change vehicle status (Available / Booked / Under Maintenance)

🧠 How It Works
💠Student selects location and pickup point
💠Student books a vehicle and fills the NOC form
💠Driving License is uploaded for verification
💠Booking is stored in the database
💠Admin reviews bookings and manages availability

🏗️ Tech Stack
💠Frontend: CSS, JavaScript (using figma)
💠Backend: Python
💠Database: MongoDB 

Authentication: JWT / Session-based

📂 Project Structure (Example)
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
