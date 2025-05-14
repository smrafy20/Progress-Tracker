from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import redis
import datetime  # Added for timestamp
import json

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # For session management
CORS(app, supports_credentials=True)

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    name = data.get('name')
    role = data.get('role')
    if not name or role not in ['instructor', 'student']:
        return jsonify({'success': False, 'message': 'Invalid login'}), 400
    session['name'] = name
    session['role'] = role
    return jsonify({'success': True, 'role': role})

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('name', None)
    session.pop('role', None)
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/upload', methods=['POST'])
def upload_video():
    if session.get('role') != 'instructor':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        # Save video metadata in Redis including timestamp
        now = datetime.datetime.now().isoformat()
        video_data = {'filetype': 'video', 'last_updated': now}
        r.hset('videos', filename, json.dumps(video_data))  # Store as JSON string
        return jsonify({'success': True, 'filename': filename, 'filetype': 'video', 'last_updated': now})
    return jsonify({'success': False, 'message': 'Invalid file type'}), 400

@app.route('/api/videos', methods=['GET'])
def list_videos():
    videos_raw = r.hgetall('videos')
    videos_list = []
    for k, v_json in videos_raw.items():
        try:
            v_data = json.loads(v_json)  # Parse JSON string
            videos_list.append({'filename': k, 'filetype': v_data.get('filetype'), 'last_updated': v_data.get('last_updated')})
        except json.JSONDecodeError:
            # Handle cases where data might not be a valid JSON (e.g., old data)
            videos_list.append({'filename': k, 'filetype': 'unknown', 'last_updated': 'N/A'})  # Fallback
    return jsonify(videos_list)

@app.route('/api/video/<filename>', methods=['DELETE'])
def delete_video_file(filename):
    if session.get('role') != 'instructor':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    # Secure the filename before using it in file paths
    secure_name = secure_filename(filename)
    if not secure_name:  # or if secure_name != filename if you want to be very strict
        return jsonify({'success': False, 'message': 'Invalid filename'}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)

    try:
        if os.path.exists(filepath):
            os.remove(filepath)
        else:
            # If file doesn't exist, it might have been deleted manually.
            # We can still proceed to remove it from Redis.
            pass  # Or return a specific message if needed

        # Remove from Redis
        result = r.hdel('videos', secure_name)
        if result > 0:  # hdel returns the number of fields that were removed
            return jsonify({'success': True, 'message': f'{secure_name} deleted successfully'})
        else:
            # This could mean the video was not in Redis, possibly already deleted
            return jsonify({'success': False, 'message': f'Could not find {secure_name} in database, but removed from filesystem if it existed.'}), 404

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/get_session_info', methods=['GET'])
def get_session_info():
    if 'name' in session and 'role' in session:
        return jsonify({'success': True, 'name': session['name'], 'role': session['role']})
    else:
        return jsonify({'success': False, 'message': 'No active session'}), 401

@app.route('/api/progress/<student>/<filename>', methods=['GET', 'POST'])
def progress(student, filename):
    key = f'progress:{student}:{filename}'
    if request.method == 'GET':
        progress = r.get(key) or 0
        return jsonify({'progress': float(progress)})
    else:
        data = request.json
        progress = data.get('progress', 0)
        r.set(key, progress)
        return jsonify({'success': True})

@app.route('/uploads/<filename>')
def serve_video(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/')
def root():
    return send_from_directory('.', 'login.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True)