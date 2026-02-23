import boto3
import os
import io
import traceback
from config import Config
from werkzeug.utils import secure_filename
from datetime import datetime


# Local fallback storage is disabled. Enforcing S3-only storage.

def upload_to_s3(file_obj, folder='dl'):
    """
    Uploads a file to S3 and returns the URL.
    Falls back to local storage if S3 is not configured.
    """
    try:
        filename = secure_filename(file_obj.filename) or "unknown_file"
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        saved_name = f"{timestamp}_{filename}"
        
        # Read content into memory once to avoid stream consumption issues
        file_content = file_obj.read()
        content_type = getattr(file_obj, 'content_type', 'image/jpeg')
        
        # Try S3 Upload
        if not (Config.S3_BUCKET_NAME and Config.AWS_ACCESS_KEY_ID and Config.AWS_SECRET_ACCESS_KEY):
            print("❌ S3 error: AWS/S3 credentials not configured.")
            return None

        print(f"DEBUG: Attempting S3 upload to bucket: {Config.S3_BUCKET_NAME}")
        try:
            s3 = boto3.client(
                's3',
                aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
                region_name=Config.AWS_REGION
            )
            
            s3_path = f"{folder}/{saved_name}"
            s3.put_object(
                Bucket=Config.S3_BUCKET_NAME,
                Key=s3_path,
                Body=file_content,
                ContentType=content_type
            )
            
            url = f"https://{Config.S3_BUCKET_NAME}.s3.{Config.AWS_REGION}.amazonaws.com/{s3_path}"
            print(f"✅ Successfully uploaded to S3: {url}")
            return url
        except Exception as s3_err:
            print(f"❌ S3 Upload failed: {str(s3_err)}")
            return None

    except Exception as e:
        print(f"❌ Storage error: {str(e)}")
        print(traceback.format_exc())
        return None
