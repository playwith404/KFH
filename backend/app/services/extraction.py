from __future__ import annotations

import re
from dataclasses import dataclass

from app.models.enums import EntityType


_RE_URL = re.compile(r"https?://[^\s]+", re.IGNORECASE)
_RE_PHONE = re.compile(r"\b0\d{1,2}-\d{3,4}-\d{4}\b")
_RE_BANK_ACCOUNT = re.compile(r"\b\d{2,4}-\d{2,4}-\d{3,8}\b")
_RE_IP = re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b")


@dataclass(frozen=True)
class Extracted:
    entity_type: EntityType
    value_normalized: str
    value_masked: str
    confidence: float = 0.9


def extract_entities(text: str) -> list[Extracted]:
    found: list[Extracted] = []

    for url in _RE_URL.findall(text):
        norm = url.strip().rstrip(").,]")
        found.append(Extracted(EntityType.URL, norm, _mask_url(norm), 0.92))

    for phone in _RE_PHONE.findall(text):
        norm = phone
        found.append(Extracted(EntityType.PHONE, norm, _mask_phone(norm), 0.9))

    for acct in _RE_BANK_ACCOUNT.findall(text):
        norm = acct
        found.append(Extracted(EntityType.BANK_ACCOUNT, norm, _mask_account(norm), 0.88))

    for ip in _RE_IP.findall(text):
        found.append(Extracted(EntityType.IP, ip, _mask_ip(ip), 0.85))

    # Very lightweight messenger ID heuristics (demo)
    if "카톡" in text or "카카오" in text:
        m = re.search(r"(kph_[a-z0-9]{4,})", text, re.IGNORECASE)
        if m:
            mid = m.group(1)
            found.append(Extracted(EntityType.MESSENGER_ID, mid, _mask_messenger_id(mid), 0.75))

    # De-dup by (type, normalized)
    dedup: dict[tuple[EntityType, str], Extracted] = {}
    for item in found:
        key = (item.entity_type, item.value_normalized)
        if key not in dedup:
            dedup[key] = item
    return list(dedup.values())


def compute_indicator_hits(texts: list[str]) -> int:
    joined = "\n".join(texts).lower()
    hits = 0
    patterns = [
        # 1) 선입금 요구
        ["선입금", "먼저 입금", "수수료 먼저", "보증금", "입금부터"],
        # 2) 안전결제 사칭
        ["안전결제", "safe pay", "안전거래 링크", "안전결제 링크"],
        # 3) 타 플랫폼 이동
        ["카카오톡", "카톡", "텔레그램", "라인", "디엠", "dm"],
        # 4) 시간 압박
        ["지금 바로", "당장", "오늘 안에", "10분", "마감", "바로 처리"],
        # 5) 신원 확인 회피
        ["신분증 안", "사업자등록증 없", "확인 못", "말로만", "그건 곤란"],
    ]
    for group in patterns:
        if any(p in joined for p in group):
            hits += 1
    return hits


def _mask_phone(phone: str) -> str:
    parts = phone.split("-")
    if len(parts) != 3:
        return phone
    return f"{parts[0]}-***-{parts[2]}"


def _mask_account(acct: str) -> str:
    parts = acct.split("-")
    if len(parts) < 3:
        return acct
    return f"{parts[0]}-***-{parts[-1][-4:]}".rstrip("-")


def _mask_url(url: str) -> str:
    if len(url) <= 18:
        return url
    return url[:12] + "…" + url[-6:]


def _mask_ip(ip: str) -> str:
    parts = ip.split(".")
    if len(parts) != 4:
        return ip
    return f"{parts[0]}.{parts[1]}.***.***"


def _mask_messenger_id(mid: str) -> str:
    if len(mid) <= 4:
        return "***"
    return mid[:3] + "***"

