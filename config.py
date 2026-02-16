import os

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    if not SECRET_KEY:
        raise Exception("SECRET_KEY not set")

    MONGO_URI = os.environ.get("MONGO_URI")
    if not MONGO_URI:
        raise Exception("MONGO_URI not set")

    RESEND_APIKEY = os.environ.get("RESEND_APIKEY")
    if not RESEND_APIKEY:
        raise Exception("RESEND_APIKEY not set")

    IMAGEKIT_PUBLIC_KEY = os.environ.get("IMAGEKIT_PUBLIC_KEY")
    IMAGEKIT_PRIVATE_KEY = os.environ.get("IMAGEKIT_PRIVATE_KEY")
    IMAGEKIT_URL_ENDPOINT = os.environ.get("IMAGEKIT_URL_ENDPOINT")

    if not all([
        IMAGEKIT_PUBLIC_KEY,
        IMAGEKIT_PRIVATE_KEY,
        IMAGEKIT_URL_ENDPOINT
    ]):
        raise Exception("ImageKit config missing")
