import boto3
import os
from dotenv import load_dotenv

def list_buckets():
    load_dotenv()
    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    region = os.environ.get("AWS_REGION", "ap-south-1")
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )
    
    try:
        response = s3.list_buckets()
        print("--- Available S3 Buckets ---")
        for bucket in response['Buckets']:
            print(f"- {bucket['Name']}")
    except Exception as e:
        print(f"❌ Error listing buckets: {str(e)}")

if __name__ == "__main__":
    list_buckets()
