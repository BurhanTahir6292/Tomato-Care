"""
Tomato Care - Project Server Runner
Starts the Flask prediction server and web dashboard on port 8000.
"""

import sys
import os

# Add current workspace directory to Python path
workspace_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, workspace_dir)

from server.app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = "0.0.0.0"
    
    print("\n" + "=" * 65)
    print("  [TOMATO CARE] AI SERVER & WEB DASHBOARD")
    print("=" * 65)
    print(f"  * Web Dashboard:  http://127.0.0.1:{port}")
    print(f"  * Predict API:    http://127.0.0.1:{port}/predict")
    print(f"  * Network Access: http://0.0.0.0:{port}")
    print("=" * 65)
    print("  Press Ctrl+C to stop the server at any time.\n")
    
    app.run(host=host, port=port, debug=False)
