import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from signing import generate_keypair, sign_bytes, verify_signature_bytes


class DilithiumSigningTests(unittest.TestCase):
    def test_generate_keypair_returns_bytes(self):
        public_key, private_key = generate_keypair()

        self.assertIsInstance(public_key, (bytes, bytearray))
        self.assertIsInstance(private_key, (bytes, bytearray))
        self.assertGreater(len(public_key), 0)
        self.assertGreater(len(private_key), 0)

    def test_sign_and_verify_round_trip(self):
        public_key, private_key = generate_keypair()
        payload = b'patient-record-123'
        signature = sign_bytes(payload, private_key)

        self.assertTrue(verify_signature_bytes(payload, signature, public_key))


if __name__ == '__main__':
    unittest.main()
