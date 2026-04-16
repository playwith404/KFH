from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import import_models
from app.db.session import engine
from app.models.bait_template import BaitTemplate
from app.models.enums import BaitType, UserRole, UserStatus
from app.models.oath_document import OathDocument
from app.models.reward_catalog import RewardCatalog
from app.models.test import Test
from app.models.test_question import TestQuestion
from app.models.training_module import TrainingModule
from app.models.user import User


def create_tables() -> None:
    import_models()
    from app.db.base import Base

    Base.metadata.create_all(bind=engine)


def seed_data(db: Session) -> None:
    _seed_bait_templates(db)
    _seed_training_modules(db)
    _seed_tests(db)
    _seed_oath(db)
    _seed_rewards(db)
    _seed_demo_users(db)


def _seed_bait_templates(db: Session) -> None:
    exists = db.scalar(select(BaitTemplate.id).limit(1))
    if exists:
        return
    templates = [
        (
            BaitType.A,
            "급처 피해자형",
            "급전 필요해서 아이폰 15 Pro 50만원에 급처합니다. 직거래 어렵고 택배만 가능해요. 카톡 {messenger_id}",
        ),
        (
            BaitType.B,
            "대출 희망자형",
            "신용등급 낮은데 500만원 정도 대출 가능할까요? 급해서 조건 안 따집니다. 연락처 {phone}",
        ),
        (
            BaitType.C,
            "투자 입문자형",
            "주식 처음인데 수익률 좋은 리딩방 있을까요? 월 100만원까지 투자 가능해요. 카톡 {messenger_id}",
        ),
        (
            BaitType.D,
            "로맨스 취약자형",
            "[소개팅 앱 프로필] 외로워요. 진지하게 만날 분 찾습니다. 연락: {messenger_id}",
        ),
    ]
    for bait_type, title, body in templates:
        db.add(
            BaitTemplate(
                type=bait_type,
                title=title,
                body_template=body,
                is_active=True,
            )
        )
    db.commit()


def _seed_training_modules(db: Session) -> None:
    exists = db.scalar(select(TrainingModule.id).limit(1))
    if exists:
        return
    modules = [
        ("보이스피싱/스캠 개요", 30 * 60),
        ("대표 수법과 징후", 30 * 60),
        ("헌터 활동 범위/주의사항", 30 * 60),
        ("신고/증거 수집 가이드", 30 * 60),
    ]
    for title, seconds in modules:
        db.add(TrainingModule(title=title, duration_seconds=seconds, is_active=True))
    db.commit()


def _seed_tests(db: Session) -> None:
    existing = db.scalar(select(Test).where(Test.code == "hunter-qualification"))
    if existing:
        return
    test = Test(code="hunter-qualification", title="헌터 자격 테스트(10문항)", is_active=True)
    db.add(test)
    db.flush()

    questions = [
        ("상대가 먼저 연락해왔는가?", ["예", "아니오"], 0),
        ("선입금을 요구했는가?", ["예", "아니오"], 0),
        ("의심스러운 링크를 발송했는가?", ["예", "아니오"], 0),
        ("다른 메신저로 이동을 유도했는가?", ["예", "아니오"], 0),
        ("급하게 결정을 요구했는가?", ["예", "아니오"], 0),
        ("신원 확인을 회피했는가?", ["예", "아니오"], 0),
        ("계좌번호 또는 개인정보를 요구했는가?", ["예", "아니오"], 0),
        ("대화 내용이 전형적인 사기 수법과 일치하는가?", ["예", "아니오"], 0),
        ("헌터 활동에서 금지되는 것은?", ["직접 해킹 시도", "가상번호/ID로 미끼 배포"], 0),
        ("오탐 방지를 위한 교차검증 조건은?", ["2명 이상 독립 헌터", "1명 신고만으로 즉시 수사"], 0),
    ]
    for text, options, correct in questions:
        db.add(TestQuestion(test_id=test.id, question_text=text, options=options, correct_index=correct))
    db.commit()


def _seed_oath(db: Session) -> None:
    exists = db.scalar(select(OathDocument.id).limit(1))
    if exists:
        return
    content = """# 서약서\n\n- 본인은 허위 신고를 하지 않습니다.\n- 본인은 실명/실제 개인정보를 이용한 활동을 하지 않습니다.\n- 본인은 활동 중 알게 된 정보를 외부에 유출하지 않습니다.\n- 본인은 금지된 활동(해킹/침입)을 하지 않습니다.\n"""
    db.add(OathDocument(version=1, content_md=content, published_at=datetime.now(timezone.utc)))
    db.commit()


def _seed_rewards(db: Session) -> None:
    exists = db.scalar(select(RewardCatalog.id).limit(1))
    if exists:
        return
    items = [
        ("편의점 상품권 5,000원", 1000),
        ("커피 기프티콘 10,000원", 3000),
        ("통신비 할인 쿠폰 15,000원", 5000),
        ("문화상품권 30,000원", 10000),
    ]
    for title, cost in items:
        db.add(RewardCatalog(title=title, cost_points=cost, is_active=True))
    db.commit()


def _seed_demo_users(db: Session) -> None:
    # Create demo accounts if not exist
    users = [
        ("admin@kph.pjcloud.store", "admin1234", UserRole.ADMIN),
        ("police@kph.pjcloud.store", "police1234", UserRole.POLICE),
        ("hunter@kph.pjcloud.store", "hunter1234", UserRole.HUNTER),
    ]
    for email, password, role in users:
        exists = db.scalar(select(User).where(User.email == email))
        if exists:
            continue
        db.add(
            User(
                email=email,
                password_hash=hash_password(password),
                role=role,
                status=UserStatus.ACTIVE,
            )
        )
    db.commit()
