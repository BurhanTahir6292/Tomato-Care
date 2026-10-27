"""
Tomato Care - Flask Backend Server & Web Application
Provides the /predict endpoint for the Flutter mobile app and a full modern Web UI for testing.
"""

import os
import sys
from flask import Flask, request, jsonify, send_from_directory, render_template
from flask_cors import CORS

# Add root folder to sys.path so modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.disease_detector import analyze_tomato_leaf, DISEASE_INFO

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0
CORS(app)  # Enable Cross-Origin Resource Sharing for Flutter & web clients


@app.route("/")
def index():
    """Renders the Tomato Care web dashboard."""
    return render_template("index.html")


@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "service": "Tomato Care Prediction Server",
        "version": "2.0.0",
        "port": 8000,
        "endpoints": {
            "predict": "/predict [POST]",
            "health": "/api/health [GET]",
            "diseases": "/api/diseases [GET]",
            "samples": "/api/samples [GET]"
        }
    })


@app.route("/api/diseases", methods=["GET"])
def get_diseases():
    """Returns database of tomato diseases and treatment recommendations."""
    return jsonify({
        "status": "success",
        "count": len(DISEASE_INFO),
        "diseases": DISEASE_INFO
    })


@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    """Authenticates admin users to access sensitive system details."""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    
    expected_admin_user = os.environ.get("ADMIN_USER", "admin")
    expected_admin_pass = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    if username == expected_admin_user and password == expected_admin_pass:
        return jsonify({
            "status": "success",
            "role": "admin",
            "message": "Admin authorization granted.",
            "token": "admin_auth_token_tomato_care",
            "admin": {
                "name": "System Administrator",
                "email": "admin@tomatocare.fyp",
                "role": "Executive Lead",
                "session_id": "TC-ADM-8842-SEC"
            }
        }), 200
    
    return jsonify({
        "status": "error",
        "message": "Invalid administrator credentials. Access restricted."
    }), 401


# In-memory alerts database for live demonstration
ADMIN_ALERTS = [
    {
        "id": "ALT-01",
        "title": "High Humidity Early Blight Advisory",
        "severity": "Warning",
        "region": "Multan & South Punjab",
        "timestamp": "Today, 08:30 AM",
        "message": "Elevated moisture index detected. Apply preventive copper-based spray on lower foliage."
    },
    {
        "id": "ALT-02",
        "title": "Whitefly Vector Outbreak Warning",
        "severity": "High",
        "region": "Central Greenhouses",
        "timestamp": "Yesterday, 04:15 PM",
        "message": "Whitefly activity linked with Yellow Leaf Curl Virus spread. Deploy yellow sticky traps immediately."
    },
    {
        "id": "ALT-03",
        "title": "Foliage Inspection Routine Scheduled",
        "severity": "Info",
        "region": "All Registered Sectors",
        "timestamp": "2 days ago",
        "message": "Weekly diagnostic camera scanning recommended before monsoon showers commence."
    }
]


@app.route("/api/admin/overview", methods=["GET"])
def admin_overview():
    """Returns real-time management metrics for the admin console."""
    return jsonify({
        "status": "success",
        "stats": {
            "registered_users": 1420,
            "active_alerts": len(ADMIN_ALERTS),
            "diagnoses_today": 328,
            "system_health": "Optimal",
            "model_version": "v2.4-Production",
            "inference_speed": "48ms"
        }
    })


@app.route("/api/admin/users", methods=["GET"])
def admin_users():
    """Returns registered users list matching FYP admin_users_show_page.dart."""
    users = [
        {"id": "USR-101", "name": "Dr. Sarah Ahmed", "email": "sarah.agri@tomatocare.pk", "role": "Lead Agronomist", "phone": "+92 300 1234567", "status": "Active"},
        {"id": "USR-102", "name": "Muhammad Tariq", "email": "tariq.farms@gmail.com", "role": "Commercial Grower", "phone": "+92 321 9876543", "status": "Active"},
        {"id": "USR-103", "name": "Ali Hassan", "email": "ali.greenhouse@hotmail.com", "role": "Greenhouse Specialist", "phone": "+92 333 4567890", "status": "Active"},
        {"id": "USR-104", "name": "Fatima Noor", "email": "fatima.noor@tomatocare.pk", "role": "Research Fellow", "phone": "+92 312 8765432", "status": "Active"},
        {"id": "USR-105", "name": "Zahid Mehmood", "email": "zahid.organic@yahoo.com", "role": "Smallholder Farmer", "phone": "+92 345 6789012", "status": "Active"}
    ]
    return jsonify({"status": "success", "users": users})


@app.route("/api/admin/alerts", methods=["GET", "POST"])
def admin_alerts():
    """Handles fetching and dispatching field disease alerts."""
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        title = data.get("title", "").strip()
        message = data.get("message", "").strip()
        severity = data.get("severity", "Warning").strip()
        region = data.get("region", "All Regions").strip()
        
        if not title or not message:
            return jsonify({"status": "error", "message": "Alert title and message required"}), 400
            
        new_alert = {
            "id": f"ALT-0{len(ADMIN_ALERTS) + 1}",
            "title": title,
            "severity": severity,
            "region": region,
            "timestamp": "Just now",
            "message": message
        }
        ADMIN_ALERTS.insert(0, new_alert)
        return jsonify({"status": "success", "alert": new_alert}), 201

    return jsonify({"status": "success", "alerts": ADMIN_ALERTS})


@app.route("/api/samples", methods=["GET"])
def get_samples():
    """Returns list of pre-generated sample leaf images."""
    samples = [
        {
            "id": "healthy",
            "name": "Healthy Tomato Leaf",
            "file": "sample_healthy.jpg",
            "url": "/static/samples/sample_healthy.jpg",
            "expected": "Healthy"
        },
        {
            "id": "early_blight",
            "name": "Early Blight Leaf",
            "file": "sample_early_blight.jpg",
            "url": "/static/samples/sample_early_blight.jpg",
            "expected": "Tomato Early Blight"
        },
        {
            "id": "yellow_curl",
            "name": "Yellow Leaf Curl Virus",
            "file": "sample_yellow_curl.jpg",
            "url": "/static/samples/sample_yellow_curl.jpg",
            "expected": "Tomato Yellow Leaf Curl Virus"
        }
    ]
    return jsonify({"samples": samples})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint consumed by Flutter app (index_page.dart) and Web UI.
    Receives multipart/form-data with file under key 'file'.
    Returns JSON:
    {
        "Affected": "Yes (35%)" or "No",
        "Disease": "Tomato Early Blight",
        "confidence": 0.94,
        "details": {...},
        "metrics": {...}
    }
    """
    # Check for file in request
    target_file = None
    if "file" in request.files:
        target_file = request.files["file"]
    elif len(request.files) > 0:
        # Fallback to first uploaded file in form
        target_file = next(iter(request.files.values()))

    if not target_file or target_file.filename == "":
        return jsonify({
            "error": "No file uploaded. Please send an image file with key 'file'."
        }), 400

    try:
        image_bytes = target_file.read()
        if not image_bytes:
            return jsonify({"error": "Uploaded file is empty."}), 400

        result = analyze_tomato_leaf(image_bytes)
        
        # If an error occurred in analysis
        if "error" in result:
            return jsonify(result), 400

        return jsonify(result), 200

    except Exception as e:
        return jsonify({
            "error": f"Server processing error: {str(e)}"
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"\n=========================================================")
    print(f"  [TOMATO CARE] Prediction Server & Web Dashboard")
    print(f"  Server running on http://127.0.0.1:{port}")
    print(f"  API endpoint:   http://127.0.0.1:{port}/predict")
    print(f"=========================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
