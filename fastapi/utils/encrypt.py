import base64
from Crypto.Cipher import AES
import os

SECRET_KEY = os.getenv("ENC_SECRET_KEY", "12345678901234567890123456789012").encode()  # 32 bytes

BLOCK_SIZE = 16

def pad(data: bytes) -> bytes:
    pad_len = BLOCK_SIZE - len(data) % BLOCK_SIZE
    return data + bytes([pad_len] * pad_len)

def unpad(data: bytes) -> bytes:
    return data[:-data[-1]]

def encrypt_api_key(api_key: str) -> str:
    iv = os.urandom(16)
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, iv)
    enc = cipher.encrypt(pad(api_key.encode()))
    return base64.b64encode(iv + enc).decode()

def decrypt_api_key(enc_key: str) -> str:
    raw = base64.b64decode(enc_key)
    iv, enc = raw[:16], raw[16:]
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, iv)
    dec = unpad(cipher.decrypt(enc))
    return dec.decode()