"""Defensive JSON parse handling — the Phase 3 mandated test area."""
import pytest

from app.services.extractors.base import (
    CORRECTIVE_SUFFIX,
    ExtractionParseError,
    normalize_extraction,
    parse_llm_json,
    run_with_retry,
)

VALID = (
    '{"is_relevant": true, "competition_name": "HUL L.I.M.E.", "organizer": "HUL",'
    ' "platform": "unstop", "deadline": "2026-07-25T23:59:00", "round_number": 2,'
    ' "email_type": "round_clear", "confidence": 0.9}'
)


class TestParseLlmJson:
    def test_plain_json(self):
        assert parse_llm_json(VALID)["competition_name"] == "HUL L.I.M.E."

    def test_json_fence_stripped(self):
        assert parse_llm_json(f"```json\n{VALID}\n```")["is_relevant"] is True

    def test_bare_fence_stripped(self):
        assert parse_llm_json(f"```\n{VALID}\n```")["round_number"] == 2

    def test_prose_around_object(self):
        text = f"Sure! Here is the JSON you asked for:\n{VALID}\nHope that helps!"
        assert parse_llm_json(text)["platform"] == "unstop"

    def test_no_json_raises(self):
        with pytest.raises(ExtractionParseError):
            parse_llm_json("I cannot determine that from the email.")

    def test_broken_json_raises(self):
        with pytest.raises(ExtractionParseError):
            parse_llm_json('{"is_relevant": true, "competition_name": ')

    def test_json_array_raises(self):
        with pytest.raises(ExtractionParseError):
            parse_llm_json('["is_relevant", true]')


class TestNormalizeExtraction:
    def test_full_valid(self):
        data = normalize_extraction(
            {
                "is_relevant": True,
                "competition_name": " HUL L.I.M.E. ",
                "organizer": "HUL",
                "platform": "UNSTOP",
                "deadline": "2026-07-25T23:59:00",
                "round_number": "2",
                "email_type": "Round_Clear",
                "confidence": 0.9,
            }
        )
        assert data["competition_name"] == "HUL L.I.M.E."
        assert data["platform"] == "unstop"
        assert data["round_number"] == 2
        assert data["email_type"] == "round_clear"
        assert data["deadline"] == "2026-07-25T23:59:00"

    def test_stringly_typed_is_relevant(self):
        assert normalize_extraction({"is_relevant": "false"})["is_relevant"] is False

    def test_missing_is_relevant_raises(self):
        with pytest.raises(ExtractionParseError):
            normalize_extraction({"competition_name": "X"})

    def test_non_bool_is_relevant_raises(self):
        with pytest.raises(ExtractionParseError):
            normalize_extraction({"is_relevant": "maybe"})

    def test_garbage_platform_and_type_become_other(self):
        data = normalize_extraction(
            {"is_relevant": True, "platform": "LinkedIn", "email_type": "spam"}
        )
        assert data["platform"] == "other"
        assert data["email_type"] == "other"

    def test_competition_workflow_email_types_are_kept(self):
        for email_type in (
            "registration_open",
            "registration_confirmed",
            "round_live",
            "submission_required",
            "submission_confirmed",
        ):
            data = normalize_extraction({"is_relevant": True, "email_type": email_type})
            assert data["email_type"] == email_type

    def test_confidence_clamped_and_defaulted(self):
        assert normalize_extraction({"is_relevant": True, "confidence": 7})["confidence"] == 1.0
        assert normalize_extraction({"is_relevant": True, "confidence": -1})["confidence"] == 0.0
        assert normalize_extraction({"is_relevant": True})["confidence"] == 0.5
        assert normalize_extraction({"is_relevant": True, "confidence": "high"})["confidence"] == 0.5

    def test_bad_deadline_becomes_null(self):
        data = normalize_extraction({"is_relevant": True, "deadline": "next Friday"})
        assert data["deadline"] is None

    def test_date_only_deadline_parses(self):
        data = normalize_extraction({"is_relevant": True, "deadline": "2026-08-10"})
        assert data["deadline"] == "2026-08-10T00:00:00"

    def test_invalid_round_number_becomes_null(self):
        assert normalize_extraction({"is_relevant": True, "round_number": "two"})["round_number"] is None
        assert normalize_extraction({"is_relevant": True, "round_number": 0})["round_number"] is None


class TestRunWithRetry:
    def test_success_first_try_no_retry(self):
        calls = []

        def complete(system, user):
            calls.append(user)
            return VALID

        data = run_with_retry(complete, "subj", "body")
        assert data["is_relevant"] is True
        assert len(calls) == 1

    def test_retry_once_with_corrective_prompt(self):
        calls = []

        def complete(system, user):
            calls.append(user)
            return "garbage, not json" if len(calls) == 1 else VALID

        data = run_with_retry(complete, "subj", "body")
        assert data["competition_name"] == "HUL L.I.M.E."
        assert len(calls) == 2
        assert CORRECTIVE_SUFFIX not in calls[0]
        assert CORRECTIVE_SUFFIX in calls[1]

    def test_two_failures_raise(self):
        calls = []

        def complete(system, user):
            calls.append(user)
            return "still not json"

        with pytest.raises(ExtractionParseError):
            run_with_retry(complete, "subj", "body")
        assert len(calls) == 2  # exactly one retry, then give up

    def test_fenced_output_recovered_without_retry(self):
        calls = []

        def complete(system, user):
            calls.append(user)
            return f"```json\n{VALID}\n```"

        assert run_with_retry(complete, "s", "b")["is_relevant"] is True
        assert len(calls) == 1
