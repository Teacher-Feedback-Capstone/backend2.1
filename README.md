# Automated Teacher Evaluation Tool - Backend
##  API and system integration by Nathan Dilla
##  grader algorithm by Evan Lloyd
##  database by Joshua Slinkman and Alexander Fried

-----

This backend is written primarily using the ExpressJS framework. This system is designed to process the service
for the Automated Teacher Evaluation Tool to users. The backend system is comprised of 2 main elements:

1. Main server
2. Process workers


## Main Server
The main server is a Node instance, containing RESTful API endpoints. Here are the routes:

### Auth

Base Route: /api/auth

📝 POST /register

Registers a new user.

Request Body:

{
  "username": "string",
  "password": "string",
  "email": "string",
  "school_id": "number",
  "is_admin": "boolean (optional, defaults to 0)"
}

Responses:
	•	201 Created: Successfully registered. Returns userId and JWT token.
	•	400 Bad Request: Missing fields or username already exists.
	•   500 Internal Server Error: Something went wrong.

🔐 POST /login

Logs in an existing user.

Request Body:

{
  "username": "string",
  "password": "string"
}

Responses:
	•	200 OK: Login successful. Returns userId and JWT token.
	•	400 Bad Request: Missing username or password.
	•	401 Unauthorized: Invalid credentials.
	•	500 Internal Server Error: Something went wrong.

JWT tokens are signed using process.env.JWT_SECRET and expire in 1 hour.


### File Upload

Base Route: /api/files

All routes require JWT auth via the Authorization header.

📤 POST /upload

Uploads an audio file, stores it in S3, and queues it for background processing.
Background processing utilizes another worker NodeJS instance. 
Jobs are queued via Redis + BullMQ. Please refer to the section on the processing queue.
This code also listens for queueEvents from the job is posted:
- updateProgress: it relays this information to the client via WebSocket. Please refer to the section on Socket.IO.
- completed


Headers:
	•	Authorization: <token>
	•	Content-Type: multipart/form-data

Form Data:
	•	audio (file): Audio file to upload
	•	subject (string): Subject name (required)
	•	folder (string): Optional S3 folder

Responses:
	•	200 OK: File uploaded and job queued. Returns fileId and sessionId.
	•	400 Bad Request: Missing file or subject.
	•	401 Unauthorized: Missing/invalid token.
	•	500 Internal Server Error: Upload failed.

📁 GET /my-files

Returns a list of all files uploaded by the authenticated user.

Headers:
	•	Authorization: <token>

Response:
	•	200 OK: Array of file objects.
	•	500 Internal Server Error: Fetch failed.

📄 GET /:fileId

Fetch a specific file uploaded by the user.

Headers:
	•	Authorization: <token>

Response:
	•	200 OK: File metadata.
	•	404 Not Found: File not found or not authorized.
	•	500 Internal Server Error: Fetch failed.

❌ DELETE /:fileId

Deletes a specific file belonging to the user.

Headers:
	•	Authorization: <token>

Response:
	•	200 OK: File deleted.
	•	404 Not Found: File not found or not authorized.
	•	500 Internal Server Error: Deletion failed.


### Report

Base Route: /api/reports

All routes require JWT auth via the Authorization header (<token>).

📄 GET /

Returns all reports uploaded by the authenticated user.

Headers:
	•	Authorization: <token>

Response:
	•	200 OK: Array of report objects.
	•	404 Not Found: No reports found for user.
	•	500 Internal Server Error: Something went wrong.

📑 GET /:fileId

Returns a specific report (by file ID) for the authenticated user.

Headers:
	•	Authorization: <token>

Response:
	•	200 OK: Report data.
	•	404 Not Found: Report not found or not authorized.
	•	500 Internal Server Error: Something went wrong.

---

### Socket.IO

The main server communicates with its clients additionally through a WebSocket. Each processing job is dedicated
its own Socket.IO room. Clients connect to these rooms when a session id is returned from its file upload.
Ultimately, the clients are able to get job processing updates.


## Process Workers

Each worker is a node instance. It depends on a python program for file processing.
Multiple workers can be spun up to service the increase in demand if needed.
Each worker connects to the main server via Redis. BullMQ is a queueing library for Node.
Processing jobs are submitted by the main server and the worker recieves them in a queue.

### Jobs
Each job contains a key, userId and subject

The key is the AWS S3 URL in which the file for processing is stored. Worker uses this key to download from
S3 and saves it to the tmp file.

The subject is a text parameter that the client defines to give GPT the context to the transcript, effectively
increasing the grading accuracy.

Every job can send queue events to the main server:
- completed
- failed
- updateProgress

### Python

🧠 ASR + Speaker Diarization Inference Script

This Python script handles Automatic Speech Recognition (ASR) and optional Speaker Diarization using pre-trained models from Hugging Face & PyAnnote. It runs in a persistent loop and communicates via stdin/stdout, making it perfect for use with background processing systems like BullMQ.

Transcribe sends the transcript and other user parameters to the grader. The grader system uses a fine-tuned version of GPT-3.5. Refer to this repository for more information.

🚀 Features
	•	✅ Transcribes audio using Whisper-base
	•	🎤 (Optional) Speaker diarization via pyannote/speaker-diarization-3.1
	•	🔁 Singleton pattern for efficient model loading
	•	🎯 Sends results to a grader for evaluation via grader class
	•	📦 Accepts JSON requests via stdin, returns results via stdout

📥 Input Format

Send a line of JSON via stdin:

{
  "filePath": "path/to/audio.mp3",
  "subject": "History of Cats",
  "diarize": true
}

📤 Output Format

The script prints JSON via stdout. Example (when diarize = true):

{
  "grade": "A",
  "feedback": "...",
  "transcription": "...",
  "segments": [
    {
      "start": 0.0,
      "end": 12.5,
      "speaker": "SPEAKER_00"
    },
    ...
  ]
}

⚙️ Requirements
	•	Python 3.8+
	•	ffmpeg installed on your system
	•	Required Python packages (see below)

Install dependencies:

pip install -r requirements.txt

You’ll need:
	•	torch
	•	transformers
	•	torchaudio
	•	pyannote.audio
	•	ffmpeg-python
	•	librosa
	•	dotenv

-----
Quick Start:
- Terminal 1: Redis-server
Install redis-server
`brew install redis-server`
Start redis-server
`redis-server`

Ensure that ports are configured for both main server and redis

- Terminal 2: Main Server
Install express dependencies
`npm install`
Start server node
`node src/app.js`

- Terminal 3: Worker Instance
Ensure python libraries are installed, activate the python environment using `source .venv/bin/activate` in python dir
Then, install dependencies using `pip3 install -r requirements.txt`

Returning to the main directory, run the instance:
`node src/worker.js`