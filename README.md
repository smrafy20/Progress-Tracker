# Video Progress Tracker with Redis Backend

This project is a simple web-based video player that tracks the user's watch progress. Progress data (last playback time and maximum percentage watched) is stored in a Redis database via a Python Flask backend.

## Features

*   Tracks video playback progress.
*   Saves progress to a Redis database.
*   Loads progress when the page is revisited.
*   Allows resetting progress.
*   Allows continuing from the last watched point.
*   Visual feedback for progress percentage.

## Project Structure

```
.
├── index.html        # The main HTML file for the video player
├── style.css         # CSS styles for the page
├── script.js         # JavaScript for player logic and API communication
├── app.py            # Python Flask backend for Redis interaction
├── TP.mp4            # Sample video file (replace with your own)
└── README.md         # This file
```

## Prerequisites

*   **Python 3.x:** To run the backend server.
*   **Redis Server:** To store the progress data. Download and install from [redis.io](https://redis.io/download).
*   **Web Browser:** To view the `index.html` page.

## Setup and Installation

1.  **Clone or Download the Project:**
    Get all the project files onto your local machine.

2.  **Install Python Dependencies:**
    Open a terminal or command prompt in the project's root directory and run:
    ```bash
    pip install Flask redis Flask-CORS
    ```
    *   `Flask`: A micro web framework for Python.
    *   `redis`: The Python client for Redis.
    *   `Flask-CORS`: A Flask extension for handling Cross-Origin Resource Sharing (CORS).

3.  **Ensure Redis Server is Running:**
    Start your Redis server. By default, it runs on `localhost:6379`.
    *   On Windows, you might run `redis-server.exe` from its installation directory.
    *   On Linux/macOS, you might use a command like `redis-server`.

## Running the Application

1.  **Start the Python Backend Server:**
    In your terminal, navigate to the project directory and run:
    ```bash
    python app.py
    ```
    You should see output indicating the Flask server is running (e.g., `* Running on http://127.0.0.1:5000/`) and a message "Connected to Redis!" if the connection to Redis was successful.

2.  **Open the Video Player:**
    Open the `index.html` file in your web browser. You can usually do this by double-clicking the file or using "File > Open" in your browser.

    The video player will load, and any previously saved progress for the video `TP.mp4` will be fetched from Redis.

## How It Works

*   **Frontend (`index.html`, `script.js`):**
    *   The HTML provides the video player and progress display elements.
    *   JavaScript handles video events (play, pause, timeupdate, ended, beforeunload).
    *   On `timeupdate`, the display is updated, and `maxProgress` (the furthest point reached) is tracked locally.
    *   On `pause` or `beforeunload` (when closing the tab/browser), `script.js` makes an AJAX (Fetch API) POST request to the Python backend (`/api/progress`) to save the `currentTime` and `maxProgress`.
    *   When the page loads, an AJAX GET request is made to `/api/progress` to retrieve saved progress.
    *   The "Reset Progress" button sends a DELETE request to clear data.
    *   The "Continue Watching" button jumps to the `maxProgress` point.

*   **Backend (`app.py`):**
    *   A Flask application listens for HTTP requests on `http://localhost:5000`.
    *   It connects to the local Redis server.
    *   `/api/progress` (GET): Retrieves `currentTime` and `maxProgress` from Redis for the given `videoId`.
    *   `/api/progress` (POST): Saves `currentTime` and `maxProgress` to Redis.
    *   `/api/progress` (DELETE): Deletes progress data from Redis.
    *   Redis keys are structured like `video:<videoId>:time` and `video:<videoId>:maxProgress`.

*   **Redis:**
    *   Acts as the persistent data store for video progress.

## Checking Data in Redis

You can inspect the data directly in Redis using the `redis-cli`:

1.  Open a new terminal.
2.  Run `redis-cli`.
3.  Use commands like:
    *   `KEYS *`: List all keys in the database.
    *   `GET video:TP.mp4:time`: Get the saved current time for `TP.mp4`.
    *   `GET video:TP.mp4:maxProgress`: Get the saved max progress percentage for `TP.mp4`.
    *   `DEL video:TP.mp4:time`: Delete a specific key.

## Customization

*   **Video File:** Replace `TP.mp4` in `index.html` (`<source src="TP.mp4" ...>`) and in `script.js` (`const videoId = 'TP.mp4';`) with your video file and its identifier.
*   **Redis Configuration:** If your Redis server is not on `localhost:6379`, update the connection parameters in `app.py`:
    ```python
    r = redis.Redis(host='your_redis_host', port=your_redis_port, db=0, decode_responses=True)
    ```
*   **Multiple Videos:** To support multiple videos dynamically, you would need to:
    1.  Modify `script.js` to determine the `videoId` based on the current video source.
    2.  Ensure this `videoId` is passed in all API calls. The backend already supports a `videoId` query parameter.
```# Video Progress Tracker with Redis Backend

This project is a simple web-based video player that tracks the user's watch progress. Progress data (last playback time and maximum percentage watched) is stored in a Redis database via a Python Flask backend.

## Features

*   Tracks video playback progress.
*   Saves progress to a Redis database.
*   Loads progress when the page is revisited.
*   Allows resetting progress.
*   Allows continuing from the last watched point.
*   Visual feedback for progress percentage.

## Project Structure

```
.
├── index.html        # The main HTML file for the video player
├── style.css         # CSS styles for the page
├── script.js         # JavaScript for player logic and API communication
├── app.py            # Python Flask backend for Redis interaction
├── TP.mp4            # Sample video file (replace with your own)
└── README.md         # This file
```

## Prerequisites

*   **Python 3.x:** To run the backend server.
*   **Redis Server:** To store the progress data. Download and install from [redis.io](https://redis.io/download).
*   **Web Browser:** To view the `index.html` page.

## Setup and Installation

1.  **Clone or Download the Project:**
    Get all the project files onto your local machine.

2.  **Install Python Dependencies:**
    Open a terminal or command prompt in the project's root directory and run:
    ```bash
    pip install Flask redis Flask-CORS
    ```
    *   `Flask`: A micro web framework for Python.
    *   `redis`: The Python client for Redis.
    *   `Flask-CORS`: A Flask extension for handling Cross-Origin Resource Sharing (CORS).

3.  **Ensure Redis Server is Running:**
    Start your Redis server. By default, it runs on `localhost:6379`.
    *   On Windows, you might run `redis-server.exe` from its installation directory.
    *   On Linux/macOS, you might use a command like `redis-server`.

## Running the Application

1.  **Start the Python Backend Server:**
    In your terminal, navigate to the project directory and run:
    ```bash
    python app.py
    ```
    You should see output indicating the Flask server is running (e.g., `* Running on http://127.0.0.1:5000/`) and a message "Connected to Redis!" if the connection to Redis was successful.

2.  **Open the Video Player:**
    Open the `index.html` file in your web browser. You can usually do this by double-clicking the file or using "File > Open" in your browser.

    The video player will load, and any previously saved progress for the video `TP.mp4` will be fetched from Redis.

## How It Works

*   **Frontend (`index.html`, `script.js`):**
    *   The HTML provides the video player and progress display elements.
    *   JavaScript handles video events (play, pause, timeupdate, ended, beforeunload).
    *   On `timeupdate`, the display is updated, and `maxProgress` (the furthest point reached) is tracked locally.
    *   On `pause` or `beforeunload` (when closing the tab/browser), `script.js` makes an AJAX (Fetch API) POST request to the Python backend (`/api/progress`) to save the `currentTime` and `maxProgress`.
    *   When the page loads, an AJAX GET request is made to `/api/progress` to retrieve saved progress.
    *   The "Reset Progress" button sends a DELETE request to clear data.
    *   The "Continue Watching" button jumps to the `maxProgress` point.

*   **Backend (`app.py`):**
    *   A Flask application listens for HTTP requests on `http://localhost:5000`.
    *   It connects to the local Redis server.
    *   `/api/progress` (GET): Retrieves `currentTime` and `maxProgress` from Redis for the given `videoId`.
    *   `/api/progress` (POST): Saves `currentTime` and `maxProgress` to Redis.
    *   `/api/progress` (DELETE): Deletes progress data from Redis.
    *   Redis keys are structured like `video:<videoId>:time` and `video:<videoId>:maxProgress`.

*   **Redis:**
    *   Acts as the persistent data store for video progress.

## Checking Data in Redis

You can inspect the data directly in Redis using the `redis-cli`:

1.  Open a new terminal.
2.  Run `redis-cli`.
3.  Use commands like:
    *   `KEYS *`: List all keys in the database.
    *   `GET video:TP.mp4:time`: Get the saved current time for `TP.mp4`.
    *   `GET video:TP.mp4:maxProgress`: Get the saved max progress percentage for `TP.mp4`.
    *   `DEL video:TP.mp4:time`: Delete a specific key.

## Customization

*   **Video File:** Replace `TP.mp4` in `index.html` (`<source src="TP.mp4" ...>`) and in `script.js` (`const videoId = 'TP.mp4';`) with your video file and its identifier.
*   **Redis Configuration:** If your Redis server is not on `localhost:6379`, update the connection parameters in `app.py`:
    ```python
    r = redis.Redis(host='your_redis_host', port=your_redis_port, db=0, decode_responses=True)
    ```
*   **Multiple Videos:** To support multiple videos dynamically, you would need to:
    1.  Modify `script.js` to determine the `videoId` based on the current video source.
    2.  Ensure this `videoId` is passed in all API calls. The backend already supports a `videoId` query parameter.