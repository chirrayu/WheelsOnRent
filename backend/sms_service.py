import boto3
from config import Config

def send_otp_sms(phone_number, otp):
    """
    Sends an OTP via SMS using AWS SNS.
    """
    try:
        # Initialize the SNS client
        sns = boto3.client(
            'sns',
            aws_access_key_id=Config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=Config.AWS_SECRET_ACCESS_KEY,
            region_name=Config.AWS_REGION
        )

        message = f"Your WheelsOnRent verification code is: {otp}. Valid for 5 minutes."
        
        # In AWS SNS, phone numbers must be in E.164 format (e.g., +1234567890)
        # Ensure the phone number starts with +
        if not phone_number.startswith('+'):
            # Assuming Indian phone number if no prefix, you might want to adjust this logic
            phone_number = f"+91{phone_number}"

        response = sns.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SenderID': {
                    'DataType': 'String',
                    'StringValue': 'WHEELSONREN'
                },
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )
        
        print(f"OTP SMS sent successfully to {phone_number}. MessageId: {response['MessageId']}")
        return True
    except Exception as e:
        print(f"Error sending OTP SMS to {phone_number}: {str(e)}")
        # For development/debugging, we might want to see the OTP in console if SNS fails
        print(f"DEBUG OTP for {phone_number}: {otp}")
        return False
