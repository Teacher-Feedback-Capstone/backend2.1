import sys
import json
import torch
import torchaudio
import librosa
import numpy as np
import ffmpeg
from transformers import pipeline
from pyannote.audio import Pipeline
from dotenv import load_dotenv
import os
from collections import defaultdict

from grader import grader

# --------------------- Model Loader (Singleton) ---------------------
class ModelLoader:
    """Singleton class to load ASR & Speaker Diarization models once."""
    
    _asr_pipeline = None
    _diarization_pipeline = None
    load_dotenv()
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_API_TOKEN")
    g = grader(api_key=os.getenv("GRADER_API_KEY"))

    @classmethod
    def get_asr_model(cls):
        """Load ASR model only once."""
        if cls._asr_pipeline is None:
            print("🔄 Loading ASR model...")
            sys.stdout.flush()
            cls._asr_pipeline = pipeline(
                "automatic-speech-recognition", 
                model="openai/whisper-base",
                device=0 if torch.cuda.is_available() else -1
            )
        return cls._asr_pipeline

    @classmethod
    def get_diarization_model(cls):
        """Load Speaker Diarization model only once."""
        if cls._diarization_pipeline is None:
            print("🔄 Loading Speaker Diarization model...")
            sys.stdout.flush()
            cls._diarization_pipeline = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1",
                use_auth_token=cls.HUGGINGFACE_TOKEN
            )
            cls._diarization_pipeline.to(cls.DEVICE)
        return cls._diarization_pipeline

# --------------------- Helper Functions ---------------------

def convert_audio(input_audio):
    """
    Converts an MP3 file to 16kHz WAV format (required for ASR model).
    """
    print(f"🎵 Converting {input_audio} to 16kHz WAV...")
    sys.stdout.flush()
    output_wav = "temp.wav"
    ffmpeg.input(input_audio).output(output_wav, ar=16000, ac=1).run(overwrite_output=True, quiet=True)
    return output_wav

def transcribe_audio(audio_path, asr_model):
    """
    Transcribes the audio file using the preloaded ASR model.
    """
    print("📝 Running transcription...")
    sys.stdout.flush()
    result = asr_model(audio_path, return_timestamps="word", chunk_length_s=30)
    return result

def diarize_audio(audio_path, diarization_model):
    """
    Runs speaker diarization to identify different speakers in the audio.
    """
    print("🎤 Running speaker diarization...")
    sys.stdout.flush()

    diarization_result = diarization_model(
        {"uri": audio_path, "audio": audio_path},
        min_speakers=3,  
        max_speakers=6,  
    )

    segments = []
    for turn, _, speaker in diarization_result.itertracks(yield_label=True):
        segments.append({
            "start": turn.start,
            "end": turn.end,
            "speaker": speaker
        })
    
    return segments

# --------------------- Persistent Processing Loop ---------------------

print("✅ ASR & Speaker Diarization Models Loaded. Ready for requests!")
sys.stdout.flush()

while True:
    try:
        line = sys.stdin.readline().strip()
        if not line:
            continue

        data = json.loads(line)
        file_path = data.get("filePath")
        subject = data.get("subject")
        diarize = data.get("diarize", False)

        if not file_path:
            print(json.dumps({"error": "No file path provided"}))
            sys.stdout.flush()
            continue

        print(f"📂 Processing file: {file_path}")
        sys.stdout.flush()

        converted_audio = convert_audio(file_path)
        asr_pipeline = ModelLoader.get_asr_model()
        diarization_pipeline = ModelLoader.get_diarization_model() if diarize else None

        transcript = transcribe_audio(converted_audio, asr_pipeline)

        if diarize:
            segments = diarize_audio(converted_audio, diarization_pipeline)
            response = {
                "transcription": transcript["text"],
                "segments": segments
            }
        else:
            response = {"transcription": transcript["text"]}

        results = ModelLoader.g.evaluate(user_input={str(response)}, subject=subject)
        print(json.dumps(results))
        sys.stdout.flush()

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.stdout.flush()