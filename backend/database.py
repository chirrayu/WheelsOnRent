from pymongo import MongoClient
from config import Config

# Create Mongo client using centralized config
client = MongoClient(Config.MONGO_URI)

# Select database
db = client.get_database("WheelsOnRent")

def get_db():
    return db
