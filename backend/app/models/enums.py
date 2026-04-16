from __future__ import annotations

from enum import Enum


class UserRole(str, Enum):
    HUNTER = "HUNTER"
    POLICE = "POLICE"
    ADMIN = "ADMIN"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DELETED = "DELETED"


class HunterLevel(str, Enum):
    TRAINEE = "TRAINEE"
    ROOKIE = "ROOKIE"
    REGULAR = "REGULAR"
    ELITE = "ELITE"
    MASTER = "MASTER"


class BaitType(str, Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"


class DeploymentPlatform(str, Enum):
    DAANGN = "DAANGN"
    BUNJANG = "BUNJANG"
    CAFE = "CAFE"
    SNS = "SNS"
    ETC = "ETC"


class HuntSessionStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ENDED = "ENDED"


class MessageSender(str, Enum):
    SCAMMER = "SCAMMER"
    AI = "AI"
    SYSTEM = "SYSTEM"


class EntityType(str, Enum):
    BANK_ACCOUNT = "BANK_ACCOUNT"
    PHONE = "PHONE"
    URL = "URL"
    IP = "IP"
    MESSENGER_ID = "MESSENGER_ID"


class ReportStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED_BY_HUNTER = "SUBMITTED_BY_HUNTER"
    MONITORING = "MONITORING"
    AWAITING_POLICE = "AWAITING_POLICE"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CLOSED_NO_CONFIRM = "CLOSED_NO_CONFIRM"


class PoliceDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"
    MONITOR = "MONITOR"
    REQUEST_MORE = "REQUEST_MORE"


class RewardRedemptionStatus(str, Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    FULFILLED = "FULFILLED"
    REJECTED = "REJECTED"


class NotificationType(str, Enum):
    SESSION = "SESSION"
    REPORT = "REPORT"
    REWARD = "REWARD"
    SYSTEM = "SYSTEM"

