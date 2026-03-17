import threading
import traceback
from datetime import datetime, timezone
from flask import request, jsonify
from bson import ObjectId
from storage import upload_to_s3
from security_logger import log_security_event
from config import Config
from database import get_db

def _process_dl_background(user_id, file_bytes, s3_url, s3_key, dl_id):
    """Refined background task for OCR verification."""
    try:
        from database import get_db
        db = get_db()
        from dl_service import verify_dl_image

        # 1. Real-Time OCR & Verification
        status, validation_msg, extraction = verify_dl_image(image_bytes=file_bytes)

        # 2. Update DL Document
        db.dl_uploads.update_one(
            {'_id': ObjectId(dl_id)},
            {'$set': {
                'status': status,
                'ocr_data': extraction,
                'validation_message': validation_msg,
                'dl_number': extraction.get('identified', {}).get('dl_number') or 'PENDING',
                'verified_at': datetime.now(timezone.utc) if status == 'verified' else None
            }}
        )

        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'dl_verified': (status == 'verified'),
                'dl_verification_status': status
            }}
        )
        log_security_event('DL_PROCESS_COMPLETE', {'user_id': user_id, 'status': status, 'dl_id': dl_id}, severity='INFO' if status == 'verified' else 'WARNING')
        print(f"✅ Background DL processing complete for user {user_id}. Status: {status}")

    except Exception as e:
        print(f"❌ Background DL processing error for user {user_id}: {str(e)}")
        print(traceback.format_exc())

def upload_dl(user_id):
    """
    Handles DL document upload with Asynchronous background verification.
    """
    try:
        db = get_db()
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            log_security_event('DL_UPLOAD_FAIL', {'user_id': user_id, 'reason': 'user_not_found'}, severity='WARNING')
            return jsonify({'error': 'User not found'}), 404

        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # 1. Read Bytes for scanning
        file_bytes = file.read()
        file.seek(0)
        log_security_event('DL_UPLOAD_ATTEMPT', {'user_id': user_id, 'filename': file.filename}, severity='INFO')

        # 2. Sequential S3 Upload (Should be fast)
        try:
            image_url = upload_to_s3(file)
            if not image_url:
                return jsonify({'error': 'Failed to upload to S3.'}), 400
            
            s3_key = image_url.split("amazonaws.com/")[-1]
            if f"{Config.S3_BUCKET_NAME}/" in s3_key:
                s3_key = s3_key.replace(f"{Config.S3_BUCKET_NAME}/", "")
        except Exception as upload_err:
            return jsonify({'error': f'Upload failed: {str(upload_err)}'}), 500

        # 3. Create initial "processing" record
        dl_document = {
            'user_id': user_id,
            'dl_number': 'PROCESSING...',
            'image_url': image_url,
            's3_key': s3_key,
            'status': 'processing',
            'validation_message': 'System is scanning your document. This usually takes 5-10 seconds.',
            'uploaded_at': datetime.now(timezone.utc),
            'verified_at': None
        }

        existing_dl = db.dl_uploads.find_one({'user_id': user_id})
        if existing_dl:
            db.dl_uploads.update_one({'_id': existing_dl['_id']}, {'$set': dl_document})
            dl_id = str(existing_dl['_id'])
        else:
            result = db.dl_uploads.insert_one(dl_document)
            dl_id = str(result.inserted_id)

        # Update user's temporary status
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'dl_uploaded': True,
                'dl_upload_id': dl_id,
                'dl_verification_status': 'processing'
            }}
        )

        # 4. START ASYNC PROCESSING
        thread = threading.Thread(
            target=_process_dl_background,
            args=(user_id, file_bytes, image_url, s3_key, dl_id),
            daemon=True
        )
        thread.start()

        return jsonify({
            'message': 'Upload successful! Your document is being processed in the background.',
            'status': 'processing',
            'dl_id': dl_id
        }), 202 # Accepted for processing

    except Exception as e:
        print(f"DL Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Upload failed. Please try again.'}), 500

def get_dl_status(user_id):
    """
    Gets the DL verification status for a user
    """
    try:
        db = get_db()
        # Ensure user_id is string for safety
        dl_doc = db.dl_uploads.find_one({'user_id': str(user_id)})
        
        if not dl_doc:
            return jsonify({'has_uploaded': False, 'status': 'not_uploaded'}), 200
        
        return jsonify({
            'has_uploaded': True,
            'status': dl_doc.get('status', 'pending'),
            'dl_number': dl_doc.get('dl_number', ''),
            'validation_message': dl_doc.get('validation_message', ''),
            'uploaded_at': dl_doc.get('uploaded_at').isoformat() if dl_doc.get('uploaded_at') else None,
            'verified_at': dl_doc.get('verified_at').isoformat() if dl_doc.get('verified_at') else None,
            'extracted_data': dl_doc.get('ocr_data', {}).get('identified', {})
        }), 200

    except Exception as e:
        print(f"Get DL status error: {str(e)}")
        return jsonify({'error': 'Failed to get DL status.'}), 500
