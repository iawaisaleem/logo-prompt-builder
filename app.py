from flask import Flask, render_template, request, redirect, url_for, flash
from config import Config
from database import mysql
from flask import session
from flask_mail import Mail
from email_service import mail
from otp_service import generate_otp, get_otp_expiry
from email_service import send_otp_email 
import bcrypt

app = Flask(__name__)
app.config.from_object(Config)

mysql.init_app(app)
mail.init_app(app)


@app.route("/prompt-builder")
def prompt_builder():

    if "user_id" not in session:
        return redirect(url_for("login"))

    return render_template("prompt_builder.html")

@app.route("/save-prompt", methods=["POST"])
def save_prompt():

    if "user_id" not in session:
        return {"success": False}

    prompt = request.form["prompt"]

    cursor = mysql.connection.cursor()

    cursor.execute("""
        INSERT INTO prompts(user_id,prompt)
        VALUES(%s,%s)
    """, (
        session["user_id"],
        prompt
    ))

    mysql.connection.commit()
    cursor.close()

    return {"success": True}

@app.route("/get-prompts")
def get_prompts():

    if "user_id" not in session:
        return []

    cursor=mysql.connection.cursor()

    cursor.execute("""
        SELECT
            id,
            prompt,
            created_at
        FROM prompts
        WHERE user_id=%s
        ORDER BY created_at DESC
    """,(session["user_id"],))

    rows=cursor.fetchall()

    cursor.close()

    prompts=[]

    for row in rows:

        prompts.append({

            "id":row[0],
            "prompt":row[1],
            "created_at":str(row[2]),
            "name":"Generated Prompt"

        })

    return prompts

@app.route("/clear-prompts", methods=["POST"])
def clear_prompts():

    if "user_id" not in session:
        return {"success":False}

    cursor=mysql.connection.cursor()

    cursor.execute("""

        DELETE FROM prompts

        WHERE user_id=%s

    """,(session["user_id"],))

    mysql.connection.commit()

    cursor.close()

    return {"success":True}

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

        cursor = mysql.connection.cursor()

        # Check if email already exists
        cursor.execute(
            "SELECT id FROM users WHERE email=%s",
            (email,)
        )

        existing_user = cursor.fetchone()

        if existing_user:
            cursor.close()
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
        cursor.execute("""
        INSERT INTO users
        (name, email, password, otp, otp_expiry)
        VALUES(%s, %s, %s, %s, %s)
        """, (
        name,
        email,
        hashed_password,
        otp,
        otp_expiry
        ))

        mysql.connection.commit()
        cursor.close()

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

        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT otp, otp_expiry
            FROM users
            WHERE email=%s
        """, (email,))

        user = cursor.fetchone()

        if not user:
            cursor.close()
            flash("User not found.", "danger")
            return redirect(url_for("verify"))

        saved_otp = user[0]
        expiry = user[1]

        from datetime import datetime

        if datetime.now() > expiry:
            cursor.close()
            flash("OTP has expired.", "danger")
            return redirect(url_for("verify"))

        if otp != saved_otp:
            cursor.close()
            flash("Invalid OTP.", "danger")
            return redirect(url_for("verify"))

        cursor.execute("""
            UPDATE users
            SET is_verified=1,
                otp=NULL,
                otp_expiry=NULL
            WHERE email=%s
        """, (email,))

        mysql.connection.commit()
        cursor.close()

        flash("Email verified successfully! Please log in.", "success")
        return redirect(url_for("login"))

    return render_template("verify.html")

@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "POST":

        email = request.form["email"].strip().lower()
        password = request.form["password"]

        cursor = mysql.connection.cursor()

        cursor.execute("""
            SELECT id, name, email, password, is_verified
            FROM users
            WHERE email=%s
        """, (email,))

        user = cursor.fetchone()
        cursor.close()

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
    app.run(debug=True)