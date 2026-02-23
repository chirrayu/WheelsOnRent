import boto3
import os
import time
from dotenv import load_dotenv

def fix_s3_bucket():
    load_dotenv()
    
    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    region = os.environ.get("AWS_REGION", "ap-south-1")
    bucket_base = "wheelsonrent-docs"
    
    if not access_key or "YOUR_AWS" in access_key:
        print("❌ Error: Valid AWS credentials not found in .env")
        return

    s3 = boto3.client(
        's3',
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region
    )
    
    # Try different bucket names until one works
    suffixes = ["", str(int(time.time()))[-6:] , "media", "storage"]
    
    for suffix in suffixes:
        bucket_name = f"{bucket_base}-{suffix}" if suffix else bucket_base
        print(f"Checking bucket: {bucket_name}...")
        
        try:
            s3.head_bucket(Bucket=bucket_name)
            print(f"✅ Bucket '{bucket_name}' already exists and is accessible!")
            update_env(bucket_name)
            return
        except Exception as e:
            error_code = e.response.get('Error', {}).get('Code')
            if error_code == '404':
                print(f"Bucket '{bucket_name}' does not exist. Attempting to create...")
                try:
                    if region == 'us-east-1':
                        s3.create_bucket(Bucket=bucket_name)
                    else:
                        s3.create_bucket(
                            Bucket=bucket_name,
                            CreateBucketConfiguration={'LocationConstraint': region}
                        )
                    print(f"✅ Successfully created and configured bucket: {bucket_name}")
                    update_env(bucket_name)
                    return
                except Exception as create_e:
                    print(f"❌ Could not create '{bucket_name}': {str(create_e)}")
            elif error_code == '403':
                 print(f"❌ Access Denied for '{bucket_name}' (Someone else likely owns it).")
            else:
                print(f"❌ Error checking '{bucket_name}': {str(e)}")

def update_env(new_bucket):
    env_path = ".env"
    with open(env_path, 'r') as f:
        lines = f.readlines()
    
    with open(env_path, 'w') as f:
        found = False
        for line in lines:
            if line.startswith("S3_BUCKET_NAME="):
                f.write(f"S3_BUCKET_NAME={new_bucket}\n")
                found = True
            else:
                f.write(line)
        if not found:
            f.write(f"S3_BUCKET_NAME={new_bucket}\n")
    print(f"🚀 Updated .env with S3_BUCKET_NAME={new_bucket}")

if __name__ == "__main__":
    fix_s3_bucket()
