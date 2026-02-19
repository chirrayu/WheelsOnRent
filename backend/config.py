import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "your-fallback-secret-key")
    MONGO_URI = os.environ.get("MONGO_URI")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    
    # Email Service
    RESEND_APIKEY = os.environ.get("RESEND_APIKEY")
    
    # Image Management
    IMAGEKIT_PUBLIC_KEY = os.environ.get("IMAGEKIT_PUBLIC_KEY")
    IMAGEKIT_PRIVATE_KEY = os.environ.get("IMAGEKIT_PRIVATE_KEY")
    IMAGEKIT_URL_ENDPOINT = os.environ.get("IMAGEKIT_URL_ENDPOINT")

    @staticmethod
    def validate():
        if not Config.MONGO_URI:
            raise Exception("MONGO_URI not set")
        if not Config.RESEND_APIKEY:
            print("WARNING: RESEND_APIKEY not set. Email services will fail.")
        if not all([Config.IMAGEKIT_PUBLIC_KEY, Config.IMAGEKIT_PRIVATE_KEY, Config.IMAGEKIT_URL_ENDPOINT]):
             print("WARNING: ImageKit configuration missing. Image uploads will fail.")

# Validate configuration on import
# Backwards compatibility exports
SECRET_KEY = Config.SECRET_KEY
MONGO_URI = Config.MONGO_URI
FRONTEND_URL = Config.FRONTEND_URL
RESEND_APIKEY = Config.RESEND_APIKEY
IMAGEKIT_PUBLIC_KEY = Config.IMAGEKIT_PUBLIC_KEY
IMAGEKIT_PRIVATE_KEY = Config.IMAGEKIT_PRIVATE_KEY
IMAGEKIT_URL_ENDPOINT = Config.IMAGEKIT_URL_ENDPOINT
