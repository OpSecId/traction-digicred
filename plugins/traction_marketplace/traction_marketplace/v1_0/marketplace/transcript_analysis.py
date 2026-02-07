"""Transcript credential analysis: extract skills, courses, GPA, program."""

import json
import logging
from typing import Any

LOGGER = logging.getLogger(__name__)


def analyze_transcript(credential_data: dict) -> dict:
    """
    Analyze transcript credential data.

    Extracts skills, courses, GPA, program from transcript credential.
    Supports common formats: attributes (AnonCreds), credentialSubject (W3C).
    """
    skills: list[str] = []
    courses: list[dict] = []
    gpa: str | None = None
    program: str | None = None
    overview_parts: list[str] = []

    # Handle attributes format (AnonCreds-style)
    attrs = credential_data.get("attributes") or credential_data.get("credential_preview", {}).get("attributes") or []
    attr_map = {}
    if isinstance(attrs, list):
        for a in attrs:
            if isinstance(a, dict) and "name" in a and "value" in a:
                attr_map[a["name"].lower()] = a["value"]
    elif isinstance(attrs, dict):
        attr_map = {k.lower(): v for k, v in attrs.items()}

    # Handle credentialSubject format (W3C)
    if "credentialsubject" in credential_data:
        cs = credential_data["credentialSubject"]
    elif "credentialSubject" in credential_data:
        cs = credential_data["credentialSubject"]
    else:
        cs = {}

    # Extract GPA
    gpa = attr_map.get("gpa") or cs.get("gpa") or cs.get("cumulativeGradePointAverage")
    if gpa is not None:
        gpa = str(gpa)
        overview_parts.append(f"GPA: {gpa}")

    # Extract program/school
    program = attr_map.get("program") or attr_map.get("school") or cs.get("program") or cs.get("programName")
    if program:
        overview_parts.append(f"Program: {program}")

    # Extract transcript (courses)
    transcript_raw = attr_map.get("transcript") or cs.get("transcript") or cs.get("courseTranscript")
    if transcript_raw:
        try:
            if isinstance(transcript_raw, str):
                transcript_data = json.loads(transcript_raw)
            else:
                transcript_data = transcript_raw
            if isinstance(transcript_data, list):
                for c in transcript_data[:20]:  # Limit to 20 courses
                    if isinstance(c, dict):
                        courses.append({
                            "name": c.get("name") or c.get("courseName") or c.get("courseName") or "Unknown",
                            "grade": c.get("grade") or c.get("courseGrade"),
                            "credits": c.get("credits") or c.get("creditHours"),
                        })
                        # Infer skills from course names
                        name = c.get("name") or c.get("courseName") or ""
                        if name and name not in skills:
                            skills.append(name)
            elif isinstance(transcript_data, dict):
                items = transcript_data.get("courses") or transcript_data.get("courseTranscript") or []
                for c in (items or [])[:20]:
                    if isinstance(c, dict):
                        courses.append({
                            "name": c.get("name") or c.get("courseName") or "Unknown",
                            "grade": c.get("grade") or c.get("courseGrade"),
                            "credits": c.get("credits") or c.get("creditHours"),
                        })
        except (json.JSONDecodeError, TypeError):
            LOGGER.warning("Could not parse transcript data")

    # Build overview
    overview = None
    if overview_parts:
        overview = " | ".join(overview_parts)
    if courses and not overview:
        overview = f"{len(courses)} courses"

    return {
        "skills": skills[:15],
        "courses": courses,
        "gpa": gpa,
        "program": program,
        "overview": overview,
    }
