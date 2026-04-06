import traceback
from datetime import datetime, timezone
from flask import request, jsonify
from bson import ObjectId
from storage import upload_to_s3
from security_logger import log_security_event
from database import get_db

def upload_dl(user_id):
    """
    Handles DL document upload.
    Uploads to S3 and immediately marks as verified — no OCR required.
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

        log_security_event('DL_UPLOAD_ATTEMPT', {'user_id': user_id, 'filename': file.filename}, severity='INFO')

        # Upload to S3
        try:
            image_url = upload_to_s3(file)
            if not image_url:
                return jsonify({'error': 'Failed to upload to S3.'}), 400
            s3_key = image_url.split("amazonaws.com/")[-1]
        except Exception as upload_err:
            return jsonify({'error': f'Upload failed: {str(upload_err)}'}), 500

        # Create verified DL record immediately (no OCR)
        now = datetime.now(timezone.utc)
        dl_document = {
            'user_id': user_id,
            'dl_number': 'UPLOADED',
            'image_url': image_url,
            's3_key': s3_key,
            'status': 'verified',
            'validation_message': 'Document uploaded and accepted.',
            'uploaded_at': now,
            'verified_at': now
        }

        existing_dl = db.dl_uploads.find_one({'user_id': user_id})
        if existing_dl:
            db.dl_uploads.update_one({'_id': existing_dl['_id']}, {'$set': dl_document})
            dl_id = str(existing_dl['_id'])
        else:
            result = db.dl_uploads.insert_one(dl_document)
            dl_id = str(result.inserted_id)

        # Mark user as DL verified immediately
        db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {
                'dl_uploaded': True,
                'dl_upload_id': dl_id,
                'dl_verified': True,
                'dl_verification_status': 'verified'
            }}
        )

        log_security_event('DL_UPLOAD_SUCCESS', {'user_id': user_id, 'dl_id': dl_id}, severity='INFO')
        print(f"✅ DL uploaded and verified for user {user_id}")

        return jsonify({
            'message': 'Document uploaded successfully! You can now book a vehicle.',
            'status': 'verified',
            'dl_id': dl_id
        }), 200

    except Exception as e:
        print(f"DL Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': 'Upload failed. Please try again.'}), 500


def get_dl_status(user_id):
    """
    Gets the DL verification status for a user.
    """
    try:
        db = get_db()
        dl_doc = db.dl_uploads.find_one({'user_id': str(user_id)})

        if not dl_doc:
            return jsonify({'has_uploaded': False, 'status': 'not_uploaded'}), 200

        return jsonify({
            'has_uploaded': True,
            'status': dl_doc.get('status', 'verified'),
            'dl_number': dl_doc.get('dl_number', ''),
            'validation_message': dl_doc.get('validation_message', ''),
            'uploaded_at': dl_doc.get('uploaded_at').isoformat() if dl_doc.get('uploaded_at') else None,
            'verified_at': dl_doc.get('verified_at').isoformat() if dl_doc.get('verified_at') else None,
        }), 200

    except Exception as e:
        print(f"Get DL status error: {str(e)}")
        return jsonify({'error': 'Failed to get DL status.'}), 500
