import datetime
from backend.app.student_model.retention import ForgettingModel

def test_retention_decay_over_time():
    model = ForgettingModel(base_half_life_days=7.0, floor_retention=0.35)
    now = datetime.datetime.now(datetime.timezone.utc)

    # Day 0: No decay
    r0 = model.calculate_retention(base_mastery=0.80, last_practiced_at=now, review_count=0, now=now)
    assert r0["retention_score"] == 1.0
    assert r0["effective_mastery"] == 0.80
    assert r0["forgetting_risk"] == 0.0

    # Day 7 (1 exact half-life for review_count=0): exactly 50% retention
    t7 = now + datetime.timedelta(days=7)
    r7 = model.calculate_retention(base_mastery=0.80, last_practiced_at=now, review_count=0, now=t7)
    assert 0.48 <= r7["retention_score"] <= 0.52
    assert r7["effective_mastery"] < 0.80
    assert r7["forgetting_risk"] > 0.48

    # Day 100: Clamps at floor retention, never destroying mastery completely to zero
    t100 = now + datetime.timedelta(days=100)
    r100 = model.calculate_retention(base_mastery=0.80, last_practiced_at=now, review_count=0, now=t100)
    assert r100["retention_score"] == 0.35
    assert r100["effective_mastery"] == round(0.80 * 0.35, 3)

def test_spaced_repetition_reinforcement():
    model = ForgettingModel(base_half_life_days=7.0)
    now = datetime.datetime.now(datetime.timezone.utc)
    t14 = now + datetime.timedelta(days=14)

    # Low review count (0 review) vs High review count (4 spaced reviews)
    r_single = model.calculate_retention(base_mastery=0.85, last_practiced_at=now, review_count=0, now=t14)
    r_reinforced = model.calculate_retention(base_mastery=0.85, last_practiced_at=now, review_count=4, now=t14)

    # Reinforced memory has higher retention after 14 days
    assert r_reinforced["retention_score"] > r_single["retention_score"]
    assert r_reinforced["forgetting_risk"] < r_single["forgetting_risk"]
