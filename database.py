import os
from pymongo import MongoClient

# Get Mongo URI from environment variable
MONGO_URI = os.environ.get("MONGO_URI")

if not MONGO_URI:
    raise Exception("MONGO_URI environment variable not set")

# Create Mongo client
client = MongoClient(MONGO_URI)

# Select database
db = client.get_database("WheelsOnRent")

def get_db():
    return db
