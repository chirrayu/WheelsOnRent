import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    MONGO_URI = os.environ.get("MONGO_URI")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    ENV = os.environ.get("FLASK_ENV", "development")
    
    # Email Service
    RESEND_APIKEY = os.environ.get("RESEND_APIKEY")
    
    # Storage Management (S3)
    S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")

    # AWS SNS Configuration
    AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
    AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
    REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")

    @staticmethod
    def validate():
        if not Config.SECRET_KEY:
            raise Exception("SECRET_KEY not set. JWT signing will fail without a secure secret key.")
        if not Config.MONGO_URI:
            raise Exception("MONGO_URI not set")
        if not Config.RESEND_APIKEY:
            print("WARNING: RESEND_APIKEY not set. Email services will fail.")
        if not Config.S3_BUCKET_NAME:
             print("WARNING: S3_BUCKET_NAME configuration missing. Image uploads will fail.")

# Validate configuration on import
# Backwards compatibility exports
SECRET_KEY = Config.SECRET_KEY
MONGO_URI = Config.MONGO_URI
FRONTEND_URL = Config.FRONTEND_URL
RESEND_APIKEY = Config.RESEND_APIKEY
S3_BUCKET_NAME = Config.S3_BUCKET_NAME
ENV = Config.ENV

# AWS SNS Configuration exports
AWS_ACCESS_KEY_ID = Config.AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY = Config.AWS_SECRET_ACCESS_KEY
AWS_REGION = Config.AWS_REGION
