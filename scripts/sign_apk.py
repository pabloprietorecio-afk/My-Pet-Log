#!/usr/bin/env python3
"""Firma un APK con el esquema de firma APK v2 (RSA PKCS#1 v1.5 + SHA-256).

Uso: sign_apk.py entrada.apk salida.apk almacen.p12 alias
La contraseña del almacén se lee de la variable de entorno PETLOG_KEYSTORE_PASSWORD.

Quita el bloque de firma que traiga el APK (p. ej. la firma de depuración de CI) y añade uno nuevo.
No toca las entradas del ZIP, así que se conserva la alineación hecha por zipalign.
Especificación: https://source.android.com/docs/security/features/apksigning/v2
"""
import hashlib
import os
import struct
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

APK_SIG_BLOCK_MAGIC = b'APK Sig Block 42'
V2_ID = 0x7109871A
SIG_RSA_PKCS1_SHA256 = 0x0103
CHUNK = 1024 * 1024


def lp(b: bytes) -> bytes:
    """Prefijo de longitud uint32 little-endian."""
    return struct.pack('<I', len(b)) + b


def find_eocd(data: bytes) -> int:
    for i in range(len(data) - 22, max(-1, len(data) - 22 - 65536) - 1, -1):
        if data[i:i + 4] == b'PK\x05\x06':
            comment_len = struct.unpack('<H', data[i + 20:i + 22])[0]
            if i + 22 + comment_len == len(data):
                return i
    raise SystemExit('No se encontró el final del ZIP (EOCD)')


def split_apk(data: bytes):
    eocd_off = find_eocd(data)
    eocd = data[eocd_off:]
    cd_size, cd_off = struct.unpack('<II', eocd[12:20])
    if cd_off + cd_size != eocd_off:
        raise SystemExit('Directorio central inesperado')
    entries_end = cd_off
    # ¿Hay un bloque de firma justo antes del directorio central? Se descarta.
    if cd_off >= 32 and data[cd_off - 16:cd_off] == APK_SIG_BLOCK_MAGIC:
        size = struct.unpack('<Q', data[cd_off - 24:cd_off - 16])[0]
        start = cd_off - size - 8
        if struct.unpack('<Q', data[start:start + 8])[0] != size:
            raise SystemExit('Bloque de firma corrupto')
        entries_end = start
    return data[:entries_end], data[cd_off:eocd_off], eocd


def chunked_digest(sections) -> bytes:
    digests = []
    for sec in sections:
        for i in range(0, len(sec), CHUNK):
            c = sec[i:i + CHUNK]
            digests.append(hashlib.sha256(b'\xa5' + struct.pack('<I', len(c)) + c).digest())
    return hashlib.sha256(b'\x5a' + struct.pack('<I', len(digests)) + b''.join(digests)).digest()


def main():
    src, dst, ks_path, alias = sys.argv[1:5]
    password = os.environ['PETLOG_KEYSTORE_PASSWORD'].encode()
    with open(ks_path, 'rb') as f:
        ks = pkcs12.load_pkcs12(f.read(), password)
    if ks.key is None or ks.cert is None:
        raise SystemExit('El almacén no tiene clave/certificado')
    if ks.cert.friendly_name and ks.cert.friendly_name.decode() != alias:
        raise SystemExit(f'Alias distinto: {ks.cert.friendly_name!r}')
    key = ks.key
    cert_der = ks.cert.certificate.public_bytes(serialization.Encoding.DER)
    pub_der = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)

    data = open(src, 'rb').read()
    entries, cd, eocd = split_apk(data)

    # Para el resumen, el EOCD apunta al inicio del bloque de firma (= fin de las entradas).
    eocd_for_digest = eocd[:16] + struct.pack('<I', len(entries)) + eocd[20:]
    digest = chunked_digest([entries, cd, eocd_for_digest])

    digests = lp(lp(struct.pack('<I', SIG_RSA_PKCS1_SHA256) + lp(digest)))
    certificates = lp(lp(cert_der))
    additional = lp(b'')
    signed_data = digests + certificates + additional
    signature = key.sign(signed_data, padding.PKCS1v15(), hashes.SHA256())
    signatures = lp(lp(struct.pack('<I', SIG_RSA_PKCS1_SHA256) + lp(signature)))
    signer = lp(signed_data) + signatures + lp(pub_der)
    v2_value = lp(lp(signer))

    pair = struct.pack('<QI', 4 + len(v2_value), V2_ID) + v2_value
    block_size = len(pair) + 8 + 16  # pares + tamaño final + magic
    block = struct.pack('<Q', block_size) + pair + struct.pack('<Q', block_size) + APK_SIG_BLOCK_MAGIC

    new_cd_off = len(entries) + len(block)
    new_eocd = eocd[:16] + struct.pack('<I', new_cd_off) + eocd[20:]
    with open(dst, 'wb') as f:
        f.write(entries + block + cd + new_eocd)
    print(f'Firmado: {dst} ({len(entries) + len(block) + len(cd) + len(new_eocd)} bytes)')


if __name__ == '__main__':
    main()
