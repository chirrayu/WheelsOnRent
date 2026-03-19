import re
import traceback
import logging
from datetime import datetime, timezone
from storage import (
    analyze_dl_bytes, 
    extract_text_from_pdf, 
    Config
)
from dl_validator import validate_indian_dl_number, validate_dl_dates

logger = logging.getLogger(__name__)

def check_dl_authenticity(lines):
    """
    Checks if the OCR lines contain standard Indian DL keywords/markers.
    Returns: (is_authentic, confidence_score, reasons)
    """
    if not lines or len(lines) < 3:
        return False, 0, ["Insufficient text found"]

    keywords = {
        'header': [r"Indian Union", r"Driving Licen[sc]e", r"Republic of India"],
        'authority': [r"Issued by", r"Government of", r"Transport Department"],
        'fields': [r"Validity", r"Issue Date", r"Date of Birth", r"DOB", r"Authorization"],
        'class': [r"LMV", r"MCWG", r"MC", r"HGV", r"TRANS"]
    }
    
    found_categories = set()
    full_text = " ".join(lines).lower()
    
    score = 0
    for category, patterns in keywords.items():
        for pattern in patterns:
            if re.search(pattern, full_text, re.IGNORECASE):
                found_categories.add(category)
                score += 25 # Each category adds to the score
                break
    
    is_authentic = score >= 75 # Stricter: Need at least 3 categories to be considered authentic
    reasons = list(found_categories)
    
    return is_authentic, score, reasons

def extract_data_from_lines(lines):
    """
    Heuristic to find DL Number and dates from raw OCR lines.
    """
    data = {'dl_number': None, 'dob': None, 'expiry': None}
    # Supports DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, etc.
    date_pattern = r"(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})"
    found_dates = []
    
    # 1. First pass: Single line checks
    for line in lines:
        is_dl, clean_dl = validate_indian_dl_number(line)
        if is_dl:
            data['dl_number'] = clean_dl
            
        dates = re.findall(date_pattern, line)
        for date_str in dates:
            try:
                # Try multiple formats
                for fmt in ('%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d'):
                    try:
                        d = datetime.strptime(date_str, fmt)
                        found_dates.append(d)
                        break
                    except ValueError:
                        continue
            except:
                pass
             
    # 2. Second pass: If DL not found, check concatenated text
    # (OCR often splits the DL number into blocks)
    if not data['dl_number']:
        full_text = " ".join(lines)
        is_dl, clean_dl = validate_indian_dl_number(full_text)
        if is_dl:
            data['dl_number'] = clean_dl
        
        # Also look for more dates in full text
        full_dates = re.findall(date_pattern, full_text)
        for date_str in full_dates:
             try:
                for fmt in ('%d-%m-%Y', '%Y-%m-%d', '%d/%m/%Y', '%Y/%m/%d'):
                    try:
                        d = datetime.strptime(date_str, fmt)
                        if d not in found_dates:
                            found_dates.append(d)
                        break
                    except ValueError:
                        continue
             except:
                pass

    # Heuristic: Pick Expiry, DOB and Issue Date semantically
    if len(found_dates) >= 2:
        found_dates.sort()
        today = datetime.now()
        
        # 1. Candidate for Expiry: Any date in the future
        future_dates = [d for d in found_dates if d > today]
        if future_dates:
            data['expiry'] = min(future_dates).strftime('%Y-%m-%d')
        else:
            # Fallback to latest date if none are in future (maybe just expired?)
            data['expiry'] = found_dates[-1].strftime('%Y-%m-%d')

        # 2. Candidate for DOB: Earliest date
        data['dob'] = found_dates[0].strftime('%Y-%m-%d')
        
    elif len(found_dates) == 1:
        # If only one date, we can't be sure, but usually it's Expiry on modern cards
        data['expiry'] = found_dates[0].strftime('%Y-%m-%d')

    return data

def verify_dl_image(s3_key=None, image_bytes=None):
    """
    Common verification logic used by both profile upload and booking flow.
    Can scan via S3 key or raw bytes (for pre-upload validation).
    Returns: (status, message, extraction_results)
    """
    extraction_results = {}
    status = 'pending'
    validation_message = 'Awaiting manual review'
    
    try:
        if image_bytes:
            # Check for PDF magic bytes (%PDF)
            if image_bytes.startswith(b'%PDF'):
                logger.info("Detected PDF file. Using PDF text extraction...")
                ocr_lines = extract_text_from_pdf(image_bytes)
            else:
                ocr_lines = analyze_dl_bytes(image_bytes)
        elif s3_key:
            # For S3 files, we download them or use the analyze_dl_bytes path which handles S3 via detection
            # Note: analyze_dl_bytes in storage.py currently prefers EasyOCR
            # We'll fetch the image bytes from S3 first
            from storage import get_s3_client
            s3 = get_s3_client()
            if s3:
                try:
                    obj = s3.get_object(Bucket=Config.S3_BUCKET_NAME, Key=s3_key)
                    image_bytes = obj['Body'].read()
                    ocr_lines = analyze_dl_bytes(image_bytes)
                except Exception as e:
                    logger.error(f"S3 download failed for OCR: {e}")
                    ocr_lines = None
            else:
                ocr_lines = None
        else:
            return 'error', 'No image data provided for verification', {}

        if ocr_lines:
            # 1. Basic extraction (DL Number, Dates)
            extracted = extract_data_from_lines(ocr_lines)
            
            # 2. Authenticity Verification (Keyword based)
            is_authentic, auth_score, auth_reasons = check_dl_authenticity(ocr_lines)
            
            extraction_results = {
                'raw_lines': ocr_lines,
                'identified': extracted,
                'authenticity': {
                    'is_authentic': is_authentic,
                    'score': auth_score,
                    'reasons': auth_reasons
                }
            }
            
            # 3. Decision Logic
            if not is_authentic:
                status = 'flagged'
                validation_message = "Invalid document: Standard Indian DL markers not found. Please upload a clear photo of your original DL."
            elif extracted['dl_number'] and extracted['expiry']:
                expiry_dt = datetime.strptime(extracted['expiry'], '%Y-%m-%d').replace(tzinfo=timezone.utc)
                if expiry_dt > datetime.now(timezone.utc):
                    status = 'verified'
                    validation_message = f"Automated verification successful. DL: {extracted['dl_number']}"
                else:
                    status = 'flagged'
                    validation_message = "Driving License appears to be EXPIRED. Manual review required."
            elif extracted['dl_number']:
                status = 'flagged'
                validation_message = "DL number found, but expiry date could not be verified. Manual review required."
            else:
                status = 'flagged'
                validation_message = "Indian DL number not clearly identified. Manual review required."
        else:
            status = 'flagged'
            validation_message = "Invalid document: OCR analysis failed to read text. Please ensure you upload a clear photo of your Indian DL."
            
    except Exception as e:
        print(f"DL Verification Service Error: {str(e)}")
        status = 'flagged'
        validation_message = f"Internal verification error: {str(e)}"
        
    return status, validation_message, extraction_results
