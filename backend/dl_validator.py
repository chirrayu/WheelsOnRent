import re
from datetime import datetime

# Official 36 States and Union Territories of India
INDIAN_STATES = {
    "AN": "Andaman and Nicobar Islands",
    "AP": "Andhra Pradesh",
    "AR": "Arunachal Pradesh",
    "AS": "Assam",
    "BR": "Bihar",
    "CH": "Chandigarh",
    "CT": "Chhattisgarh",
    "DN": "Dadra and Nagar Haveli",
    "DD": "Daman and Diu",
    "DL": "Delhi",
    "GA": "Goa",
    "GJ": "Gujarat",
    "HR": "Haryana",
    "HP": "Himachal Pradesh",
    "JK": "Jammu and Kashmir",
    "JH": "Jharkhand",
    "KA": "Karnataka",
    "KL": "Kerala",
    "LA": "Ladakh",
    "LD": "Lakshadweep",
    "MP": "Madhya Pradesh",
    "MH": "Maharashtra",
    "MN": "Manipur",
    "ML": "Meghalaya",
    "MZ": "Mizoram",
    "NL": "Nagaland",
    "OD": "Odisha",
    "PY": "Puducherry",
    "PB": "Punjab",
    "RJ": "Rajasthan",
    "SK": "Sikkim",
    "TN": "Tamil Nadu",
    "TS": "Telangana",
    "TR": "Tripura",
    "UP": "Uttar Pradesh",
    "UK": "Uttarakhand",
    "WB": "West Bengal"
}

def validate_indian_dl_number(dl_number):
    """
    Validates Indian DL number format: SS-RR-YYYY-NNNNNNN (15 characters)
    Robustly searches for the pattern within a string, handling common OCR errors.
    """
    if not dl_number or not isinstance(dl_number, str):
        return False, "DL number must be a string."

    # Map common OCR misreads for numerical positions
    # 0 -> O, 1 -> I/L, 5 -> S, 8 -> B, 2 -> Z
    text = dl_number.upper()
    
    # regex for 15-char standard: 2 letters, 13 digits 
    # (Simplified standard: SS RR YYYY NNNNNNN)
    # We use a broad search: 2 chars + 13 chars (alpha/numeric)
    pattern = r"([A-Z0-9]{2})[^A-Z0-9]*([A-Z0-9]{2})[^A-Z0-9]*([A-Z0-9]{4})[^A-Z0-9]*([A-Z0-9]{7})"
    
    match = re.search(pattern, text)
    if not match:
        # Try one more time with super-cleaned string
        clean_only = re.sub(r'[^A-Z0-9]', '', text)
        if len(clean_only) >= 15:
            match = re.search(r"([A-Z0-9]{2})(\d{1,2}|[A-Z0-9]{2})(\d{4})(\d{7})", clean_only)

    if not match:
        return False, "Standard 15-digit DL pattern not found."

    # Reconstruct and normalize
    # S1=State, S2=RTO_Code, S3=Year, S4=ID
    s1, s2, s3, s4 = match.groups()
    
    raw_dl = f"{s1}{s2}{s3}{s4}"
    
    # Fuzzy normalization:
    # 1. State Code Fixes
    s1 = s1.replace('0', 'O').replace('1', 'I')
    if s1 == 'DI': s1 = 'DL' # Common Delhi fix
    
    # 2. Number Fixes (S2, S3, S4)
    def fix_nums(val):
        return val.replace('O', '0').replace('I', '1').replace('L', '1').replace('S', '5').replace('Z', '2').replace('B', '8')
    
    s2 = fix_nums(s2)
    s3 = fix_nums(s3)
    s4 = fix_nums(s4)
    
    clean_dl = f"{s1}{s2}{s3}{s4}"
    
    if s1 not in INDIAN_STATES:
        # Check if s1 is almost a state code? No, let's keep it strict here but log it.
        return False, f"Invalid state code: {s1}."

    return True, clean_dl

def validate_dl_dates(dob_str, expiry_str, is_transport=False):
    """
    Validates DOB and Expiry.
    dob_str: 'YYYY-MM-DD'
    expiry_str: 'YYYY-MM-DD'
    """
    try:
        dob = datetime.fromisoformat(dob_str.replace('Z', '')).replace(tzinfo=timezone.utc)
        expiry = datetime.fromisoformat(expiry_str.replace('Z', '')).replace(tzinfo=timezone.utc)
        from datetime import timezone
        today = datetime.now(timezone.utc)

        # 1. Expiry Check
        if expiry <= today:
            return False, "Driver's license is expired."

        # 2. Age Check
        age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        min_age = 20 if is_transport else 18
        
        if age < min_age:
            return False, f"User must be at least {min_age} years old for this vehicle class."

        return True, None
    except Exception as e:
        return False, f"Date validation error: {str(e)}"

def check_vehicle_eligibility(dl_classes, vehicle_type):
    """
    Checks if extracted DL classes match vehicle type.
    Example dl_classes: ['LMV', 'MCWG']
    Example vehicle_type: 'car' or 'scooter'
    """
    # Mapping
    MAP = {
        'car': ['LMV', 'LMV-NT', 'LMV-TR'],
        'suv': ['LMV', 'LMV-NT', 'LMV-TR'],
        'scooter': ['MCWG', 'MC'],
        'bike': ['MCWG', 'MC']
    }
    
    target_classes = MAP.get(vehicle_type.lower(), [])
    if not target_classes:
        return True # Default allow if unknown type
        
    found = any(cls in dl_classes for cls in target_classes)
    if not found:
        return False, f"Driving License does not have authorization for {vehicle_type} class."
        
    return True, None
