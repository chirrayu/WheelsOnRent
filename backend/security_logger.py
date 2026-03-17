import logging
import os
import json
import re
from datetime import datetime
from logging.handlers import RotatingFileHandler
from flask import request

# Setup security logger
security_logger = logging.getLogger('security_audit')
security_logger.setLevel(logging.INFO)

# Create a rotating file handler for security events
log_dir = 'logs'
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# Level 5: Log rotation (5MB per file, keep last 5)
log_path = os.path.join(log_dir, 'security_audit.log')
file_handler = RotatingFileHandler(log_path, maxBytes=5*1024*1024, backupCount=5)
# Set permissions: chmod 600 equivalent is tricky on Windows, but handled by OS if run as service
# Documentation: security_audit.log should be strictly limited to the backend service user.

formatter = logging.Formatter('%(asctime)s | %(levelname)s | %(message)s')
file_handler.setFormatter(formatter)
security_logger.addHandler(file_handler)

def mask_sensitive_data(data):
    """
    Masks sensitive information like phones, tokens, and IDs in log output.
    """
    if isinstance(data, dict):
        masked = data.copy()
        for key in masked:
            val = str(masked[key])
            if key in ['phone', 'identifier']:
                # Mask phone: +91 1234567890 -> ******7890
                masked[key] = f"{'*' * (len(val)-4)}{val[-4:]}" if len(val) > 4 else '****'
            elif key in ['token', 'otp', 'reset_code', 'password']:
                masked[key] = '[MASKED]'
            elif key in ['ip', 'remote_addr']:
                # Mask IP: 192.168.1.1 -> 192.168.*.*
                parts = val.split('.')
                if len(parts) == 4:
                    masked[key] = f"{parts[0]}.{parts[1]}.*.*"
        return masked
    elif isinstance(data, str):
        # Sanitize newlines to prevent log injection
        return data.replace('\n', ' ').replace('\r', ' ')
    return data

def get_forensic_context():
    """
    Captures request context for forensic investigation.
    """
    try:
        from flask_limiter.util import get_remote_address
        return {
            'ip': get_remote_address() or 'unknown',
            'ua': request.headers.get('User-Agent', 'unknown'),
            'endpoint': request.path,
            'method': request.method
        }
    except Exception:
        return {}

def log_security_event(event_type, details, severity='INFO'):
    """
    Logs a security-sensitive event with masking and context.
    event_type: e.g., 'LOGIN_FAIL', 'ROLE_CHANGE', 'DL_AUTO_VERIFIED', 'RATE_LIMIT_HIT'
    """
    # 1. Capture context
    context = get_forensic_context()
    
    # 2. Mask sensitive data
    masked_details = mask_sensitive_data(details)
    masked_context = mask_sensitive_data(context)
    
    # 3. Handle structure (timestamp | event | user | ip | endpoint | context)
    user_id = masked_details.get('user_id') or masked_details.get('identifier') or 'anonymous'
    log_msg = f"{event_type} | {user_id} | {masked_context.get('ip')} | {masked_context.get('endpoint')} | {json.dumps(masked_details)}"
    
    # 4. Log with severity
    if severity == 'CRITICAL':
        security_logger.critical(log_msg)
    elif severity == 'WARNING':
        security_logger.warning(log_msg)
    else:
        security_logger.info(log_msg)

    # Also print to console for visibility in dev
    print(f"🚨 SECURITY AUDIT: {log_msg}")
