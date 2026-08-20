"""
Production WSGI Server Entry Point.
Runs Waitress on Windows or Gunicorn on Linux/Cloud automatically.
"""

import os
import sys
from app import app

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")

    if sys.platform.startswith("win"):
        # Windows production server (Waitress)
        from waitress import serve
        print(f"[PRODUCTION SERVER] Serving ResuMatch AI on http://{host}:{port} via Waitress WSGI")
        serve(app, host=host, port=port, threads=4)
    else:
        # Linux / Unix production server (Gunicorn / Werkzeug fallback)
        print(f"[PRODUCTION SERVER] Starting on http://{host}:{port}")
        app.run(host=host, port=port, debug=False)
