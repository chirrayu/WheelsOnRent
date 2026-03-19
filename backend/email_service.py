from config import Config
import resend
import threading

resend.api_key = Config.RESEND_APIKEY


def _send_email_async(params, label="Email"):
    """Send email in a background thread to avoid blocking the API."""
    def _send():
        try:
            email_response = resend.Emails.send(params)
            print(f"✅ {label} sent successfully. ID: {email_response.id}")
        except Exception as e:
            print(f"❌ Error sending {label}: {str(e)}")
    
    thread = threading.Thread(target=_send, daemon=True)
    thread.start()


def otp_sending_function(email, OTP):
    try:
        params = {
            "from": "WheelsOnRent <onboarding@wheelsonrentroad.com>",
            "to": [email],
            "subject": "OTP Verification for WheelsOnRent",
            "html": f"""
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 40px 20px; background-color:#f5f3ff;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden;
               box-shadow:0 15px 35px rgba(107,33,168,0.1); border:1px solid #f3e8ff;">

        <tr>
          <td align="center"
              style="background:linear-gradient(135deg,#6b21a8,#9333ea); padding:40px 20px;">
            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing:1px;">
              WheelsOnRent
            </h1>
          </td>
        </tr>

        <tr>
          <td style="padding:40px 40px 20px; text-align:center; color:#4b5563;">
            <p style="margin:0 0 12px; font-size:18px; color:#1f2937; font-weight:bold;">
              Verify Your Identity
            </p>
            <p style="margin:0;">
              Use the code below to continue. This code expires in
              <span style="color:#7c3aed; font-weight:bold;">5 minutes</span>.
            </p>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding:10px 40px 40px;">
            <div style="background:#faf5ff; border:1px solid #e9d5ff;
                        border-radius:12px; padding:25px;">
              <span style="font-size:42px; letter-spacing:12px; font-weight:bold;
                           color:#6b21a8; font-family:Consolas,monospace;">
                {OTP}
              </span>
            </div>
          </td>
        </tr>

        <tr>
          <td style="padding:0 40px 30px; text-align:center; color:#9ca3af; font-size:13px;">
            <p style="margin:0 0 15px;">
              If you didn't request this, you can safely ignore this email.
            </p>
            <div style="border-top:1px solid #f3e8ff; padding-top:20px;">
              <p style="margin:0; font-size:14px; color:#6b21a8; font-weight:bold;">
                Safe Travels,
              </p>
              <p style="margin:2px 0 0; font-size:14px; color:#7c3aed;">
                The WheelsOnRent Team
              </p>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
  </table>
  """
        }

        _send_email_async(params, "OTP email")
        return True
    except Exception as e:
        print(f"Error preparing OTP email: {str(e)}")
        return False


import base64

def ride_confirm_qr(email, QR_CODE_BASE64, BOOKING_ID, PICKUP_DATE):
    try:
        # If the QR code string contains the data URI prefix, strip it
        if "," in QR_CODE_BASE64:
            QR_CODE_BASE64 = QR_CODE_BASE64.split(",")[1]
        
        params = {
            "from": "WheelsOnRent <onboarding@wheelsonrentroad.com>",
            "to": [email],
            "subject": "Ride Confirmation for WheelsOnRent",
            "html": f"""
  <table width="100%" border="0" cellspacing="0" cellpadding="0"
  style="padding:40px 20px; background-color:#f5f3ff;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:480px; background-color:#ffffff; border-radius:16px;
               overflow:hidden; box-shadow:0 15px 35px rgba(107,33,168,0.1);
               border:1px solid #f3e8ff;">

        <!-- Header -->
        <tr>
          <td align="center"
            style="background:linear-gradient(135deg,#6b21a8,#9333ea);
                   padding:40px 20px;">
            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing:1px;">
              WheelsOnRent
            </h1>
            <p style="margin:8px 0 0; color:#ede9fe; font-size:20px;">
              Booking Confirmed 
            </p>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:35px 40px 15px; text-align:center; color:#4b5563;">
            <p style="margin:0 0 10px; font-size:18px; color:#1f2937; font-weight:bold;">
              Your Ride Is Ready!
            </p>
            <p style="margin:0; font-size:14px;">
              Show the QR code below at pickup to start your journey.
            </p>
          </td>
        </tr>

        <!-- QR Code -->
        <tr>
          <td align="center" style="padding:20px 40px;">
            <div style="background:#faf5ff; border:1px solid #e9d5ff;
                        border-radius:14px; padding:25px;">
              <img src="cid:qrcode" alt="Booking QR Code"
                style="width:180px; height:180px; display:block; margin:auto;" />
            </div>
          </td>
        </tr>

        <!-- Booking Details -->
        <tr>
          <td style="padding:10px 40px 30px; font-size:14px; color:#374151;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-top:1px solid #f3e8ff; padding-top:15px;">
              <tr>
                <td style="padding:6px 0;"><strong>Booking ID:</strong></td>
                <td align="right">{BOOKING_ID}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;"><strong>Pickup Date:</strong></td>
                <td align="right">{PICKUP_DATE}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 40px 30px; text-align:center; color:#9ca3af;
                     font-size:13px;">
            <p style="margin:0 0 15px;">
              Please keep this QR code safe. It will be scanned at pickup.
            </p>
            <div style="border-top:1px solid #f3e8ff; padding-top:18px;">
              <p style="margin:0; font-size:14px; color:#6b21a8; font-weight:bold;">
                Safe Travels,
              </p>
              <p style="margin:2px 0 0; font-size:14px; color:#7c3aed;">
                The WheelsOnRent Team
              </p>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
  </table>

  """,
            "attachments": [
                {
                    "content": list(base64.b64decode(QR_CODE_BASE64)),
                    "filename": "qrcode.png",
                    "content_id": "qrcode"
                }
            ]
        }

        _send_email_async(params, "Booking confirmation email")
        return True
    except Exception as e:
        print(f"Error preparing booking confirmation email: {str(e)}")
        return False


def password_reset(email, RESET_LINK):
    try:
        params = {
            "from": "WheelsOnRent <onboarding@wheelsonrentroad.com>",
            "to": [email],
            "subject": "Password Reset for WheelsOnRent",
            "html": f"""
<table width="100%" border="0" cellspacing="0" cellpadding="0"
  style="padding:40px 20px; background-color:#f5f3ff;">
  <tr>
    <td align="center">
      <table width="100%" cellpadding="0" cellspacing="0"
        style="max-width:480px; background-color:#ffffff; border-radius:16px;
               overflow:hidden; box-shadow:0 15px 35px rgba(107,33,168,0.1);
               border:1px solid #f3e8ff;">

        <!-- Header -->
        <tr>
          <td align="center"
            style="background:linear-gradient(135deg,#6b21a8,#9333ea);
                   padding:40px 20px;">
            <h1 style="margin:0; color:#ffffff; font-size:26px; letter-spacing:1px;">
              WheelsOnRent
            </h1>
            <p style="margin:8px 0 0; color:#ede9fe; font-size:14px;">
              Password Reset Request
            </p>
          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:35px 40px 15px; text-align:center; color:#4b5563;">
            <p style="margin:0 0 10px; font-size:18px; color:#1f2937; font-weight:bold;">
              Forgot Your Password?
            </p>
            <p style="margin:0; font-size:14px;">
              No worries. Click the button below to reset your password.
              This link will expire in 
              <span style="color:#7c3aed; font-weight:bold;">15 minutes</span>.
            </p>
          </td>
        </tr>

        <!-- Button -->
        <tr>
          <td align="center" style="padding:25px 40px;">
            <a href="{RESET_LINK}"
              style="display:inline-block; background:linear-gradient(135deg,#6b21a8,#9333ea);
                     color:#ffffff; text-decoration:none; padding:14px 28px;
                     border-radius:10px; font-weight:bold; font-size:14px;">
              Reset Password
            </a>
          </td>
        </tr>

        <!-- Fallback Link -->
        <tr>
          <td style="padding:0 40px 20px; text-align:center; font-size:12px; color:#9ca3af;">
            <p style="margin:0 0 10px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="word-break:break-all; color:#6b21a8;">
              {RESET_LINK}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:0 40px 30px; text-align:center; color:#9ca3af;
                     font-size:13px;">
            <p style="margin:0 0 15px;">
              If you didn't request a password reset, you can safely ignore this email.
              Your account remains secure.
            </p>
            <div style="border-top:1px solid #f3e8ff; padding-top:18px;">
              <p style="margin:0; font-size:14px; color:#6b21a8; font-weight:bold;">
                Stay Secure,
              </p>
              <p style="margin:2px 0 0; font-size:14px; color:#7c3aed;">
                The WheelsOnRent Team
              </p>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
"""
        }

        _send_email_async(params, "Password reset email")
        return True
    except Exception as e:
        print(f"Error preparing password reset email: {str(e)}")
        return False