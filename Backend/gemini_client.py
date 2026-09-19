"""
Conversational field extraction backed by the Gemini API.

Stateless by design (matches this project's "no database" architecture):
the frontend sends the FULL conversation history on every call, and this
module has no memory between requests. Gemini reads the whole thread,
decides what it still needs, and either asks a follow-up question or
declares the form complete.

Setup:
    pip install requests python-dotenv
    # backend/.env (never commit this file):
    GEMINI_API_KEY=your-key-here
"""

import json
import os
from pathlib import Path
from dotenv import load_dotenv
import requests

# التأكد من تحميل المفتاح بدقة
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

GEMINI_MODEL = "gemini-2.5-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

# ---------------------------------------------------------------------------
# الـ 41 عمود كاملين لموديل الاختراق KDD Cup 99
# ---------------------------------------------------------------------------

FIELD_SCHEMAS = {
    "insurance": {
        "age": {"type": "INTEGER", "description": "Age in whole years"},
        "sex": {"type": "STRING", "enum": ["male", "female"]},
        "bmi": {"type": "NUMBER", "description": "Body mass index"},
        "children": {"type": "INTEGER", "description": "Number of dependents"},
        "smoker": {"type": "STRING", "enum": ["yes", "no"]},
        "region": {
            "type": "STRING",
            "enum": ["northeast", "northwest", "southeast", "southwest"],
        },
    },
    "intrusion": {
        "duration": {"type": "NUMBER", "description": "Connection duration in seconds"},
        "protocol_type": {"type": "STRING", "enum": ["tcp", "udp", "icmp"]},
        "service": {"type": "STRING", "description": "Network service, e.g. http, ftp, smtp, private, ecr_i"},
        "flag": {"type": "STRING", "description": "Connection status flag, e.g. SF, S0, REJ, RSTR"},
        "src_bytes": {"type": "NUMBER", "description": "Bytes from source to destination"},
        "dst_bytes": {"type": "NUMBER", "description": "Bytes from destination to source"},
        "land": {"type": "INTEGER", "description": "1 if connection is from/to the same host/port; 0 otherwise"},
        "wrong_fragment": {"type": "INTEGER", "description": "Number of wrong fragments"},
        "urgent": {"type": "INTEGER", "description": "Number of urgent packets"},
        "hot": {"type": "INTEGER", "description": "Number of hot indicators"},
        "num_failed_logins": {"type": "INTEGER", "description": "Number of failed login attempts"},
        "logged_in": {"type": "INTEGER", "description": "1 if successfully logged in; 0 otherwise"},
        "num_compromised": {"type": "INTEGER", "description": "Number of compromised conditions"},
        "root_shell": {"type": "INTEGER", "description": "1 if root shell is obtained; 0 otherwise"},
        "su_attempted": {"type": "INTEGER", "description": "1 if su root command attempted; 0 otherwise"},
        "num_root": {"type": "INTEGER", "description": "Number of root accesses"},
        "num_file_creations": {"type": "INTEGER", "description": "Number of file creation operations"},
        "num_shells": {"type": "INTEGER", "description": "Number of shell prompts"},
        "num_access_files": {"type": "INTEGER", "description": "Number of operations on access control files"},
        "num_outbound_cmds": {"type": "INTEGER", "description": "Number of outbound commands in an ftp session"},
        "is_host_login": {"type": "INTEGER", "description": "1 if the login belongs to the host; 0 otherwise"},
        "is_guest_login": {"type": "INTEGER", "description": "1 if the login is a guest login; 0 otherwise"},
        "count": {"type": "NUMBER", "description": "Connections to the same host as current connection in the past two seconds"},
        "srv_count": {"type": "NUMBER", "description": "Connections to the same service as current connection in the past two seconds"},
        "serror_rate": {"type": "NUMBER", "description": "% of connections that have SYN errors"},
        "srv_serror_rate": {"type": "NUMBER", "description": "% of connections to the same service that have SYN errors"},
        "rerror_rate": {"type": "NUMBER", "description": "% of connections that have REJ errors"},
        "srv_rerror_rate": {"type": "NUMBER", "description": "% of connections to the same service that have REJ errors"},
        "same_srv_rate": {"type": "NUMBER", "description": "% of connections to the same service"},
        "diff_srv_rate": {"type": "NUMBER", "description": "% of connections to different services"},
        "srv_diff_host_rate": {"type": "NUMBER", "description": "% of connections to different hosts"},
        "dst_host_count": {"type": "NUMBER", "description": "Destination host count"},
        "dst_host_srv_count": {"type": "NUMBER", "description": "Destination host service count"},
        "dst_host_same_srv_rate": {"type": "NUMBER", "description": "% of connections to the same service on dst host"},
        "dst_host_diff_srv_rate": {"type": "NUMBER", "description": "% of connections to different services on dst host"},
        "dst_host_same_src_port_rate": {"type": "NUMBER", "description": "% of connections to the same source port on dst host"},
        "dst_host_srv_diff_host_rate": {"type": "NUMBER", "description": "% of connections to different hosts on dst host"},
        "dst_host_serror_rate": {"type": "NUMBER", "description": "% of connections that have SYN errors on dst host"},
        "dst_host_srv_serror_rate": {"type": "NUMBER", "description": "% of connections that have SYN errors to same service on dst host"},
        "dst_host_rerror_rate": {"type": "NUMBER", "description": "% of connections that have REJ errors on dst host"},
        "dst_host_srv_rerror_rate": {"type": "NUMBER", "description": "% of connections that have REJ errors to same service on dst host"},
    },
}

_ORDERED_INTRUSION_KEYS = list(FIELD_SCHEMAS["intrusion"].keys())


def _system_instruction(model_type: str, memory: dict) -> str:
    fields = FIELD_SCHEMAS[model_type]
    field_list = ", ".join(fields.keys())
    known = {k: v for k, v in (memory or {}).items() if v is not None}
    known_note = (
        f"\n\nFields already confirmed and stored in memory: {json.dumps(known)}"
        if known
        else ""
    )
    return (
        "You are an intelligent data-collection assistant embedded in a machine learning dashboard. "
        f"Your mission is to collect these exact fields: {field_list}."
        f"{known_note}\n\n"
        "Rules:\n"
        "1. If the user provides a CSV row or a list of comma-separated values, parse and map the values "
        "sequentially to the required fields in order.\n"
        "2. Merge new values into memory. DO NOT clear or forget already confirmed fields.\n"
        "3. Never guess or invent values.\n"
        "4. If ANY fields are missing:\n"
        "   - set ready=false.\n"
        "   - put all missing field names in `missing_fields`.\n"
        "   - in `reply`, inform the user which fields were successfully recorded and politely ask them to provide "
        "the missing field(s) to proceed.\n"
        "5. If ALL required fields are present with valid values:\n"
        "   - set ready=true, missing_fields=[].\n"
        "   - in `reply`, write a concise confirmation (e.g. 'All 41 parameters received. Running prediction now...').\n"
        "6. Reply in the same language the user is speaking."
    )


def _response_schema(model_type: str) -> dict:
    fields = FIELD_SCHEMAS[model_type]
    return {
        "type": "OBJECT",
        "properties": {
            "reply": {
                "type": "STRING",
                "description": "Short conversational response to the user.",
            },
            "ready": {
                "type": "BOOLEAN",
                "description": "True only when every field is confident and non-null.",
            },
            "data": {"type": "OBJECT", "properties": fields},
            "missing_fields": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
        },
        "required": ["reply", "ready", "data", "missing_fields"],
    }

def run_extraction(
    model_type: str, conversation: list[dict], memory: dict | None = None
) -> dict:
    if model_type not in FIELD_SCHEMAS:
        raise ValueError(f"Unknown model_type: {model_type!r}")
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not set (check backend/.env)")

    memory = memory or {}
    last_user_msg = ""
    for turn in reversed(conversation):
        if turn.get("role") == "user":
            last_user_msg = turn.get("content", "")
            break

    # محاولة الاستخراج عبر Google Gemini
    try:
        contents = [
            {
                "role": "model" if turn["role"] == "assistant" else "user",
                "parts": [{"text": turn["content"]}],
            }
            for turn in conversation
        ]

        payload = {
            "system_instruction": {
                "parts": [{"text": _system_instruction(model_type, memory)}]
            },
            "contents": contents,
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": _response_schema(model_type),
                "temperature": 0.1,
            },
        }

        resp = requests.post(
            GEMINI_URL,
            params={"key": GEMINI_API_KEY},
            json=payload,
            timeout=25,
        )

        if resp.status_code == 200:
            raw = resp.json()
            text = raw["candidates"][0]["content"]["parts"][0]["text"]
            result = json.loads(text)
        else:
            # في حال تجاوز الـ Rate Limit أو أي خطأ من جوجل ننتقل للـ Fallback
            result = {"data": {}, "reply": "Processing your input directly..."}

    except Exception:
        # حماية كاملة من الانهيار
        result = {"data": {}, "reply": "Extracted parameters directly."}

    # ================= Fallback الذكي للـ CSV =================
    # لو اليوزر رافع أو كاتب CSV وجيميناي وقع، الكود يفكك الـ CSV بنفسه
    gemini_data = result.get("data") or {}

    if model_type == "intrusion" and "," in last_user_msg:
        # فك الأرقام المفصولة بفاصلة تلقائياً
        clean_lines = [
            line.strip()
            for line in last_user_msg.split("\n")
            if line.strip() and not line.startswith("📁") and not line.startswith("```")
        ]
        if clean_lines:
            target_line = clean_lines[-1]  # السطر الأخير اللي فيه القيم
            vals = [v.strip() for v in target_line.split(",")]
            keys = list(FIELD_SCHEMAS["intrusion"].keys())
            for i, val in enumerate(vals[: len(keys)]):
                try:
                    gemini_data[keys[i]] = float(val) if "." in val else int(val)
                except ValueError:
                    gemini_data[keys[i]] = val

    # دمج القيم مع الذاكرة السابقة (Hold State)
    merged = {**memory, **{k: v for k, v in gemini_data.items() if v is not None}}
    for field in FIELD_SCHEMAS[model_type]:
        merged.setdefault(field, None)

    missing = [k for k, v in merged.items() if v is None]

    # صياغة الرد إذا لم يكن هناك رد مسبق
    if not result.get("reply") or result.get("reply") == "":
        if missing:
            result["reply"] = (
                f"Saved {len(merged) - len(missing)} fields. Still missing: {', '.join(missing[:4])}..."
            )
        else:
            result["reply"] = (
                "All parameters received successfully! Running inference..."
            )

    result["data"] = merged
    result["missing_fields"] = missing
    result["ready"] = len(missing) == 0

    return result