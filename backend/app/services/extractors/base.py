"""Extractor interface + shared defensive-parsing helpers.

Contract with the LLM: strict JSON, no prose, no markdown fences. Local
models violate this often, so parsing is defensive: strip fences, fall back
to the first {...} span, retry once with a corrective prompt, and only then
give up — the caller marks the record needs_review with confidence 0
instead of crashing the sync.
"""
import json
import re
from abc import ABC, abstractmethod
from datetime import datetime

PLATFORMS = {"unstop", "direct", "other"}
EMAIL_TYPES = {
    "announcement",
    "registration_open",
    "registration_confirmed",
    "round_live",
    "submission_required",
    "submission_confirmed",
    "reminder",
    "round_clear",
    "rejection",
    "result",
    "other",
}


class ExtractionParseError(Exception):
    """The model returned output we could not turn into a valid extraction."""


class ExtractorUnavailable(Exception):
    """The LLM backend cannot be reached/used at all (Ollama down, missing
    API key, ...). Records stay unprocessed and are retried next run."""


class Extractor(ABC):
    @abstractmethod
    def extract(self, subject: str, body: str) -> dict:
        """Return the normalized extraction dict for one email.

        Raises ExtractionParseError if the model produced garbage twice,
        ExtractorUnavailable if the backend is unreachable.
        """


SYSTEM_PROMPT = (
    "You extract structured data about case competitions from emails. "
    "Respond with ONLY a single JSON object. No prose, no explanations, "
    "no markdown code fences."
)

USER_TEMPLATE = """Decide whether this email is about a case competition (or similar student/business competition) that the recipient participates in or could join — announcements, registration, shortlists, round results, deadlines, submissions, rejections, winners.

Reply with EXACTLY this JSON shape:
{{
  "is_relevant": true or false,
  "competition_name": "..." or null,
  "organizer": "..." or null,
  "platform": "unstop" or "direct" or "other",
  "deadline": "ISO 8601 datetime" or null,
  "round_number": integer or null,
  "email_type": "announcement" or "registration_open" or "registration_confirmed" or "round_live" or "submission_required" or "submission_confirmed" or "reminder" or "round_clear" or "rejection" or "result" or "other",
  "confidence": number between 0 and 1
}}

Rules:
- If the email is not competition-related, set is_relevant to false (other fields may be null).
- "registration_open": the recipient can still register/apply; this is pending registration.
- "registration_confirmed": registration/application is complete or confirmed.
- "round_live" or "submission_required": a current round/task/case/submission is open and action is required.
- "submission_confirmed": the recipient submitted/completed a round and is now waiting for results.
- "round_clear" means the recipient advanced or was shortlisted to a next round.
- "rejection" means not selected, not shortlisted, disqualified, did not qualify, or failed to advance.
- "result" means final winners/results/completion, not merely waiting for results.
- deadline: only when the email states one; convert it to ISO 8601, otherwise null.
- platform: "unstop" if it came via unstop.com, "direct" if directly from the organizing company, else "other".

Subject: {subject}
Body: {body}"""

CORRECTIVE_SUFFIX = (
    "\n\nIMPORTANT: Your previous reply was not valid JSON. Reply again with "
    "ONLY the JSON object described above — no other text whatsoever."
)


def build_user_prompt(subject: str, body: str) -> str:
    return USER_TEMPLATE.format(subject=subject, body=body)


def parse_llm_json(text: str) -> dict:
    """Strict-ish JSON parse with fence stripping and a first-object fallback."""
    cleaned = text.strip()
    fence = re.match(r"^```(?:json)?\s*(.*?)\s*```\s*$", cleaned, re.DOTALL)
    if fence:
        cleaned = fence.group(1).strip()
    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        span = re.search(r"\{.*\}", cleaned, re.DOTALL)  # prose around the object
        if span is None:
            raise ExtractionParseError("no JSON object found in model output")
        try:
            parsed = json.loads(span.group(0))
        except json.JSONDecodeError as exc:
            raise ExtractionParseError(f"invalid JSON in model output: {exc}")
    if not isinstance(parsed, dict):
        raise ExtractionParseError("model output is valid JSON but not an object")
    return parsed


def normalize_extraction(raw: dict) -> dict:
    """Coerce a parsed model reply into the exact schema the app stores.
    Lenient on recoverable sloppiness, strict on is_relevant."""
    is_relevant = raw.get("is_relevant")
    if isinstance(is_relevant, str) and is_relevant.lower() in ("true", "false"):
        is_relevant = is_relevant.lower() == "true"
    if not isinstance(is_relevant, bool):
        raise ExtractionParseError("missing or invalid is_relevant")

    try:
        confidence = min(1.0, max(0.0, float(raw.get("confidence"))))
    except (TypeError, ValueError):
        confidence = 0.5

    deadline = raw.get("deadline")
    if isinstance(deadline, str) and deadline.strip():
        try:
            parsed_dt = datetime.fromisoformat(deadline.strip().replace("Z", "+00:00"))
            if parsed_dt.tzinfo is not None:
                # App convention: naive local time everywhere.
                parsed_dt = parsed_dt.astimezone().replace(tzinfo=None)
            deadline = parsed_dt.isoformat()
        except ValueError:
            deadline = None
    else:
        deadline = None

    round_number = raw.get("round_number")
    try:
        round_number = int(round_number)
        if round_number < 1:
            round_number = None
    except (TypeError, ValueError):
        round_number = None

    platform = str(raw.get("platform") or "").strip().lower()
    if platform not in PLATFORMS:
        platform = "other"

    email_type = str(raw.get("email_type") or "").strip().lower()
    if email_type not in EMAIL_TYPES:
        email_type = "other"

    name = raw.get("competition_name")
    organizer = raw.get("organizer")

    return {
        "is_relevant": is_relevant,
        "competition_name": str(name).strip() if name else None,
        "organizer": str(organizer).strip() if organizer else None,
        "platform": platform,
        "deadline": deadline,
        "round_number": round_number,
        "email_type": email_type,
        "confidence": confidence,
    }


def run_with_retry(complete, subject: str, body: str) -> dict:
    """Shared extract() implementation: prompt -> parse -> normalize, with
    one corrective retry on parse failure. `complete(system, user) -> str`
    is the only backend-specific piece."""
    user = build_user_prompt(subject, body)
    last_error = None
    for attempt in (1, 2):
        prompt = user if attempt == 1 else user + CORRECTIVE_SUFFIX
        text = complete(SYSTEM_PROMPT, prompt)
        try:
            return normalize_extraction(parse_llm_json(text))
        except ExtractionParseError as exc:
            last_error = exc
    raise ExtractionParseError(f"unparseable model output after retry: {last_error}")
