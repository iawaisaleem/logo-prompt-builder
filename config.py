import os
from dotenv import load_dotenv

load_dotenv()

print("SECRET_KEY =", os.getenv("SECRET_KEY"))
print("MYSQLHOST =", os.getenv("MYSQLHOST"))
print("MYSQLPORT =", os.getenv("MYSQLPORT"))
print("MYSQLUSER =", os.getenv("MYSQLUSER"))
print("MYSQLPASSWORD =", os.getenv("MYSQLPASSWORD"))
print("MYSQLDATABASE =", os.getenv("MYSQLDATABASE"))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")

    SQLALCHEMY_DATABASE_URI = (
        f"mysql+pymysql://"
        f"{os.getenv('MYSQLUSER')}:"
        f"{os.getenv('MYSQLPASSWORD')}@"
        f"{os.getenv('MYSQLHOST')}:"
        f"{os.getenv('MYSQLPORT')}/"
        f"{os.getenv('MYSQLDATABASE')}"
    )

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    RESEND_API_KEY = os.getenv("RESEND_API_KEY")