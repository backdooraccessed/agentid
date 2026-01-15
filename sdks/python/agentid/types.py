"""AgentID SDK Type Definitions."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class CredentialStatus(str, Enum):
    """Status of a credential."""

    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class IssuerInfo(BaseModel):
    """Information about a credential issuer."""

    issuer_id: str
    name: str
    issuer_type: str | None = None
    domain: str | None = None
    is_verified: bool = False


class PermissionConditions(BaseModel):
    """Conditions that must be met for a permission to apply."""

    valid_hours: dict[str, str] | None = None  # {"start": "09:00", "end": "17:00"}
    valid_days: list[str] | None = None
    max_requests_per_minute: int | None = None
    max_requests_per_day: int | None = None
    max_records_per_request: int | None = None
    allowed_fields: list[str] | None = None
    allowed_regions: list[str] | None = None
    max_transaction_amount: float | None = None
    daily_spend_limit: float | None = None
    requires_approval: bool = False
    approval_webhook: str | None = None


class Permission(BaseModel):
    """A structured permission."""

    resource: str
    actions: list[str]
    conditions: PermissionConditions | None = None


class CredentialConstraints(BaseModel):
    """Constraints on a credential's validity."""

    valid_from: datetime
    valid_until: datetime
    allowed_domains: list[str] | None = None
    rate_limit: int | None = None


class CredentialPayload(BaseModel):
    """The full credential payload."""

    credential_id: str
    agent_id: str
    agent_name: str
    agent_type: str | None = None
    issuer: IssuerInfo
    permissions: list[str | Permission] = Field(default_factory=list)
    constraints: CredentialConstraints
    metadata: dict[str, Any] | None = None
    signature: str


class PermissionPolicyInfo(BaseModel):
    """Permission policy info returned during verification."""

    id: str
    name: str
    version: int


class VerificationResult(BaseModel):
    """Result of verifying a credential."""

    valid: bool
    credential: CredentialPayload | None = None
    error: str | None = None
    error_code: str | None = None
    trust_score: int | None = None
    issuer_verified: bool | None = None
    permission_policy: PermissionPolicyInfo | None = None
    live_permissions: bool | None = None


class ReputationInfo(BaseModel):
    """Reputation information for an agent."""

    trust_score: int
    verification_count: int
    success_rate: float | None = None
    incident_count: int = 0
    last_verified: datetime | None = None


class AgentInfo(BaseModel):
    """Full agent information including credential and reputation."""

    credential: CredentialPayload
    reputation: ReputationInfo | None = None
    status: CredentialStatus
