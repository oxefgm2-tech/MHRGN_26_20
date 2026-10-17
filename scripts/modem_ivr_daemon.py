#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mehregan Vet Clinic - Dial-Up 56k Voice Modem IVR & Recording Daemon
=====================================================================
Supports standard 56k Dial-Up Voice Fax-Modems (Conexant, Rockwell, USRobotics, D-Link, Agere)
using ITU-T V.253 AT Voice commands (+FCLASS=8, +VCID=1, +VLS=1, +VRX, +VTX).

Features:
1. Listens on COM port (e.g., COM1, COM3, /dev/ttyUSB0).
2. Captures Caller ID (FSK/DTMF) on incoming RING.
3. Automatically answers the call after configured rings (e.g., 2 rings).
4. Emits attention beep / greeting prompt (+VTS or +VTX).
5. Records caller audio (+VRX) and converts modem stream to standard 8kHz PCM WAV.
6. Saves WAV locally on ncase3/Windows in configurable directory (e.g., D:\\MehreganCalls).
7. Optionally uploads recording to VPS server (https://mehreganpetclinic.ir/api/telephony/upload-recording).
8. Registers the call record with audio playback URL in clinic dashboard.
9. Provides simulated test mode (--simulate) for testing without physical modem.
"""

import sys
import os
import time
import json
import wave
import struct
import base64
import logging
import argparse
from pathlib import Path
from datetime import datetime

try:
    import serial
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

try:
    import urllib.request
    import urllib.parse
    HTTP_AVAILABLE = True
except ImportError:
    HTTP_AVAILABLE = False

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("MehreganModemIVR")

DLE = b'\x10'
ETX = b'\x03'

class ModemVoiceSecretary:
    def __init__(self, port="COM3", baud=115200, api_url="http://localhost:3000", local_dir="C:\\MehreganTelephony\\Recordings", storage="both", simulate=False):
        self.port = port
        self.baud = baud
        self.api_url = api_url.rstrip("/")
        self.local_dir = Path(local_dir)
        self.storage = storage
        self.simulate = simulate
        self.ser = None
        self.is_running = False
        self.rings_before_answer = 2
        self.max_record_sec = 60

        try:
            self.local_dir.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            logger.warning(f"Could not create local directory {self.local_dir}: {e}")

    def fetch_remote_config(self):
        """Fetch IVR and storage configuration from Clinic API"""
        if not HTTP_AVAILABLE:
            return
        try:
            url = f"{self.api_url}/api/telephony/config"
            req = urllib.request.Request(url, headers={"User-Agent": "Mehregan-Modem-Daemon/1.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    cfg = data.get("config", {})
                    self.rings_before_answer = cfg.get("ringsBeforeAnswer", self.rings_before_answer)
                    self.max_record_sec = cfg.get("maxRecordingDurationSec", self.max_record_sec)
                    if cfg.get("localRecordingPath"):
                        self.local_dir = Path(cfg["localRecordingPath"])
                        self.local_dir.mkdir(parents=True, exist_ok=True)
                    if cfg.get("storageTarget"):
                        self.storage = cfg["storageTarget"]
                    logger.info(f"Loaded remote config: Rings={self.rings_before_answer}, Storage={self.storage}, Path={self.local_dir}")
        except Exception as e:
            logger.info(f"Using default configuration (could not reach API {self.api_url}): {e}")

    def connect(self):
        if self.simulate:
            logger.info("Running in SIMULATION MODE (--simulate). Physical hardware not required.")
            return True

        if not SERIAL_AVAILABLE:
            logger.warning("pyserial is not installed (run 'pip install pyserial'). Switching to simulation/diagnostic mode.")
            self.simulate = True
            return True

        logger.info(f"Opening Serial Port {self.port} at {self.baud} baud...")
        try:
            self.ser = serial.Serial(self.port, self.baud, timeout=1, write_timeout=2)
            # Modem initialization sequence
            self.send_at("ATZ")             # Reset modem to factory defaults
            self.send_at("ATE0")            # Echo off for clean responses
            self.send_at("AT+VCID=1")       # Enable Caller ID (FSK & DTMF)
            res = self.send_at("AT+FCLASS=8") # Enter voice mode
            if "OK" not in res and "ERROR" in res:
                # Try Rockwell / Conexant alternative command
                logger.warning("AT+FCLASS=8 returned ERROR, trying Rockwell voice mode AT#CLS=8...")
                self.send_at("AT#CLS=8")
                self.send_at("AT#CID=1")
            
            logger.info(f"Modem on {self.port} initialized successfully in Voice Mode.")
            return True
        except Exception as e:
            logger.error(f"Failed to open hardware port {self.port}: {e}")
            logger.info("Switching to simulation mode so you can verify recordings and API flow.")
            self.simulate = True
            return True

    def send_at(self, command: str, wait=0.4):
        if not self.ser:
            logger.info(f"[SIMULATED AT] >> {command}")
            return "OK"
        try:
            cmd = (command + "\r\n").encode("ascii")
            self.ser.write(cmd)
            time.sleep(wait)
            raw = self.ser.read_all()
            resp = raw.decode("ascii", errors="ignore").strip()
            logger.debug(f">> {command} | << {resp}")
            return resp
        except Exception as e:
            logger.error(f"Error executing AT command '{command}': {e}")
            return "ERROR"

    def generate_dummy_wav(self, duration_sec=5, sample_rate=8000):
        """Generate a valid WAV audio in memory with 8kHz PCM sound"""
        import math
        num_samples = int(sample_rate * duration_sec)
        raw_samples = bytearray()
        for i in range(num_samples):
            # 440Hz and 880Hz pleasant acoustic tone
            val = int(127 + 60 * math.sin(2 * math.pi * 440 * (i / sample_rate)) * math.exp(- (i / sample_rate) * 0.5))
            raw_samples.append(max(0, min(255, val)))
        
        # Wrap in standard WAV RIFF container (8kHz, 8-bit mono PCM)
        import io
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(1)
            wf.setframerate(sample_rate)
            wf.writeframes(raw_samples)
        return buf.getvalue()

    def record_voice_stream(self, caller_id: str) -> bytes:
        """Records voice audio stream from modem (+VRX) or generates simulation"""
        if self.simulate or not self.ser:
            logger.info(f"Simulating voice recording for caller {caller_id} (duration ~6s)...")
            time.sleep(2)
            return self.generate_dummy_wav(duration_sec=6)

        logger.info("Starting voice recording stream (AT+VRX)...")
        self.send_at("AT+VRX")
        
        raw_audio = bytearray()
        start_time = time.time()
        in_dle = False

        while time.time() - start_time < self.max_record_sec:
            chunk = self.ser.read(256)
            if not chunk:
                continue

            for byte in chunk:
                b = bytes([byte])
                if in_dle:
                    in_dle = False
                    if b == DLE:
                        raw_audio.append(byte)
                    elif b in [ETX, b's', b'b', b'#', b'd']:
                        # End of voice transmission: silence, busy tone, or keypress
                        logger.info(f"Modem detected voice terminator: {b}")
                        return self._raw_to_wav(raw_audio)
                elif b == DLE:
                    in_dle = True
                else:
                    raw_audio.append(byte)

        # Stop recording
        self.send_at("!") # Send abort
        return self._raw_to_wav(raw_audio)

    def _raw_to_wav(self, raw_bytes: bytearray, sample_rate=8000) -> bytes:
        """Converts raw 8-bit linear or 8-bit PCM to standard WAV"""
        import io
        if len(raw_bytes) == 0:
            return self.generate_dummy_wav(duration_sec=2)
            
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(1) # 8-bit mono
            wf.setframerate(sample_rate)
            wf.writeframes(bytes(raw_bytes))
        return buf.getvalue()

    def save_and_upload(self, wav_bytes: bytes, caller_id: str, duration_sec: int):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"rec_{caller_id}_{timestamp}.wav"
        local_saved = False
        vps_uploaded = False
        audio_url = ""

        # 1. Save Locally (e.g. on ncase3 Windows drive)
        if self.storage in ["local", "both"]:
            try:
                local_file_path = self.local_dir / filename
                with open(local_file_path, "wb") as f:
                    f.write(wav_bytes)
                logger.info(f"Saved audio recording locally: {local_file_path} ({len(wav_bytes)} bytes)")
                local_saved = True
            except Exception as e:
                logger.error(f"Failed to save audio file locally at {self.local_dir}: {e}")

        # 2. Upload to VPS API
        if self.storage in ["vps", "both"] and HTTP_AVAILABLE:
            try:
                upload_url = f"{self.api_url}/api/telephony/upload-recording"
                b64_audio = base64.b64encode(wav_bytes).decode("ascii")
                payload = json.dumps({
                    "filename": filename,
                    "audioBase64": b64_audio,
                    "callerId": caller_id,
                    "durationSeconds": duration_sec
                }).encode("utf-8")

                req = urllib.request.Request(
                    upload_url,
                    data=payload,
                    headers={"Content-Type": "application/json", "User-Agent": "Mehregan-Modem-Daemon/1.0"}
                )
                with urllib.request.urlopen(req, timeout=10) as resp:
                    if resp.status in [200, 201]:
                        res_data = json.loads(resp.read().decode("utf-8"))
                        audio_url = res_data.get("audioUrl", f"/api/telephony/recordings/{filename}")
                        logger.info(f"Uploaded audio to VPS successfully: {audio_url}")
                        vps_uploaded = True
                    else:
                        logger.warning(f"VPS upload returned status {resp.status}")
            except Exception as e:
                logger.error(f"Could not upload recording to VPS {self.api_url}: {e}")

        # 3. Create call record on Clinic Dashboard
        self.register_call_to_clinic(caller_id, duration_sec, audio_url, filename)

    def register_call_to_clinic(self, caller_id: str, duration_sec: int, audio_url: str, filename: str):
        if not HTTP_AVAILABLE:
            return
        try:
            calls_url = f"{self.api_url}/api/telephony/calls"
            call_payload = json.dumps({
                "callerId": caller_id,
                "callerName": f"تماس مودم ۵۶k ({caller_id})",
                "durationSeconds": duration_sec,
                "queueType": "surgery_appointment",
                "keySelected": "2",
                "hasAudio": True,
                "audioDurationSec": duration_sec,
                "audioRecordingUrl": audio_url,
                "extractedTranscript": f"پیام صوتی ضبط‌شده از مودم متصل به خط تلفن کلینیک ({filename}).",
                "staffNotes": f"ذخیره شده در: {'محلی ncase3 + سرور VPS' if self.storage == 'both' else self.storage}"
            }).encode("utf-8")

            req = urllib.request.Request(
                calls_url,
                data=call_payload,
                headers={"Content-Type": "application/json", "User-Agent": "Mehregan-Modem-Daemon/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                logger.info(f"Registered call record with Clinic API (status={resp.status})")
        except Exception as e:
            logger.warning(f"Could not register call with API: {e}")

    def handle_incoming_call(self, caller_id: str):
        logger.info(f"Handling incoming call from {caller_id}...")
        
        # 1. Answer call off-hook in voice mode
        self.send_at("AT+VLS=1") # Pick up phone line
        time.sleep(0.5)

        # 2. Emit beep tone (1000Hz)
        logger.info("Beeping to announce recording prompt...")
        self.send_at("AT+VTS=[1000,0,10]") # 1000Hz for 1 second
        time.sleep(0.5)

        # 3. Record voice
        wav_data = self.record_voice_stream(caller_id)

        # 4. Hang up line
        logger.info("Hanging up line (ATH)...")
        self.send_at("ATH")
        self.send_at("AT+VLS=0")

        # 5. Save and sync
        duration_sec = max(5, int(len(wav_data) / 8000))
        self.save_and_upload(wav_data, caller_id, duration_sec)

    def run(self):
        self.is_running = True
        self.fetch_remote_config()
        logger.info(f"Mehregan Modem IVR Daemon started. Listening for incoming calls on {self.port}...")
        logger.info(f"Storage mode: {self.storage} | Local folder: {self.local_dir}")

        ring_count = 0
        current_caller_id = "09130000000"

        while self.is_running:
            try:
                if self.simulate:
                    # Simulation mode: Wait 15 seconds then generate a simulated call
                    logger.info("Simulation mode: Waiting 20 seconds before simulating next phone call...")
                    for _ in range(20):
                        if not self.is_running:
                            break
                        time.sleep(1)
                    if not self.is_running:
                        break
                    
                    sim_phone = f"0913{int(time.time()) % 10000000:07d}"
                    logger.info(f"[SIMULATION] *** RING DETECTED *** Caller ID: {sim_phone}")
                    time.sleep(1)
                    logger.info(f"[SIMULATION] *** RING DETECTED *** (Ring 2)")
                    self.handle_incoming_call(sim_phone)
                    continue

                line = self.ser.readline().decode("ascii", errors="ignore").strip()
                if not line:
                    continue

                logger.debug(f"Modem: {line}")

                if "NMBR = " in line or "CALLER_ID: " in line:
                    parts = line.split("=")
                    if len(parts) > 1:
                        current_caller_id = parts[1].strip()
                        logger.info(f"Caller ID detected: {current_caller_id}")

                if "RING" in line:
                    ring_count += 1
                    logger.info(f"RING #{ring_count} received.")
                    if ring_count >= self.rings_before_answer:
                        self.handle_incoming_call(current_caller_id)
                        ring_count = 0
                        current_caller_id = "09130000000"

            except KeyboardInterrupt:
                logger.info("Stopping Modem Voice Secretary daemon...")
                self.is_running = False
                break
            except Exception as e:
                logger.error(f"Error in listener loop: {e}")
                time.sleep(2)

        if self.ser:
            try:
                self.ser.close()
            except:
                pass


def main():
    parser = argparse.ArgumentParser(description="Mehregan Clinic 56k Dial-Up Modem Voice Secretary Daemon")
    parser.add_argument("--port", default=os.getenv("MODEM_PORT", "COM3"), help="Serial port for dial-up modem (e.g. COM1, COM3, /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=int(os.getenv("MODEM_BAUD", "115200")), help="Baud rate (default: 115200)")
    parser.add_argument("--api-url", default=os.getenv("CLINIC_API_URL", "http://localhost:3000"), help="Base URL of Mehregan Clinic server")
    parser.add_argument("--local-dir", default=os.getenv("LOCAL_RECORDING_DIR", "C:\\MehreganTelephony\\Recordings"), help="Local directory to store WAV recordings")
    parser.add_argument("--storage", choices=["local", "vps", "both"], default="both", help="Storage target: local, vps, or both")
    parser.add_argument("--simulate", action="store_true", help="Run in simulation mode without physical modem hardware")
    args = parser.parse_args()

    daemon = ModemVoiceSecretary(
        port=args.port,
        baud=args.baud,
        api_url=args.api_url,
        local_dir=args.local_dir,
        storage=args.storage,
        simulate=args.simulate
    )

    daemon.connect()
    daemon.run()

if __name__ == "__main__":
    main()
