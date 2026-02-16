import os
import re
import io
import base64
from datetime import datetime
from flask import request, jsonify
from werkzeug.utils import secure_filename
from database import get_db
from bson import ObjectId
import traceback
import config
import easyocr
import numpy as np
import cv2

# Initialize EasyOCR reader
reader = easyocr.Reader(['en'])

# Valid Indian DL number regex pattern
DL_PATTERN = r'^[A-Z]{2}[0-9]{13}$|^[A-Z]{2}[0-9]{2}[0-9]{11}$|^[A-Z]{2}[0-5A-Z]{1}[0-9]{4}[A-Z]{1}[0-9]{4}$|^[A-Z]{2}[0-9]{2}[A-Z]{1}[0-9]{7}$'

def extract_dl_info(image_bytes):
    """
    Extracts DL number, name, and expiry date from image using EasyOCR
    """
    try:
        # Convert image bytes to numpy array for EasyOCR
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Perform OCR
        results = reader.readtext(img)
        text = " ".join([res[1] for res in results]).upper()
        
        print(f"OCR Extracted Text: {text}")
        
        # DL Number pattern
        dl_match = re.search(DL_PATTERN, text)
        dl_number = dl_match.group() if dl_match else None
        
        # Name pattern - look for 'NAME' or 'HOLDER'
        name_match = re.search(r'(?:NAME|HOLDER|S/D/W OF)\s*[:\-]?\s*([A-Z\s]{3,})', text)
        name = name_match.group(1).strip() if name_match else None
        
        # If name contains multiple spaces or junk, clean it
        if name:
            name = re.sub(r'\s+', ' ', name).strip()
            # If name is too long or contains common DL keywords, truncate
            for kw in ['S/O', 'D/O', 'W/O', 'DOB', 'ADDRESS']:
                if kw in name:
                    name = name.split(kw)[0].strip()

        # Date of Birth
        dob_match = re.search(r'(?:DOB|DATE OF BIRTH)\s*[:\-]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})', text)
        dob = dob_match.group(1) if dob_match else None

        # Expiry Date - look for 'VALID TILL' or 'EXPIRY' or 'NT' (Non-Transport)
        expiry_match = re.search(r'(?:VALID TILL|EXP|EXPIRY|NT|TIL)\s*[:\-]?\s*([0-9]{2}[/-][0-9]{2}[/-][0-9]{4})', text)
        expiry_date = expiry_match.group(1) if expiry_match else None
        
        return dl_number, name, dob, expiry_date
    except Exception as e:
        print(f"OCR Extraction error: {str(e)}")
        return None, None, None, None

def validate_dl_data(dl_number, extracted_name, user_name, expiry_date):
    """
    Validates DL details against business rules
    """
    if not dl_number or not re.match(DL_PATTERN, dl_number):
        return False, "Invalid DL number format detected"
    
    if not expiry_date:
        return False, "Could not detect expiry date from DL"
    
    try:
        # Parse expiry date
        if '/' in expiry_date:
            expiry_dt = datetime.strptime(expiry_date, '%d/%m/%Y')
        else:
            expiry_dt = datetime.strptime(expiry_date, '%d-%m-%Y')
        
        if expiry_dt.date() <= datetime.now().date():
            return False, f"DL has expired on {expiry_date}"
        
        # Validate name match (fuzzy match or simple overlap)
        if extracted_name and user_name:
            user_name_parts = user_name.upper().split()
            match_count = sum(1 for part in user_name_parts if part in extracted_name.upper())
            if match_count == 0:
                return False, f"Name on DL ({extracted_name}) does not match profile ({user_name})"
        
        return True, expiry_date
    except ValueError:
        return False, "Invalid expiry date format detected"

def upload_dl(user_id):
    """
    Handles DL document upload and automatic verification using OCR
    """
    try:
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type
        allowed_extensions = ('.png', '.jpg', '.jpeg')
        if not file.filename.lower().endswith(allowed_extensions):
            return jsonify({'error': 'Invalid file type. Only PNG/JPG allowed'}), 400
        
        # Read image for OCR
        image_bytes = file.read()
        file.seek(0) # Reset file pointer for later use if needed
        
        # Encode image to base64 for storage
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')
        
        # Extract info using OCR
        dl_number, extracted_name, dob, expiry_date = extract_dl_info(image_bytes)
        
        print(f"Extracted: DL={dl_number}, Name={extracted_name}, DOB={dob}, Expiry={expiry_date}")

        # Validate extracted info
        is_valid, validation_msg = validate_dl_data(dl_number, extracted_name, user.get('name'), expiry_date)

        # Store DL info in database
        status = 'verified' if is_valid else 'pending'
        
        dl_document = {
            'user_id': user_id,
            'dl_number': dl_number if dl_number else "MANUAL_REQUIRED",
            'extracted_name': extracted_name,
            'dob': dob,
            'expiry_date': expiry_date,
            'image_filename': secure_filename(file.filename),
            'image_data': image_base64,
            'status': status,
            'validation_message': validation_msg if not is_valid else "Verified successfully",
            'uploaded_at': datetime.utcnow(),
            'verified_at': datetime.utcnow() if is_valid else None
        }

        # Check if user already has an upload, update it or insert new
        existing_dl = db.dl_uploads.find_one({'user_id': user_id})
        if existing_dl:
            db.dl_uploads.update_one(
                {'_id': existing_dl['_id']},
                {'$set': dl_document}
            )
            dl_id = str(existing_dl['_id'])
        else:
            result = db.dl_uploads.insert_one(dl_document)
            dl_id = str(result.inserted_id)

        # Update user's verification status in users table
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'dl_verified': is_valid,
                'dl_uploaded': True,
                'dl_upload_id': dl_id
            }}
        )

        if is_valid:
            return jsonify({
                'message': 'DL verified successfully!',
                'dl_number': dl_number,
                'status': 'verified'
            }), 200
        else:
            return jsonify({
                'message': 'DL uploaded but automatic verification failed. Admin will review.',
                'error': validation_msg,
                'status': 'pending'
            }), 200

    except Exception as e:
        print(f"DL Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': f'Upload failed: {str(e)}'}), 500

def get_dl_status(user_id):
    """
    Gets the DL verification status for a user
    """
    try:
        db = get_db()
        
        dl_doc = db.dl_uploads.find_one(
            {'user_id': user_id},
            {'image_data': 0}  # Exclude large image data
        )
        
        if not dl_doc:
            return jsonify({
                'has_uploaded': False,
                'status': 'not_uploaded'
            }), 200
        
        return jsonify({
            'has_uploaded': True,
            'status': dl_doc.get('status', 'pending'),
            'dl_number': dl_doc.get('dl_number', ''),
            'expiry_date': dl_doc.get('expiry_date', ''),
            'validation_message': dl_doc.get('validation_message', ''),
            'uploaded_at': dl_doc.get('uploaded_at').isoformat() if dl_doc.get('uploaded_at') else None,
            'verified_at': dl_doc.get('verified_at').isoformat() if dl_doc.get('verified_at') else None
        }), 200

    except Exception as e:
        print(f"Get DL status error: {str(e)}")
        return jsonify({'error': f'Failed to get DL status: {str(e)}'}), 500
