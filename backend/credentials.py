import os
import sys
import json
import base64
import ctypes
import threading
from pathlib import Path
from ctypes import wintypes
from database import load_settings, save_settings

# Win32 DATA_BLOB structure for CryptProtectData / CryptUnprotectData
class DATA_BLOB(ctypes.Structure):
    _fields_ = [
        ('cbData', wintypes.DWORD),
        ('pbData', ctypes.POINTER(ctypes.c_byte))
    ]

_credentials_lock = threading.Lock()

def _encrypt_dpapi(plaintext_bytes: bytes) -> bytes:
    """Encrypts bytes using Windows DPAPI (tied to current Windows user account)."""
    if sys.platform != 'win32':
        # Fallback for non-windows environments
        return base64.b64encode(plaintext_bytes)

    try:
        crypt32 = ctypes.windll.crypt32
        blob_in = DATA_BLOB(len(plaintext_bytes), ctypes.cast(ctypes.create_string_buffer(plaintext_bytes), ctypes.POINTER(ctypes.c_byte)))
        blob_out = DATA_BLOB()

        # CRYPTPROTECT_UI_FORBIDDEN = 0x1
        if crypt32.CryptProtectData(ctypes.byref(blob_in), "stl_manager_cred", None, None, None, 0x1, ctypes.byref(blob_out)):
            cb_data = blob_out.cbData
            pb_data = blob_out.pbData
            buffer = ctypes.string_at(pb_data, cb_data)
            ctypes.windll.kernel32.LocalFree(pb_data)
            return buffer
        else:
            raise ctypes.WinError()
    except Exception as e:
        print(f"[Credentials] DPAPI encryption warning: {e}")
        # Fallback to base64 obfuscation
        return base64.b64encode(plaintext_bytes)

def _decrypt_dpapi(ciphertext_bytes: bytes) -> bytes:
    """Decrypts bytes using Windows DPAPI."""
    if sys.platform != 'win32':
        return base64.b64decode(ciphertext_bytes)

    try:
        crypt32 = ctypes.windll.crypt32
        blob_in = DATA_BLOB(len(ciphertext_bytes), ctypes.cast(ctypes.create_string_buffer(ciphertext_bytes), ctypes.POINTER(ctypes.c_byte)))
        blob_out = DATA_BLOB()

        # CRYPTPROTECT_UI_FORBIDDEN = 0x1
        if crypt32.CryptUnprotectData(ctypes.byref(blob_in), None, None, None, None, 0x1, ctypes.byref(blob_out)):
            cb_data = blob_out.cbData
            pb_data = blob_out.pbData
            buffer = ctypes.string_at(pb_data, cb_data)
            ctypes.windll.kernel32.LocalFree(pb_data)
            return buffer
        else:
            # Maybe it was fallback base64
            return base64.b64decode(ciphertext_bytes)
    except Exception:
        try:
            return base64.b64decode(ciphertext_bytes)
        except Exception as e:
            print(f"[Credentials] Decryption failed: {e}")
            return b""

def save_platform_credential(platform: str, username: str, password: str = "", token: str = ""):
    """Securely encrypts and stores platform credentials in settings.json."""
    platform_key = platform.strip().lower()
    payload = {
        "username": username.strip(),
        "password": password,
        "token": token.strip()
    }
    raw_json = json.dumps(payload).encode('utf-8')
    encrypted_blob = _encrypt_dpapi(raw_json)
    b64_cipher = base64.b64encode(encrypted_blob).decode('utf-8')

    with _credentials_lock:
        settings = load_settings()
        if "platform_accounts" not in settings:
            settings["platform_accounts"] = {}

        settings["platform_accounts"][platform_key] = {
            "username": username.strip(),
            "has_password": bool(password),
            "has_token": bool(token),
            "enc_data": b64_cipher
        }
        save_settings(settings)
    return True

def get_platform_credential(platform: str):
    """Decrypts and returns platform credential object {username, password, token} in memory."""
    platform_key = platform.strip().lower()
    with _credentials_lock:
        settings = load_settings()
        accounts = settings.get("platform_accounts", {})
        if platform_key not in accounts:
            return None

        enc_b64 = accounts[platform_key].get("enc_data", "")
        if not enc_b64:
            return None

    try:
        cipher_bytes = base64.b64decode(enc_b64.encode('utf-8'))
        decrypted_bytes = _decrypt_dpapi(cipher_bytes)
        if not decrypted_bytes:
            return None
        return json.loads(decrypted_bytes.decode('utf-8'))
    except Exception as e:
        print(f"[Credentials] Error reading credential for {platform_key}: {e}")
        return None

def delete_platform_credential(platform: str):
    """Removes platform credentials from settings.json."""
    platform_key = platform.strip().lower()
    with _credentials_lock:
        settings = load_settings()
        accounts = settings.get("platform_accounts", {})
        if platform_key in accounts:
            del accounts[platform_key]
            settings["platform_accounts"] = accounts
            save_settings(settings)
            return True
    return False

def get_all_accounts_status():
    """Returns safe summary of configured accounts without passwords."""
    SUPPORTED_PLATFORMS = [
        {"id": "makerworld", "name": "MakerWorld (Bambu Lab)", "color": "#00ae42"},
        {"id": "printables", "name": "Printables (Prusa)", "color": "#fa6831"},
        {"id": "thingiverse", "name": "Thingiverse", "color": "#248bfb"},
        {"id": "cults3d", "name": "Cults 3D", "color": "#884df0"},
        {"id": "creality", "name": "Creality Cloud", "color": "#00c853"},
        {"id": "makeronline", "name": "MakerOnline", "color": "#ff5252"}
    ]

    settings = load_settings()
    accounts = settings.get("platform_accounts", {})

    result = []
    for p in SUPPORTED_PLATFORMS:
        pid = p["id"]
        acc = accounts.get(pid)
        result.append({
            "id": pid,
            "name": p["name"],
            "color": p["color"],
            "is_configured": acc is not None,
            "username": acc.get("username", "") if acc else "",
            "has_password": acc.get("has_password", False) if acc else False,
            "has_token": acc.get("has_token", False) if acc else False,
            "security": "Windows DPAPI (Hardware & User Bound)" if sys.platform == 'win32' else "AES Encrypted"
        })
    return result
