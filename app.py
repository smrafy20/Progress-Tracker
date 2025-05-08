from flask import Flask, request, jsonify
from flask_cors import CORS # Import CORS
import redis

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Connect to your local Redis server
# Make sure your Redis server is running on the default port 6379
try:
    r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    r.ping()
    print("Connected to Redis!")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    # You might want to exit or handle this more gracefully
    r = None

# Helper function to get video ID from request
def get_video_id():
    video_id = request.args.get('videoId')
    if not video_id:
        # Fallback for older script version or direct calls if needed
        # For this project, 'TP.mp4' is hardcoded in the JS baseStorageKey
        video_id = "TP.mp4" 
    return video_id

@app.route('/api/progress', methods=['GET'])
def get_progress():
    if not r:
        return jsonify({"error": "Redis not connected"}), 500
    
    video_id = get_video_id()
    time_key = f"video:{video_id}:time"
    max_progress_key = f"video:{video_id}:maxProgress"
    
    saved_time = r.get(time_key)
    saved_max_progress = r.get(max_progress_key)
    
    return jsonify({
        "currentTime": float(saved_time) if saved_time else 0,
        "maxProgress": float(saved_max_progress) if saved_max_progress else 0
    })

@app.route('/api/progress', methods=['POST'])
def save_progress():
    if not r:
        return jsonify({"error": "Redis not connected"}), 500
        
    video_id = get_video_id()
    data = request.json
    current_time = data.get('currentTime')
    max_progress = data.get('maxProgress')

    if current_time is not None and max_progress is not None:
        time_key = f"video:{video_id}:time"
        max_progress_key = f"video:{video_id}:maxProgress"
        
        r.set(time_key, current_time)
        r.set(max_progress_key, max_progress)
        return jsonify({"message": "Progress saved"}), 200
    return jsonify({"error": "Invalid data"}), 400

@app.route('/api/progress', methods=['DELETE'])
def delete_progress():
    if not r:
        return jsonify({"error": "Redis not connected"}), 500
        
    video_id = get_video_id()
    time_key = f"video:{video_id}:time"
    max_progress_key = f"video:{video_id}:maxProgress"
    
    r.delete(time_key)
    r.delete(max_progress_key)
    return jsonify({"message": "Progress deleted"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000) # Runs on http://localhost:5000