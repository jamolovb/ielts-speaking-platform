from fastapi import FastAPI , UploadFile
from faster_whisper import WhisperModel

model = WhisperModel("base", device="cpu", compute_type="int8")

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Whisper service is alive"}

@app.post("/transcribe")
async def transcribe(audio: UploadFile):
    contents = await audio.read()
    with open("temp_audio.webm", "wb") as f:
        f.write(contents)
    segments, info = model.transcribe("temp_audio.webm")
    transcript = ""
    for segment in segments:
        transcript += segment.text
    return {"transcript": transcript}
