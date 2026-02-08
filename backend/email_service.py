from config import RESEND_APIKEY
import resend

resend.api_key = RESEND_APIKEY

def otp_sending_function(email, OTP):
    resend.Emails.send({
        "from": "noreply@wheelsonrentroad.com",
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
              If you didn’t request this, you can safely ignore this email.
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
    })

otp_sending_function("djain6454@gmail.com", 11111)
