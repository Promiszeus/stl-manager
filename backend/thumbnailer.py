import subprocess
import sys
import os

def generate_thumbnail(stl_path, output_path):
    worker_script = os.path.join(os.path.dirname(__file__), "render_worker.py")
    try:
        result = subprocess.run([sys.executable, worker_script, str(stl_path), str(output_path)], 
                                timeout=15, capture_output=True)
        if result.returncode != 0:
            print(f"Error rendering {stl_path}: {result.stderr.decode('utf-8', errors='ignore')}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"Timeout rendering {stl_path} - it took longer than 15 seconds")
        return False
    except Exception as e:
        print(f"Failed to launch renderer for {stl_path}: {e}")
        return False
