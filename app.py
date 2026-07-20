from flask import Flask, render_template, request, redirect, url_for, flash
from config import Config
from database import db
from flask import session
from sqlalchemy import text
from flask_mail import Mail
from flask import jsonify
from email_service import mail
from otp_service import generate_otp, get_otp_expiry
from email_service import send_otp_email 
import bcrypt

app = Flask(__name__)
app.config.from_object(Config)
import os

print("HOST =", os.getenv("MYSQLHOST"))
print("USER =", os.getenv("MYSQLUSER"))
print("DB =", os.getenv("MYSQLDATABASE"))
print("PORT =", os.getenv("MYSQLPORT"))

db.init_app(app)
mail.init_app(app)
with app.app_context():
    db.create_all()


@app.route("/prompt-builder")
def prompt_builder():

    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("prompt_builder.html")

@app.route("/save-prompt", methods=["POST"])
def save_prompt():

    if "user_id" not in session:
        return jsonify(success=True)

    prompt = request.form["prompt"]

    connection = db.session

    connection.execute(
    text("""
        INSERT INTO prompts(user_id, prompt)
        VALUES (:user_id, :prompt)
    """),
    {
        "user_id": session["user_id"],
        "prompt": prompt
    }
)

    connection.commit()

    return jsonify(success=True)

@app.route("/get-prompts")
def get_prompts():

    if "user_id" not in session:
        return []

    connection = db.session

    result = connection.execute(
    text("""
        SELECT id, prompt, created_at
        FROM prompts
        WHERE user_id=:user_id
        ORDER BY created_at DESC
    """),
    {
        "user_id": session["user_id"]
    }
)

    rows = result.fetchall()


    prompts=[]

    for row in rows:

        prompts.append({

            "id":row[0],
            "prompt":row[1],
            "created_at":str(row[2]),
            "name":"Generated Prompt"

        })

    return jsonify(prompts)

@app.route("/clear-prompts", methods=["POST"])
def clear_prompts():

    if "user_id" not in session:
        return jsonify(success=False)

    connection = db.session

    connection.execute(
    text("""
        DELETE FROM prompts
        WHERE user_id=:user_id
    """),
    {
        "user_id": session["user_id"]
    }
)

    connection.commit()

    return jsonify(success=True)

@app.route("/history")
def history():

    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("history.html")

@app.route("/")
def home():
    return redirect(url_for("register"))

@app.route("/register", methods=["GET", "POST"])
def register():

    if request.method == "POST":

        name = request.form["name"].strip()
        email = request.form["email"].strip().lower()
        password = request.form["password"]

        connection = db.session

        # Check if email already exists
        result = connection.execute(
    text("SELECT id FROM users WHERE email=:email"),
    {
        "email": email
    }
)

        existing_user = result.fetchone()

        if existing_user:
            connection.close()
            flash("Email already exists.", "danger")
            return redirect(url_for("register"))

        # Hash password
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        ).decode("utf-8")

        # Generate OTP
        otp = generate_otp()
        otp_expiry = get_otp_expiry()

        # Save user with OTP
        connection.execute(
    text("""
        INSERT INTO users
        (name,email,password,otp,otp_expiry)
        VALUES
        (:name,:email,:password,:otp,:expiry)
    """),
    {
        "name": name,
        "email": email,
        "password": hashed_password,
        "otp": otp,
        "expiry": otp_expiry
    }
)

        connection.commit()

        # Send OTP email
        send_otp_email(app, email, otp)

        flash("Verification code sent to your email.", "success")

        return redirect(url_for("verify"))

    return render_template("register.html")

@app.route("/verify", methods=["GET", "POST"])
def verify():

    if request.method == "POST":

        email = request.form["email"].strip().lower()
        otp = request.form["otp"].strip()

        connection = db.session

        result = connection.execute(
    text("""
        SELECT otp, otp_expiry
        FROM users
        WHERE email=:email
    """),
    {
        "email": email
    }
)

        user = result.fetchone()

        if not user:
            flash("User not found.", "danger")
            return redirect(url_for("verify"))

        saved_otp = user[0]
        expiry = user[1]

        from datetime import datetime

        if datetime.now() > expiry:
            flash("OTP has expired.", "danger")
            return redirect(url_for("verify"))

        if otp != saved_otp:
            connection.close()
            flash("Invalid OTP.", "danger")
            return redirect(url_for("verify"))

        connection.execute(
    text("""
        UPDATE users
        SET is_verified=1,
            otp=NULL,
            otp_expiry=NULL
        WHERE email=:email
    """),
    {
        "email": email
    }
)

        connection.commit()

        flash("Email verified successfully! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("verify.html")

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"].strip().lower()
        password = request.form["password"]

        connection = db.session

        result = connection.execute(
    text("""
        SELECT id, name, email, password, is_verified
        FROM users
        WHERE email=:email
    """),
    {
        "email": email
    }
)

        user = result.fetchone()

        if user is None:
            flash("Invalid email or password.", "danger")
            return redirect(url_for("login"))

        # Don't allow unverified users to log in
        if not user[4]:
            flash("Please verify your email first.", "warning")
            return redirect(url_for("login"))

        stored_hash = user[3]

        if bcrypt.checkpw(password.encode("utf-8"),
                          stored_hash.encode("utf-8")):

            session["user_id"] = user[0]
            session["user_name"] = user[1]
            session["user_email"] = user[2]

            flash(f"Welcome {user[1]}!", "success")

            return redirect(url_for("dashboard"))

        flash("Invalid email or password.", "danger")
        return redirect(url_for("login"))

    return render_template("login.html")


@app.route("/dashboard")
def dashboard():

    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("dashboard.html")


@app.route("/logout")
def logout():

    session.clear()

    flash("Logged out successfully.", "success")

    return redirect(url_for("login"))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)