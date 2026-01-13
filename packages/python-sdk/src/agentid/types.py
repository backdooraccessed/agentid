"""
AgentID SDK Types

Pydantic models for credential verification.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentType(str, Enum):
    """Agent types supported by AgentID."""
    AUTONOMOUS = "autonomous"
    SUPERVISED = "supervised"
    HYBRID = "hybrid"


class IssuerType(str, Enum):
    """Issuer types."""
    INDIVIDUAL = "individual"
    ORGANIZATION = "organization"
    PLATFORM = "platform"


class ErrorCode(str, Enum):
    """Error codes returned by the AgentID verification API."""
    INVALID_REQUEST = "INVALID_REQUEST"
    MISSING_INPUT = "MISSING_INPUT"
    CREDENTIAL_NOT_FOUND = "CREDENTIAL_NOT_FOUND"
    CREDENTIAL_REVOKED = "CREDENTIAL_REVOKED"
    CREDENTIAL_EXPIRED = "CREDENTIAL_EXPIRED"
    CREDENTIAL_NOT_YET_VALID = "CREDENTIAL_NOT_YET_VALID"
    INVALID_SIGNATURE = "INVALID_SIGNATURE"
    ISSUER_NOT_FOUND = "ISSUER_NOT_FOUND"
    INTERNAL_ERROR = "INTERNAL_ERROR"
    NETWORK_ERROR = "NETWORK_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"


class IssuerInfo(BaseModel):
    """Information about the credential issuer."""
    issuer_id: str
    issuer_type: IssuerType
    issuer_verified: bool
    name: str


class CredentialConstraints(BaseModel):
    """Credential constraints (validity period, restrictions)."""
    valid_from: str
    valid_until: str
    geographic_restrictions: list[str] = Field(default_factory=list)
    allowed_services: list[str] = Field(default_factory=list)


class CredentialPayload(BaseModel):
    """Full credential payload as issued by AgentID."""
    credential_id: str
    agent_id: str
    agent_name: str
    agent_type: AgentType
    issuer: IssuerInfo
    permissions: dict[str, Any]
    constraints: CredentialConstraints
    issued_at: str
    signature: str


class VerifiedCredential(BaseModel):
    """Verified credential information returned on success."""
    agent_id: str
    agent_name: str
    agent_type: AgentType
    issuer: IssuerInfo
    permissions: dict[str, Any]
    valid_until: str


class VerifyError(BaseModel):
    """Error information returned on verification failure."""
    code: ErrorCode
    message: str
    request_id: Optional[str] = None


class VerifyResult(BaseModel):
    """Result of credential verification."""
    valid: bool
    credential: Optional[VerifiedCredential] = None
    error: Optional[VerifyError] = None
    verification_time_ms: Optional[int] = None
    request_id: Optional[str] = None


class BatchVerifySummary(BaseModel):
    """Summary statistics for batch verification."""
    total: int
    valid: int
    invalid: int


class BatchVerifyResultItem(BaseModel):
    """Individual result in batch verification."""
    index: int
    valid: bool
    credential: Optional[VerifiedCredential] = None
    error: Optional[VerifyError] = None


class BatchVerifyResult(BaseModel):
    """Result of batch credential verification."""
    results: list[BatchVerifyResultItem]
    summary: BatchVerifySummary
    verification_time_ms: int
    request_id: str


class ReputationInfo(BaseModel):
    """Reputation information for an agent."""
    trust_score: int
    verification_count: int
    success_rate: float
    credential_age_days: int
    issuer_verified: bool


class LeaderboardEntry(BaseModel):
    """Entry in the reputation leaderboard."""
    rank: int
    agent_id: str
    agent_name: str
    trust_score: int
    verification_count: int
    issuer_name: str
    issuer_verified: bool
