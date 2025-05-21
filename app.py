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
    instructor_name = session.get('name')
    if not instructor_name:
        return jsonify({'success': False, 'message': 'Instructor name not found in session.'}), 401

    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        # Save video metadata in Redis including timestamp and instructor name
        now = datetime.datetime.now().isoformat()
        video_data = {
            'filetype': 'video',
            'last_updated': now,
            'instructor_name': instructor_name  # Added instructor name
        }
        r.hset('videos', filename, json.dumps(video_data))  # Store as JSON string
        return jsonify({'success': True, 'filename': filename, 'filetype': 'video', 'last_updated': now, 'instructor_name': instructor_name})
    return jsonify({'success': False, 'message': 'Invalid file type'}), 400

@app.route('/api/videos', methods=['GET'])
def list_videos():
    videos_raw = r.hgetall('videos')
    videos_list = []
    
    current_role = session.get('role')
    current_instructor_name = session.get('name')

    for k, v_json in videos_raw.items():
        try:
            v_data = json.loads(v_json)  # Parse JSON string
            video_item = {
                'filename': k,
                'filetype': v_data.get('filetype'),
                'last_updated': v_data.get('last_updated'),
                'instructor_name': v_data.get('instructor_name') # Include instructor name
            }
            
            if current_role == 'instructor':
                if v_data.get('instructor_name') == current_instructor_name:
                    videos_list.append(video_item)
            else: # For students or other roles, show all videos
                videos_list.append(video_item)
                
        except json.JSONDecodeError:
            # Handle cases where data might not be a valid JSON (e.g., old data)
            # These videos won't have an instructor_name and won't show for specific instructors unless logic is added
            if current_role != 'instructor': # Only show to non-instructors if malformed
                videos_list.append({'filename': k, 'filetype': 'unknown', 'last_updated': 'N/A', 'instructor_name': 'Unknown'})
    return jsonify(videos_list)

@app.route('/api/video/<filename>', methods=['DELETE'])
def delete_video_file(filename):
    if session.get('role') != 'instructor':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    current_instructor_name = session.get('name')
    if not current_instructor_name:
        return jsonify({'success': False, 'message': 'Instructor name not found in session.'}), 401

    secure_name = secure_filename(filename)
    if not secure_name:
        return jsonify({'success': False, 'message': 'Invalid filename'}), 400

    video_json = r.hget('videos', secure_name)
    if not video_json:
        # If not in Redis, check filesystem and attempt to inform, but likely already gone or never tracked
        filepath_check = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
        if os.path.exists(filepath_check):
            # Potentially an untracked file, or Redis entry was lost.
            # For safety, don't delete if not owned, but it's not in Redis to check ownership.
            # Or, decide if instructors can delete any file in the folder if not tracked.
            # Current logic: if not in Redis, can't confirm ownership.
             return jsonify({'success': False, 'message': f'{secure_name} not found in database. Cannot confirm ownership.'}), 404
        return jsonify({'success': False, 'message': f'{secure_name} not found in database or filesystem.'}), 404

    try:
        video_data = json.loads(video_json)
        owner_instructor = video_data.get('instructor_name')

        if owner_instructor != current_instructor_name:
            return jsonify({'success': False, 'message': 'Unauthorized. You do not own this video.'}), 403

        filepath = os.path.join(app.config['UPLOAD_FOLDER'], secure_name)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        result = r.hdel('videos', secure_name)
        if result > 0:
            return jsonify({'success': True, 'message': f'{secure_name} deleted successfully from database and filesystem (if present).'})
        else:
            # This implies the key, previously confirmed by r.hget, was not found by r.hdel.
            # This could be due to a rapid concurrent deletion or an unexpected Redis state change.
            fs_status_message = "File on filesystem might have been removed in this attempt."
            # Check current state of file, as os.remove might have been skipped if file didn't exist initially,
            # or it might have failed silently if not caught by the broader exception handler (unlikely).
            if os.path.exists(filepath): 
                fs_status_message = "File on filesystem still exists."
            elif not os.path.exists(filepath) and not os.path.join(app.config['UPLOAD_FOLDER'], secure_name) == filepath :
                 # This condition is a bit complex, if filepath was already checked and os.remove was called
                 # we assume it was removed or failed (which would be an exception).
                 # This re-check is mostly for the message accuracy.
                 pass


            return jsonify({'success': False, 'message': f'Error: {secure_name} was not found in database for deletion, though it was expected. {fs_status_message}'}), 500

    except json.JSONDecodeError:
        return jsonify({'success': False, 'message': 'Error decoding video data from database.'}), 500
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