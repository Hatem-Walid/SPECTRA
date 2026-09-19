"""
Pydantic request/response models for all endpoints.

NOTE: InsuranceInput matches API_CHEATSHEET.md exactly. IntrusionInput below
matches the 10-field example in API_CHEATSHEET.md (still flagged there as
"placeholder... swap for the actual feature shortlist once trained" — update
this file's IntrusionInput AND gemini_client.py's FIELD_SCHEMAS["intrusion"]
together, in sync, once the real shortlist from feature_importances_ is final.
"""

from typing import Literal

from pydantic import BaseModel


# ---------------------------------------------------------------------------
# Regression — /predict/regression
# ---------------------------------------------------------------------------

class InsuranceInput(BaseModel):
    age: int
    sex: Literal["male", "female"]
    bmi: float
    children: int
    smoker: Literal["yes", "no"]
    region: Literal["northeast", "northwest", "southeast", "southwest"]


class InsuranceOutput(BaseModel):
    predicted_charges: float


# ---------------------------------------------------------------------------
# Classification — /predict/classification
# Matches API_CHEATSHEET.md's current 10-field NSL-KDD example.
# `service` is left as a free string — NSL-KDD has dozens of service values
# (http, ftp, smtp, telnet, private, domain_u, ecr_i, ...) so a closed enum
# isn't practical here; validate against the model's known service list
# inside models.py instead if you want stricter checking.
# `flag` uses NSL-KDD's actual fixed set of connection-status codes.
# ---------------------------------------------------------------------------

from typing import Optional
from pydantic import BaseModel


class IntrusionInput(BaseModel):
    duration: Optional[float] = None
    protocol_type: Optional[str] = None
    service: Optional[str] = None
    flag: Optional[str] = None
    src_bytes: Optional[float] = None
    dst_bytes: Optional[float] = None
    land: Optional[int] = None
    wrong_fragment: Optional[int] = None
    urgent: Optional[int] = None
    hot: Optional[int] = None
    num_failed_logins: Optional[int] = None
    logged_in: Optional[int] = None
    num_compromised: Optional[int] = None
    root_shell: Optional[int] = None
    su_attempted: Optional[int] = None
    num_root: Optional[int] = None
    num_file_creations: Optional[int] = None
    num_shells: Optional[int] = None
    num_access_files: Optional[int] = None
    num_outbound_cmds: Optional[int] = None
    is_host_login: Optional[int] = None
    is_guest_login: Optional[int] = None
    count: Optional[float] = None
    srv_count: Optional[float] = None
    serror_rate: Optional[float] = None
    srv_serror_rate: Optional[float] = None
    rerror_rate: Optional[float] = None
    srv_rerror_rate: Optional[float] = None
    same_srv_rate: Optional[float] = None
    diff_srv_rate: Optional[float] = None
    srv_diff_host_rate: Optional[float] = None
    dst_host_count: Optional[float] = None
    dst_host_srv_count: Optional[float] = None
    dst_host_same_srv_rate: Optional[float] = None
    dst_host_diff_srv_rate: Optional[float] = None
    dst_host_same_src_port_rate: Optional[float] = None
    dst_host_srv_diff_host_rate: Optional[float] = None
    dst_host_serror_rate: Optional[float] = None
    dst_host_srv_serror_rate: Optional[float] = None
    dst_host_rerror_rate: Optional[float] = None
    dst_host_srv_rerror_rate: Optional[float] = None


class IntrusionOutput(BaseModel):
    # One of: normal, dos, probe, r2l, u2r (per API_CHEATSHEET.md)
    prediction: str
    confidence: float


# ---------------------------------------------------------------------------
# Image — /predict/image  (multipart/form-data, no request body model needed)
# ---------------------------------------------------------------------------

class TopKItem(BaseModel):
    label: str
    confidence: float


class LeafDiseaseOutput(BaseModel):
    prediction: str
    confidence: float
    top_3: list[TopKItem]


# ---------------------------------------------------------------------------
# Gemini-powered chat extraction — /extract
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ExtractRequest(BaseModel):
    model_type: Literal["insurance", "intrusion"]
    conversation: list[ChatMessage]
    memory: dict = {}


class ExtractResponse(BaseModel):
    reply: str
    ready: bool
    data: dict
    missing_fields: list[str]
