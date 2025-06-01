# Training PRO - Learning Management System

A comprehensive Learning Management System (LMS) built with Flask that supports multiple file formats including videos, PDFs, DOCX documents, PowerPoint presentations, and audio files with progress tracking.

## Features

- 🎥 **Video Learning** - Watch videos with progress tracking
- 📄 **PDF Viewer** - Read PDFs with page-by-page progress tracking
- 📝 **DOCX Documents** - View Word documents with scroll-based progress
- 📊 **PowerPoint Presentations** - Navigate through PPT slides with progress tracking
- 🎵 **Audio Learning** - Listen to audio files with playback progress
- 👥 **Multi-Role Support** - Separate dashboards for instructors and students
- 🏫 **Course Management** - Organize content by courses
- 📈 **Progress Tracking** - Detailed progress analytics for all content types
- 🔐 **Authentication** - Secure login system with session management

## Prerequisites

### Windows Installation

#### Required Software:
1. **Python 3.8+** - [Download from python.org](https://www.python.org/downloads/)
2. **Redis Server** - [Download Redis for Windows](https://github.com/microsoftarchive/redis/releases)
3. **LibreOffice** - [Download LibreOffice](https://www.libreoffice.org/download/download/)

#### Python Dependencies:
```bash
pip install flask
pip install redis
pip install python-pptx
pip install Pillow
pip install werkzeug
```

#### LibreOffice Setup (Windows):
1. Download and install LibreOffice from the official website
2. Add LibreOffice to your system PATH:
   - Default installation path: `C:\Program Files\LibreOffice\program\`
   - Add this path to your Windows Environment Variables
3. Verify installation by running: `soffice --version` in Command Prompt

#### Redis Setup (Windows):
1. Download Redis for Windows from the GitHub releases
2. Extract and run `redis-server.exe`
3. Keep Redis running in the background while using the application

### Linux Installation

#### System Dependencies:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3 python3-pip redis-server libreoffice

# CentOS/RHEL/Fedora
sudo yum install python3 python3-pip redis libreoffice
# or for newer versions:
sudo dnf install python3 python3-pip redis libreoffice
```

#### Python Dependencies:
```bash
pip3 install flask redis python-pptx Pillow werkzeug
```

#### LibreOffice Setup (Linux):
LibreOffice is **REQUIRED** for PowerPoint file processing. The application uses LibreOffice to convert PPT/PPTX files to images.

1. **Install LibreOffice:**
   ```bash
   # Ubuntu/Debian
   sudo apt install libreoffice
   
   # CentOS/RHEL/Fedora
   sudo yum install libreoffice
   # or
   sudo dnf install libreoffice
   ```

2. **Verify Installation:**
   ```bash
   soffice --version
   ```

3. **Important Notes:**
   - LibreOffice must be accessible from the command line
   - The application uses `soffice --headless` command to convert presentations
   - Make sure LibreOffice is in your system PATH
   - For headless servers, you might need additional packages:
     ```bash
     sudo apt install libreoffice-java-common
     ```

#### Redis Setup (Linux):
```bash
# Start Redis service
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd training-pro
```

### 2. Install Dependencies
```bash
# Windows
pip install -r requirements.txt

# Linux
pip3 install -r requirements.txt
```

### 3. Create Upload Directories
The application will automatically create these directories, but you can create them manually:
```bash
mkdir uploads uploads_pdf uploads_docx uploads_audio uploads_ppt_images
```

### 4. Start Redis Server
```bash
# Windows
redis-server.exe

# Linux
sudo systemctl start redis-server
```

### 5. Run the Application
```bash
# Windows
python app.py

# Linux
python3 app.py
```

The application will be available at: `http://localhost:5000`

## Usage Workflow

### For Instructors:
1. **Login** as instructor at `http://localhost:5000`
2. **Create Courses** using the "Create New Course" button
3. **Upload Content** - Navigate to a course and upload:
   - Videos (MP4, AVI, MOV)
   - PDFs
   - DOCX documents
   - PowerPoint presentations (PPT/PPTX)
   - Audio files (MP3, WAV)
4. **Monitor Progress** - View student progress for each file

### For Students:
1. **Login** as student at `http://localhost:5000`
2. **Select Course** from the available courses
3. **Access Content** - View and interact with:
   - Watch videos with progress tracking
   - Read PDFs with page navigation
   - View DOCX documents with scroll tracking
   - Navigate PowerPoint slides
   - Listen to audio with playback progress
4. **Track Progress** - Your progress is automatically saved

## File Structure
```
training-pro/
├── app.py                 # Main Flask application
├── uploads/              # Video files
├── uploads_pdf/          # PDF files
├── uploads_docx/         # DOCX files
├── uploads_audio/        # Audio files
├── uploads_ppt_images/   # PPT slide images
├── static/               # CSS, JS, and other static files
├── templates/            # HTML templates (if using Flask templates)
├── *.html               # Frontend HTML files
├── *.css                # Stylesheets
├── *.js                 # JavaScript files
└── README.md            # This file
```

## Troubleshooting

### Common Issues:

1. **Redis Connection Error:**
   - Ensure Redis server is running
   - Check if Redis is accessible on default port 6379

2. **LibreOffice Not Found:**
   - Verify LibreOffice installation: `soffice --version`
   - Add LibreOffice to system PATH
   - On Linux: `sudo apt install libreoffice`

3. **PowerPoint Files Not Processing:**
   - Ensure LibreOffice is properly installed
   - Check if the application has write permissions to `uploads_ppt_images/`
   - Verify PPT file is not corrupted

4. **File Upload Issues:**
   - Check file size limits in `app.py`
   - Ensure upload directories exist and have proper permissions
   - Verify file format is supported

5. **Progress Not Saving:**
   - Check Redis connection
   - Ensure student is properly logged in
   - Verify session management is working

### Linux-Specific Issues:

1. **Permission Denied for Upload Directories:**
   ```bash
   sudo chown -R $USER:$USER uploads*
   chmod 755 uploads*
   ```

2. **LibreOffice Headless Mode Issues:**
   ```bash
   # Install additional packages
   sudo apt install libreoffice-java-common
   
   # Test headless conversion
   soffice --headless --convert-to pdf test.pptx
   ```

## Development

### Adding New File Types:
1. Update `app.py` with new upload routes
2. Create corresponding tracker HTML files
3. Add progress tracking API endpoints
4. Update student dashboard to display new file type

### Customization:
- Modify CSS files for styling changes
- Update HTML templates for UI changes
- Adjust progress tracking logic in JavaScript files

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Ensure all dependencies are properly installed
3. Verify Redis and LibreOffice are running correctly
4. Check application logs for specific error messages
