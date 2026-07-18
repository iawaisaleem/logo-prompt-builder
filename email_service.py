from flask_mail import Mail, Message

mail = Mail()

def send_otp_email(app, recipient_email, otp):
    with app.app_context():
        msg = Message(
            subject="Verify Your Email - Logo Prompt Builder",
            sender=app.config["MAIL_USERNAME"],
            recipients=[recipient_email]
        )

        msg.body = f"""
Hello,

Welcome to Logo Prompt Builder.

Your verification code is:

{otp}

This code expires in 10 minutes.

If you didn't create this account, you can ignore this email.

Thank you,
Logo Prompt Builder Team
"""

        mail.send(msg)