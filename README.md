# IELTS speaking practice

**Working prototype.** The app records a spoken response, returns a transcript, and produces a practice score. The recording-to-feedback experience is still being refined.

The project is a practice app for turning a spoken answer into a transcript and requesting AI-generated feedback. The Express app serves the interface, a separate FastAPI service transcribes audio with faster-whisper, and the scoring route calls Gemini. Feedback is for practice and is not an official IELTS result.

## Run locally

Use Node.js, npm, and a Python environment. Start the transcription service in one terminal:

```sh
cd whisper-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8000
```

The transcription service uses the Whisper base model on CPU. The first start may need to download the model weights.

From the repository root, install the JavaScript dependencies with `npm ci`. Set `WHISPER_URL=http://127.0.0.1:8000` and `GEMINI_API_KEY` in your local environment. Then run `node index.js` and open http://localhost:3000.

## Follow a request

- [Express routes](index.js) handle the browser upload, call the transcription service, and request scoring.
- [Transcription service](whisper-service/main.py) receives the audio and returns the transcript.
- [Practice interface](views/index.ejs) presents the speaking workflow.

The transcription service currently writes uploads to a shared temporary filename. Run one practice session at a time locally.
