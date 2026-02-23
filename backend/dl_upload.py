import os
import re
import io
import base64
from datetime import datetime
from flask import request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from database import get_db
from bson import ObjectId
import traceback
from storage import upload_to_s3

# S3-Only storage is enforced. Local fallback folders removed.

def upload_dl(user_id):
    """
    Handles DL document upload with local file storage.
    """
    try:
        db = get_db()
        print(f"DEBUG: Processing DL upload for user_id: {user_id}")
        user = db.users.find_one({'_id': ObjectId(user_id)})
        if not user:
            print(f"DEBUG: User {user_id} not found in database")
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
        
        # Read image bytes
        # image_bytes = file.read() # This line is removed as upload_to_s3 takes the file object directly
        dl_number = request.form.get('dl_number', 'PENDING_MANUAL')

        # upload file using centralized storage utility (S3 with local fallback)
        try:
            image_url = upload_to_s3(file)
            # and we still need the saved_filename for database record, 
            # though storage.py handles it, let's derive it from the URL
            saved_filename = image_url.split('/')[-1]
            print(f"DEBUG: File uploaded to {image_url}")
        except Exception as upload_err:
            print(f"Upload failed: {str(upload_err)}")
            return jsonify({'error': f'Failed to upload file: {str(upload_err)}'}), 500

        # Store DL info in database
        dl_document = {
            'user_id': user_id,
            'dl_number': dl_number,
            'image_filename': saved_filename,
            'image_url': image_url,
            'status': 'pending',
            'validation_message': 'Awaiting manual review',
            'uploaded_at': datetime.utcnow(),
            'verified_at': None
        }
        print(f"DEBUG: Saving DL record to database for user {user_id}")

        # Check if user already has an upload, update or insert
        if existing_dl:
            db.dl_uploads.update_one(
                {'_id': existing_dl['_id']},
                {'$set': dl_document}
            )
            dl_id = str(existing_dl['_id'])
        else:
            result = db.dl_uploads.insert_one(dl_document)
            dl_id = str(result.inserted_id)

        # Update user's verification status
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'dl_verified': False,
                'dl_uploaded': True,
                'dl_upload_id': dl_id
            }}
        )

        print(f"DEBUG: DL upload complete for user {user_id}, dl_id: {dl_id}")
        return jsonify({
            'message': 'DL uploaded successfully! Awaiting manual verification.',
            'dl_number': dl_number,
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
        
        dl_doc = db.dl_uploads.find_one({'user_id': user_id})
        
        if not dl_doc:
            return jsonify({
                'has_uploaded': False,
                'status': 'not_uploaded'
            }), 200
        
        return jsonify({
            'has_uploaded': True,
            'status': dl_doc.get('status', 'pending'),
            'dl_number': dl_doc.get('dl_number', ''),
            'validation_message': dl_doc.get('validation_message', ''),
            'uploaded_at': dl_doc.get('uploaded_at').isoformat() if dl_doc.get('uploaded_at') else None,
            'verified_at': dl_doc.get('verified_at').isoformat() if dl_doc.get('verified_at') else None
        }), 200

    except Exception as e:
        print(f"Get DL status error: {str(e)}")
        return jsonify({'error': f'Failed to get DL status: {str(e)}'}), 500

