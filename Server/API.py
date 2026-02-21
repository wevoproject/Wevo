# cd ~/Desktop/Codage/projets/Home_Lab/Wevo/Code/Server
# pip install pqcrypto
# python3 API.py


from pqcrypto.kem.kyber512 import generate_keypair, encrypt, decrypt
from hashlib import shake_256
from getpass import getpass

# --- user input ---
ID = input("ID : ")
password = getpass("Password : ")

# --- deterministic seed ---
hash_bytes = shake_256((ID + password).encode()).digest(32)

# Utilisation du seed pour RNG (très simple)
import random
rnd = random.Random(int.from_bytes(hash_bytes, "big"))

def rng(n):
    return bytes([rnd.randint(0, 255) for _ in range(n)])

# --- Keypair ---
public_key, secret_key = generate_keypair()
print("PK:", public_key.hex())
print("SK:", secret_key.hex())