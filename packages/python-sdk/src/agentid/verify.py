"""
AgentID SDK Offline Verification

Local credential verification using Ed25519 signatures.
"""

from datetime import datetime, timezone
from typing import Any, Union

from agentid.crypto import verify_signature
from agentid.types import (
    CredentialPayload,
    VerifyResult,
    VerifiedCredential,
    VerifyError,
    ErrorCode,
)


def verify_credential_offline(
    credential: Union[CredentialPayload, dict[str, Any]],
    issuer_public_key: str,
) -> VerifyResult:
    """
    Verify a credential offline using the issuer's public key.

    This method performs verification without making any network calls.
    Note: Offline verification cannot check revocation status.

    Args:
        credential: The full credential payload to verify
        issuer_public_key: Base64-encoded Ed25519 public key

    Returns:
        VerifyResult with valid=True on success, or error details on failure
    """
    # Convert to dict if CredentialPayload
    if isinstance(credential, CredentialPayload):
        cred_dict = credential.model_dump()
    else:
        cred_dict = credential

    # Check validity period
    now = datetime.now(timezone.utc)

    try:
        valid_from = datetime.fromisoformat(
            cred_dict["constraints"]["valid_from"].replace("Z", "+00:00")
        )
        valid_until = datetime.fromisoformat(
            cred_dict["constraints"]["valid_until"].replace("Z", "+00:00")
        )
    except (KeyError, ValueError) as e:
        return VerifyResult(
            valid=False,
            error=VerifyError(
                code=ErrorCode.INVALID_REQUEST,
                message=f"Invalid date format in constraints: {e}",
            ),
        )

    if now < valid_from:
        return VerifyResult(
            valid=False,
            error=VerifyError(
                code=ErrorCode.CREDENTIAL_NOT_YET_VALID,
                message="Credential not yet valid",
            ),
        )

    if now >= valid_until:
        return VerifyResult(
            valid=False,
            error=VerifyError(
                code=ErrorCode.CREDENTIAL_EXPIRED,
                message="Credential has expired",
            ),
        )

    # Verify signature
    signature = cred_dict.get("signature", "")
    if not signature:
        return VerifyResult(
            valid=False,
            error=VerifyError(
                code=ErrorCode.INVALID_SIGNATURE,
                message="Missing signature",
            ),
        )

    is_valid = verify_signature(cred_dict, signature, issuer_public_key)

    if not is_valid:
        return VerifyResult(
            valid=False,
            error=VerifyError(
                code=ErrorCode.INVALID_SIGNATURE,
                message="Invalid signature",
            ),
        )

    # Success
    return VerifyResult(
        valid=True,
        credential=VerifiedCredential(
            agent_id=cred_dict["agent_id"],
            agent_name=cred_dict["agent_name"],
            agent_type=cred_dict["agent_type"],
            issuer=cred_dict["issuer"],
            permissions=cred_dict["permissions"],
            valid_until=cred_dict["constraints"]["valid_until"],
        ),
    )
