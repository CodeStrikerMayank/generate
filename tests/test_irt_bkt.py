from backend.app.student_model.bkt import BayesianKnowledgeTracing
from backend.app.student_model.irt import ItemResponseTheory

def test_bkt_forward_updates():
    bkt = BayesianKnowledgeTracing(p_init=0.20, p_transit=0.15, p_guess=0.25, p_slip=0.10)

    # Correct answer increases knowledge probability
    p1 = bkt.update_single_step(0.20, is_correct=True)
    assert p1 > 0.20

    # Continuous correct answers drive mastery towards ~1.0
    p_seq = bkt.compute_sequence_mastery([True, True, True, True, True])
    assert p_seq >= 0.90

    # Series of failures drives mastery down
    p_fail = bkt.compute_sequence_mastery([False, False, False])
    assert p_fail < p_seq

def test_irt_probability_and_information():
    # Student theta = 1.0 (above average ability) facing difficulty b = 0.0
    p_easy = ItemResponseTheory.probability_correct(theta=1.0, difficulty_b=0.0, discrimination_a=1.5)
    # Student theta = -1.0 (below average ability) facing difficulty b = 0.0
    p_hard = ItemResponseTheory.probability_correct(theta=-1.0, difficulty_b=0.0, discrimination_a=1.5)

    assert p_easy > p_hard
    assert 0.70 <= p_easy <= 0.95
    assert 0.20 <= p_hard <= 0.45

    # Fisher information is highest near theta == b
    info_matched = ItemResponseTheory.item_information(theta=0.5, difficulty_b=0.5, discrimination_a=1.5)
    info_mismatched = ItemResponseTheory.item_information(theta=3.0, difficulty_b=-2.0, discrimination_a=1.5)
    assert info_matched > info_mismatched

def test_irt_ability_estimation():
    # Student answered hard questions correctly (difficulty 0.8)
    responses_high = [(True, 0.8, 1.5), (True, 0.7, 1.2), (True, 0.9, 1.8)]
    theta_high = ItemResponseTheory.estimate_student_ability(responses_high)

    # Student failed easy questions (difficulty 0.3)
    responses_low = [(False, 0.3, 1.2), (False, 0.2, 1.0), (False, 0.4, 1.4)]
    theta_low = ItemResponseTheory.estimate_student_ability(responses_low)

    assert theta_high > 0.0
    assert theta_low < 0.0
    assert theta_high > theta_low
