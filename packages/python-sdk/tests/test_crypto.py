"""
Tests for cryptographic utilities.
"""

import pytest

from agentid.crypto import canonical_json, base64_encode, base64_decode


class TestCanonicalJson:
    """Test canonical JSON serialization."""

    def test_null(self) -> None:
        assert canonical_json(None) == "null"

    def test_boolean(self) -> None:
        assert canonical_json(True) == "true"
        assert canonical_json(False) == "false"

    def test_number(self) -> None:
        assert canonical_json(42) == "42"
        assert canonical_json(3.14) == "3.14"

    def test_string(self) -> None:
        assert canonical_json("hello") == '"hello"'
        assert canonical_json('with "quotes"') == '"with \\"quotes\\""'

    def test_array(self) -> None:
        assert canonical_json([1, 2, 3]) == "[1,2,3]"
        assert canonical_json(["a", "b"]) == '["a","b"]'
        assert canonical_json([]) == "[]"

    def test_object_sorted_keys(self) -> None:
        # Keys should be sorted alphabetically
        obj = {"z": 1, "a": 2, "m": 3}
        assert canonical_json(obj) == '{"a":2,"m":3,"z":1}'

    def test_nested_object(self) -> None:
        obj = {"outer": {"b": 1, "a": 2}}
        assert canonical_json(obj) == '{"outer":{"a":2,"b":1}}'

    def test_complex_nested(self) -> None:
        obj = {
            "credentials": [{"id": "123"}],
            "agent": {"name": "test", "id": "agent-1"},
        }
        result = canonical_json(obj)
        # Verify keys are sorted at each level
        assert result.index('"agent"') < result.index('"credentials"')
        assert '"id":"agent-1"' in result


class TestBase64:
    """Test base64 encoding/decoding."""

    def test_roundtrip(self) -> None:
        original = b"hello world"
        encoded = base64_encode(original)
        decoded = base64_decode(encoded)
        assert decoded == original

    def test_encode(self) -> None:
        assert base64_encode(b"hello") == "aGVsbG8="

    def test_decode(self) -> None:
        assert base64_decode("aGVsbG8=") == b"hello"
