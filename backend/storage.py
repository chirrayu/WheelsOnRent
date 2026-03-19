import boto3
import os
import io
import uuid
import traceback
import mimetypes
import logging
from config import Config
from werkzeug.utils import secure_filename
from datetime import datetime
from security_logger import log_security_event

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants from user snippet for validation
ALLOWED_EXTENSIONS_DL = {'png', 'jpg', 'jpeg', 'pdf'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes

def is_allowed_file(filename):
    """Check if the file extension is allowed for DL documents."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS_DL

def is_valid_image(file_obj):
    """
    Verifies that the file is a valid image by attempting to open it with PIL.
    This prevents extension spoofing (e.g., virus.exe -> license.jpg).
    """
    try:
        # Save position, read, then seek back
        current_pos = file_obj.tell()
        file_obj.seek(0)
        img = Image.open(file_obj)
        img.verify() # verify() is fast and doesn't load whole image
        file_obj.seek(current_pos)
        return True
    except Exception as e:
        logger.warning(f"Image verification failed: {e}")
        return False

def is_valid_file_size(file_obj):
    """Check if the file size is within the 5MB limit."""
    try:
        # Save position, seek to end to get size, then seek back
        current_pos = file_obj.tell()
        file_obj.seek(0, 2)
        size = file_obj.tell()
        file_obj.seek(current_pos)
        return size <= MAX_FILE_SIZE
    except Exception as e:
        logger.error(f"Size validation error: {e}")
        return False

from botocore.client import Config as S3Config

def get_s3_client():
    """Initializes the S3 client using credentials from Config."""
    if not (Config.S3_BUCKET_NAME and Config.AWS_ACCESS_KEY_ID and Config.AWS_SECRET_ACCESS_KEY):
        logger.error("❌ S3 error: AWS credentials or Bucket Name not configured in .env")
        return None
        
    return boto3.client(
        's3',
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
        region_name=Config.AWS_REGION,
        config=S3Config(s3={'addressing_style': 'path'})
    )

def upload_to_s3(file_obj, folder='dl'):
    """
    Uploads a file object to S3.
    Performs extension and size validation first.
    Returns the public S3 URL if successful, or None if failed.
    """
    try:
        filename = secure_filename(file_obj.filename) or "document"
        
        # 1. Extension Validation
        if not is_allowed_file(filename):
            logger.warning(f"Rejected {filename}: Non-allowed extension.")
            return None
            
        # 2. Size Validation
        if not is_valid_file_size(file_obj):
            logger.warning(f"Rejected {filename}: File size exceeds 5MB limit.")
            return None
            
        # 3. Image Integrity Validation (MIME Check)
        if not filename.lower().endswith('.pdf'):
            if not is_valid_image(file_obj):
                logger.warning(f"Rejected {filename}: Image verification failed (possible malicious file).")
                log_security_event('UPLOAD_INTEGRITY_FAIL', {'filename': filename, 'reason': 'image_magic_fail'}, severity='CRITICAL')
                return None

        # 3. Connection Setup
        s3 = get_s3_client()
        if not s3:
            return None

        # 4. Determine Content Type
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            # Fallback to file object's own content type if provided by browser
            content_type = getattr(file_obj, 'content_type', 'application/octet-stream')

        # 5. Generate unique S3 Key with UUID for privacy
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'jpg'
        s3_key = f"{folder}/{uuid.uuid4()}.{ext}"

        # 6. Stream upload
        logger.info(f"Starting S3 upload for {filename} to {s3_key}")
        s3.upload_fileobj(
            file_obj,
            Config.S3_BUCKET_NAME,
            s3_key,
            ExtraArgs={'ContentType': content_type}
        )

        url = f"https://s3.{Config.AWS_REGION}.amazonaws.com/{Config.S3_BUCKET_NAME}/{s3_key}"
        logger.info(f"✅ S3 Upload Successful: {url}")
        return url

    except Exception as e:
        logger.error(f"❌ S3 Upload error: {str(e)}")
        logger.error(traceback.format_exc())
        return None

def create_presigned_url(url_or_path, expiration=3600):
    """
    Generates a secure, temporary presigned URL for a private S3 object.
    Requires the input to be a valid S3 URL containing 'amazonaws.com'.
    """
    try:
        if not url_or_path or not isinstance(url_or_path, str):
            return url_or_path

        # Case 1: Full S3 URL
        if "amazonaws.com/" in url_or_path:
            # Extract everything after amazonaws.com/
            path = url_or_path.split("amazonaws.com/")[-1]
            # If the path starts with the bucket name, remove it
            bucket_name = Config.S3_BUCKET_NAME
            if path.startswith(f"{bucket_name}/"):
                object_key = path[len(bucket_name)+1:]
            else:
                object_key = path
        # Case 2: Just the key (path)
        elif url_or_path.startswith("dl/"):
            object_key = url_or_path
        else:
            # Not an S3 object we can presign
            return url_or_path

        s3 = get_s3_client()
        if not s3:
            return url_or_path
        
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': Config.S3_BUCKET_NAME,
                'Key': object_key
            },
            ExpiresIn=expiration
        )
        return presigned_url
        
    except Exception as e:
        logger.error(f"❌ S3 Presign error: {str(e)}")
        return url_or_path
# Global EasyOCR Reader (Lazy initialized)
_easyocr_reader = None

def get_easyocr_reader():
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR Reader...")
            _easyocr_reader = easyocr.Reader(['en'], gpu=False) # Default to CPU for reliability
        except Exception as e:
            logger.error(f"Failed to initialize EasyOCR: {e}")
    return _easyocr_reader

from PIL import Image, ImageEnhance

def auto_rotate_image(img):
    """
    Auto-rotates image based on EXIF orientation tag.
    """
    try:
        # 1. Check for EXIF
        exif = img._getexif()
        if not exif:
            return img

        # 2. Get orientation tag (0x0112)
        orientation_key = 274 # Standard key for Orientation
        if orientation_key not in exif:
            return img
            
        orientation = exif[orientation_key]

        # 3. Rotate accordingly
        if orientation == 3:
            img = img.rotate(180, expand=True)
        elif orientation == 6:
            img = img.rotate(270, expand=True)
        elif orientation == 8:
            img = img.rotate(90, expand=True)
        
        return img
    except Exception as e:
        logger.error(f"Auto-rotate error: {e}")
        return img

def enhance_image_for_ocr(image_bytes):
    """
    Enhances image contrast and sharpness for better OCR results.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # 0. Auto-rotate based on EXIF
        img = auto_rotate_image(img)
        
        # 1. Convert to grayscale
        img = img.convert('L')
        
        # 2. Boost Contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(2.0)
        
        # 3. Boost Sharpness
        enhancer = ImageEnhance.Sharpness(img)
        img = enhancer.enhance(2.0)
        
        # Save back to bytes
        output = io.BytesIO()
        img.save(output, format='JPEG')
        return output.getvalue()
    except Exception as e:
        logger.error(f"Image enhancement error: {e}")
        return image_bytes

def analyze_dl_with_easyocr(image_bytes):
    """
    Analyzes document bytes using EasyOCR (Local).
    Uses a multi-pass approach (Original -> Enhanced) for better accuracy.
    """
    try:
        reader = get_easyocr_reader()
        if not reader:
            return None
            
        # Pass 1: Original Image
        logger.info("Starting EasyOCR (Pass 1: Original)...")
        results = reader.readtext(image_bytes, detail=0)
        
        # Check if we got something substantial (e.g. at least one line)
        if results and len(" ".join(results)) > 10:
            return results
            
        # Pass 2: Enhanced Image
        logger.info("Pass 1 yielded poor results. Starting EasyOCR (Pass 2: Enhanced)...")
        enhanced_bytes = enhance_image_for_ocr(image_bytes)
        results_enhanced = reader.readtext(enhanced_bytes, detail=0)
        
        return results_enhanced
    except Exception as e:
        logger.error(f"❌ EasyOCR error: {str(e)}")
        return None

def get_textract_client():
    """Initializes the Textract client."""
    if not (Config.AWS_ACCESS_KEY_ID and Config.AWS_SECRET_ACCESS_KEY):
        logger.error("❌ Textract error: AWS credentials not configured.")
        return None
    return boto3.client(
        'textract',
        aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
        region_name=Config.AWS_REGION
    )

from pypdf import PdfReader

def extract_text_from_pdf(pdf_bytes):
    """
    Extracts text from a PDF file.
    Specifically useful for DigiLocker PDFs which have a text layer.
    """
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_lines = []
        for page in reader.pages:
            content = page.extract_text()
            if content:
                # Split by newlines and clean up
                text_lines.extend([line.strip() for line in content.split('\n') if line.strip()])
        
        logger.info(f"Successfully extracted {len(text_lines)} lines from PDF")
        return text_lines
    except Exception as e:
        logger.error(f"❌ PDF extraction error: {str(e)}")
        return None

def analyze_dl_bytes(image_bytes):
    """
    Analyzes raw document bytes using local EasyOCR.
    """
    return analyze_dl_with_easyocr(image_bytes)

# Removed Textract functions to minimize costs and prioritize EasyOCR.
