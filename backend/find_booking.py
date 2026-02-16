from database import get_db
db = get_db()
booking = db.bookings.find_one({})
if booking:
    print(f"BOOKING_ID: {booking['_id']}")
else:
    print("NO_BOOKING_FOUND")
