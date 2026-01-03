# encrypting & decrypting api keys
import base64
from Crypto.Cipher import AES
import os

class CryptoUtils:
    def __init__(self):
        self.SECRET_KEY = os.getenv("ENC_SECRET_KEY", "12345678901234567890123456789012").encode()  # 32 bytes
        self.BLOCK_SIZE = 16

class Encryptor(CryptoUtils):
    def __init__(self):
        super().__init__()
    def pad(self,data: bytes) -> bytes:
        pad_len = self.BLOCK_SIZE - len(data) % self.BLOCK_SIZE
        return data + bytes([pad_len] * pad_len)

    def encrypt_api_key(self,api_key: str) -> str:
        iv = os.urandom(16)
        cipher = AES.new(self.SECRET_KEY, AES.MODE_CBC, iv)
        enc = cipher.encrypt(self.pad(api_key.encode()))
        return base64.b64encode(iv + enc).decode()

class Decryptor(CryptoUtils):
    def __init__(self):
        super().__init__()
    def unpad(self,data: bytes) -> bytes:
        return data[:-data[-1]]

    def decrypt_api_key(self,enc_key: str) -> str:
        raw = base64.b64decode(enc_key)
        iv, enc = raw[:16], raw[16:]
        cipher = AES.new(self.SECRET_KEY, AES.MODE_CBC, iv)
        dec = self.unpad(cipher.decrypt(enc))
        return dec.decode()