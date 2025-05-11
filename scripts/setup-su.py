import tkinter as tk
from tkinter import (
    messagebox,
    scrolledtext,
)
import jwt
import requests
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import os

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
REQUEST_URL = os.getenv("REQUEST_URL")

print(f"DEBUG: JWT_SECRET_KEY = '{JWT_SECRET_KEY}' (Type: {type(JWT_SECRET_KEY)})")
print(f"DEBUG: JWT_ALGORITHM = '{JWT_ALGORITHM}' (Type: {type(JWT_ALGORITHM)})")
print(f"DEBUG: REQUEST_URL = '{REQUEST_URL}' (Type: {type(REQUEST_URL)})")


def log_message(message, color="white"):
    """Appends a message to the result_text widget with specified color."""
    result_text.config(state=tk.NORMAL)  # Enable editing
    result_text.insert(tk.END, message + "\n", color)  # Insert message with color tag
    result_text.config(state=tk.DISABLED)  # Disable editing
    result_text.see(tk.END)  # Scroll to the end to make the latest message visible


def generate_and_send_jwt():
    email = email_entry.get()
    password = password_entry.get()

    result_text.config(state=tk.NORMAL)
    result_text.delete(1.0, tk.END)
    result_text.config(state=tk.DISABLED)

    log_message(f"Attempting to generate JWT for: {email}", "cyan")

    if not email or not password:
        messagebox.showerror("Input Error", "Email and Password cannot be empty.")
        log_message("Error: Email and Password cannot be empty.", "red")
        return

    if not JWT_SECRET_KEY or not JWT_ALGORITHM or not REQUEST_URL:
        missing_vars = []
        if not JWT_SECRET_KEY:
            missing_vars.append("JWT_SECRET_KEY")
        if not JWT_ALGORITHM:
            missing_vars.append("JWT_ALGORITHM")
        if not REQUEST_URL:
            missing_vars.append("REQUEST_URL")
        error_message = f"Error: Missing environment variable(s): {', '.join(missing_vars)}. Please check your .env file."
        log_message(error_message, "red")
        messagebox.showerror("Configuration Error", error_message)
        return

    try:
        payload = {
            "email": email,
            "password": password,
            "iat": datetime.now(timezone.utc),  # Issued at time
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),  # Expiration time
        }
        log_message("JWT Payload created.", "white")

        encoded_jwt = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        log_message(f"JWT Encoded: {encoded_jwt[:30]}...", "white")  # Show a snippet

        headers = {
            "Content-Type": "application/json",
        }

        if REQUEST_URL.endswith("/"):
            full_request_url = REQUEST_URL + encoded_jwt
        else:
            full_request_url = REQUEST_URL + "/" + encoded_jwt

        log_message(f"Sending request to: {full_request_url}", "white")

        response = requests.post(
            full_request_url,
            headers=headers,
            timeout=10,
        )

        if response.status_code == 201:
            log_message(f"Success! Status: {response.status_code}", "green")
            try:
                response_data = response.json()  # Try to parse JSON response
                log_message(f"Response: {response_data}", "green")
            except requests.exceptions.JSONDecodeError:
                log_message(f"Response (not JSON): {response.text}", "green")
            messagebox.showinfo(
                "Success", f"Request sent. Status Code: {response.status_code}"
            )
        else:
            log_message(f"Failed! Status: {response.status_code}", "red")
            try:
                error_data = response.json()  # Try to parse JSON error response
                log_message(f"Error Response: {error_data}", "red")
                messagebox.showerror(
                    "Request Failed",
                    f"Status Code: {response.status_code}\nDetails: {error_data.get('error', response.text)}",
                )
            except requests.exceptions.JSONDecodeError:
                log_message(f"Error Response (not JSON): {response.text}", "red")
                messagebox.showerror(
                    "Request Failed",
                    f"Status Code: {response.status_code}\nResponse: {response.text}",
                )

    except jwt.ExpiredSignatureError:
        log_message("JWT Error: Token has expired.", "red")
        messagebox.showerror("JWT Error", "Token has expired.")
    except jwt.InvalidTokenError as e:
        log_message(f"JWT Error: Invalid token - {str(e)}", "red")
        messagebox.showerror("JWT Error", f"Invalid token: {e}")
    except requests.exceptions.ConnectionError as e:
        log_message(f"Request Error: Connection failed - {str(e)}", "red")
        messagebox.showerror(
            "Request Error",
            f"Connection failed: {e}\nIs the server at {REQUEST_URL} running?",
        )
    except requests.exceptions.Timeout as e:
        log_message(f"Request Error: Request timed out - {str(e)}", "red")
        messagebox.showerror("Request Error", f"Request timed out: {e}")
    except requests.exceptions.RequestException as e:
        log_message(f"Request Error: HTTP Request failed - {str(e)}", "red")
        messagebox.showerror("Request Error", f"HTTP Request failed: {e}")
    except Exception as e:
        # Catch any other unexpected errors
        log_message(f"Error: An unexpected error occurred - {str(e)}", "red")
        messagebox.showerror("Error", f"An unexpected error occurred: {e}")


# --- GUI Setup ---
window = tk.Tk()
window.title("Super Admin Client - CLEO SPA")
window.geometry("700x450")  # Increased window size for better log visibility

# Define fonts
entry_font = ("Arial", 14)
terminal_font = ("Consolas", 10)  # Monospaced font for terminal-like text area

# Frame for input fields
input_frame = tk.Frame(window, padx=20, pady=20)
input_frame.pack(pady=10, fill=tk.X)

# Email input
tk.Label(input_frame, text="Email:", font=entry_font).grid(
    row=0, column=0, padx=10, pady=10, sticky=tk.W
)
email_entry = tk.Entry(input_frame, width=40, font=entry_font)
email_entry.grid(row=0, column=1, padx=10, pady=10)
email_entry.insert(0, "test@example.com")  # Default value

# Password input
tk.Label(input_frame, text="Password:", font=entry_font).grid(
    row=1, column=0, padx=10, pady=10, sticky=tk.W
)
password_entry = tk.Entry(
    input_frame, width=40, show="*", font=entry_font
)  # show="*" hides password
password_entry.grid(row=1, column=1, padx=10, pady=10)
password_entry.insert(0, "password123")  # Default value

# Submit button
submit_button = tk.Button(
    window,
    text="Sign Up / Send Request",  # Changed button text for clarity
    command=generate_and_send_jwt,
    width=35,
    height=2,
    font=("Arial", 12),
    bg="#4CAF50",  # Green background
    fg="white",  # White text
    relief=tk.RAISED,
    bd=3,
)
submit_button.pack(pady=20)

# Scrolled text widget for logging messages (like a terminal)
result_text = scrolledtext.ScrolledText(
    window,
    wrap=tk.WORD,  # Wrap text at word boundaries
    font=terminal_font,
    height=10,  # Number of lines visible
    bg="black",  # Background color
    fg="lightgreen",  # Default foreground text color
    insertbackground="white",  # Cursor color
    relief=tk.SUNKEN,
    bd=2,
)
result_text.pack(
    pady=(0, 10), padx=20, fill=tk.BOTH, expand=True
)  # Fill available space

# Define color tags for logging
result_text.tag_config("red", foreground="#FF6B6B")  # A softer red
result_text.tag_config("green", foreground="#76FF03")  # A vibrant green
result_text.tag_config("cyan", foreground="#4DD0E1")  # A nice cyan
result_text.tag_config("white", foreground="white")  # For general messages
result_text.tag_config("orange", foreground="#FFB74D")  # For warnings or other info

result_text.config(state=tk.DISABLED)  # Make it read-only initially

# --- Run the GUI ---
if __name__ == "__main__":
    # Initial log message
    log_message(
        "Application started. Please enter credentials and send request.", "orange"
    )
    log_message(
        "Ensure your .env file is configured with JWT_SECRET_KEY, JWT_ALGORITHM, and REQUEST_URL.",
        "orange",
    )
    window.mainloop()
