import resend

def send_otp_email(app, recipient_email, otp):

    resend.api_key = app.config["RESEND_API_KEY"]

    resend.Emails.send({
        "from": "Logo Prompt Builder <onboarding@resend.dev>",
        "to": recipient_email,
        "subject": "Verify Your Email",
        "text": f"""
Hello,

Welcome to Logo Prompt Builder.

Your verification code is:

{otp}

This code expires in 10 minutes.

Thank you.
"""
    })