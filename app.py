from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import redis
import datetime  # Added for timestamp
import json

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # For session management
# Configure CORS to properly handle credentials
CORS(app, supports_credentials=True, origins=['http://127.0.0.1:5000', 'http://localhost:5000'])

# Additional session configuration for better security and consistency
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS

UPLOAD_FOLDER = 'uploads'
PDF_UPLOAD_FOLDER = 'uploads_pdf' # New folder for PDFs
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'mkv'}
ALLOWED_PDF_EXTENSIONS = {'pdf'} # Allowed extensions for PDFs
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['PDF_UPLOAD_FOLDER'] = PDF_UPLOAD_FOLDER # Add to app config

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PDF_UPLOAD_FOLDER): # Create PDF upload folder
    os.makedirs(PDF_UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_pdf_file(filename): # New function for PDF files
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_PDF_EXTENSIONS

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
    print(f"Video upload - Session data: {dict(session)}")  # Debug: print session data
    print(f"Video upload - Session role: {session.get('role')}")  # Debug: print role
    print(f"Video upload - Session name: {session.get('name')}")  # Debug: print name
    
    if session.get('role') != 'instructor':
        print(f"Video upload authorization failed. Role in session: {session.get('role')}")  # Debug
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    instructor_name = session.get('name')
    if not instructor_name:
        print("Video upload - Instructor name not found in session")  # Debug
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
            'instructor_name': instructor_name
        }
        r.hset('videos', filename, json.dumps(video_data))
        return jsonify({'success': True, 'filename': filename, 'filetype': 'video', 'last_updated': now, 'instructor_name': instructor_name})
    return jsonify({'success': False, 'message': 'Invalid file type'}), 400

@app.route('/api/upload_pdf', methods=['POST']) # New endpoint for PDF uploads
def upload_pdf():
    try:
        print(f"Session data: {dict(session)}")  # Debug: print session data
        print(f"Session role: {session.get('role')}")  # Debug: print role
        print(f"Session name: {session.get('name')}")  # Debug: print name
        
        if session.get('role') != 'instructor':
            print(f"Authorization failed. Role in session: {session.get('role')}")  # Debug
            return jsonify({'success': False, 'message': 'Unauthorized - Please login as instructor'}), 403
        instructor_name = session.get('name')
        if not instructor_name:
            print("Instructor name not found in session")  # Debug
            return jsonify({'success': False, 'message': 'Instructor name not found in session. Please login again.'}), 401

        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file part'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No selected file'}), 400
        
        print(f"Attempting to upload file: {file.filename}")  # Debug
        
        if file and allowed_pdf_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['PDF_UPLOAD_FOLDER'], filename)
            
            # Check if file already exists and handle accordingly
            if os.path.exists(filepath):
                print(f"File {filename} already exists, will overwrite")  # Debug
            
            file.save(filepath)
            print(f"File saved to: {filepath}")  # Debug
            
            now = datetime.datetime.now().isoformat()
            pdf_data = {
                'filetype': 'pdf',
                'last_updated': now,
                'instructor_name': instructor_name
            }
            r.hset('pdfs', filename, json.dumps(pdf_data)) # Store in a new 'pdfs' hash
            print(f"PDF data saved to Redis for {filename}")  # Debug
            
            return jsonify({'success': True, 'filename': filename, 'filetype': 'pdf', 'last_updated': now, 'instructor_name': instructor_name})
        else:
            print(f"File type not allowed for: {file.filename}")  # Debug
            return jsonify({'success': False, 'message': 'Invalid file type, only PDF allowed'}), 400
            
    except Exception as e:
        print(f"Error in upload_pdf: {str(e)}")  # Debug
        return jsonify({'success': False, 'message': f'Server error: {str(e)}'}), 500

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

@app.route('/api/pdfs', methods=['GET']) # New endpoint to list PDFs
def list_pdfs():
    pdfs_raw = r.hgetall('pdfs')
    pdfs_list = []
    current_role = session.get('role')
    current_instructor_name = session.get('name')

    for k, v_json in pdfs_raw.items():
        try:
            v_data = json.loads(v_json)
            pdf_item = {
                'filename': k,
                'filetype': v_data.get('filetype'),
                'last_updated': v_data.get('last_updated'),
                'instructor_name': v_data.get('instructor_name')
            }
            if current_role == 'instructor':
                if v_data.get('instructor_name') == current_instructor_name:
                    pdfs_list.append(pdf_item)
            else: # For students or other roles, show all pdfs
                pdfs_list.append(pdf_item)
        except json.JSONDecodeError:
            if current_role != 'instructor':
                 pdfs_list.append({'filename': k, 'filetype': 'unknown', 'last_updated': 'N/A', 'instructor_name': 'Unknown'})
    return jsonify(pdfs_list)

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

@app.route('/api/pdf/<filename>', methods=['DELETE']) # New endpoint to delete a PDF
def delete_pdf_file(filename):
    if session.get('role') != 'instructor':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    current_instructor_name = session.get('name')
    if not current_instructor_name:
        return jsonify({'success': False, 'message': 'Instructor name not found in session.'}), 401

    secure_name = secure_filename(filename)
    if not secure_name:
        return jsonify({'success': False, 'message': 'Invalid filename'}), 400

    pdf_json = r.hget('pdfs', secure_name)
    if not pdf_json:
        filepath_check = os.path.join(app.config['PDF_UPLOAD_FOLDER'], secure_name)
        if os.path.exists(filepath_check):
             return jsonify({'success': False, 'message': f'{secure_name} not found in database. Cannot confirm ownership.'}), 404
        return jsonify({'success': False, 'message': f'{secure_name} not found in database or filesystem.'}), 404
    try:
        pdf_data = json.loads(pdf_json)
        owner_instructor = pdf_data.get('instructor_name')

        if owner_instructor != current_instructor_name:
            return jsonify({'success': False, 'message': 'Unauthorized. You do not own this PDF.'}), 403

        filepath = os.path.join(app.config['PDF_UPLOAD_FOLDER'], secure_name)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        result = r.hdel('pdfs', secure_name)
        if result > 0:
            return jsonify({'success': True, 'message': f'{secure_name} deleted successfully.'})
        else:
            # This case implies a race condition or unexpected Redis state.
            fs_status_message = "File on filesystem might have been removed."
            if os.path.exists(filepath): 
                fs_status_message = "File on filesystem still exists."
            return jsonify({'success': False, 'message': f'Error: {secure_name} not found in database for deletion. {fs_status_message}'}), 500
    except json.JSONDecodeError:
        return jsonify({'success': False, 'message': 'Error decoding PDF data from database.'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/get_session_info', methods=['GET'])
def get_session_info():
    print(f"Session check - Session data: {dict(session)}")  # Debug
    if 'name' in session and 'role' in session:
        return jsonify({'success': True, 'name': session['name'], 'role': session['role']})
    else:
        return jsonify({'success': False, 'message': 'No active session'}), 401

@app.route('/api/check_auth', methods=['GET'])  # New endpoint to check authentication
def check_auth():
    print(f"Auth check - Session data: {dict(session)}")  # Debug
    if session.get('role') == 'instructor':
        return jsonify({'success': True, 'message': 'Authorized as instructor', 'name': session.get('name')})
    else:
        return jsonify({'success': False, 'message': 'Not authorized as instructor', 'current_role': session.get('role')}), 403

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

@app.route('/api/progress_pdf/<student>/<filename>', methods=['GET', 'POST']) # New endpoint for PDF progress
def pdf_progress(student, filename):
    # Key for storing current page and max percentage progress for a student and a PDF
    # e.g., progress_pdf:student_name:example.pdf -> {"currentPage": 5, "maxProgressPercent": 50}
    key = f'progress_pdf:{student}:{secure_filename(filename)}'
    if request.method == 'GET':
        progress_data_json = r.get(key)
        if progress_data_json:
            progress_data = json.loads(progress_data_json)
            return jsonify({
                'currentPage': int(progress_data.get('currentPage', 1)),
                'maxProgressPercent': float(progress_data.get('maxProgressPercent', 0))
            })
        return jsonify({'currentPage': 1, 'maxProgressPercent': 0}) # Default if no progress found
    else: # POST
        data = request.json
        current_page = data.get('currentPage')
        max_progress_percent = data.get('maxProgressPercent')
        if current_page is not None and max_progress_percent is not None:
            r.set(key, json.dumps({'currentPage': current_page, 'maxProgressPercent': max_progress_percent}))
            return jsonify({'success': True})
        return jsonify({'success': False, 'message': 'Missing currentPage or maxProgressPercent'}), 400

@app.route('/uploads/<filename>')
def serve_video(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads_pdf/<filename>') # New route to serve PDF files
def serve_pdf(filename):
    # The filename from the URL is already URL-decoded by Flask.
    # It should correspond to the filename stored on the disk (which was secured during upload).
    # No need to call secure_filename() again here.
    return send_from_directory(app.config['PDF_UPLOAD_FOLDER'], filename)

@app.route('/')
def root():
    return send_from_directory('.', 'login.html')

@app.route('/<path:path>')
def static_proxy(path):
    if path == 'pdf_tracker.html': # Serve pdf_tracker.html
        return send_from_directory('.', 'pdf_tracker.html')
    return send_from_directory('.', path)

if __name__ == '__main__':
    app.run(debug=True)