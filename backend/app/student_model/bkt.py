from typing import List

class BayesianKnowledgeTracing:
    """
    Standard Bayesian Knowledge Tracing (BKT) Model.
    Tracks hidden latent knowledge state transitions P(L).
    """
    def __init__(
        self,
        p_init: float = 0.20,  # P(L_0) prior probability of knowing concept
        p_transit: float = 0.15,  # P(T) transition probability from unlearned to learned
        p_guess: float = 0.25,  # P(G) probability of guessing correctly
        p_slip: float = 0.10   # P(S) probability of slipping (wrong answer despite knowing)
    ):
        self.p_init = p_init
        self.p_transit = p_transit
        self.p_guess = p_guess
        self.p_slip = p_slip

    def update_single_step(self, current_p_known: float, is_correct: bool) -> float:
        """
        Updates knowledge probability after a single binary attempt observation.
        """
        p_known = current_p_known
        if is_correct:
            # P(L | correct) = P(L)*(1 - S) / [P(L)*(1 - S) + (1 - P(L))*G]
            numerator = p_known * (1.0 - self.p_slip)
            denominator = numerator + (1.0 - p_known) * self.p_guess
        else:
            # P(L | incorrect) = P(L)*S / [P(L)*S + (1 - P(L))*(1 - G)]
            numerator = p_known * self.p_slip
            denominator = numerator + (1.0 - p_known) * (1.0 - self.p_guess)

        p_learned_given_obs = numerator / max(denominator, 1e-7)

        # Transition step: P(L_next) = P(L|obs) + (1 - P(L|obs)) * P(T)
        p_next = p_learned_given_obs + (1.0 - p_learned_given_obs) * self.p_transit
        return round(min(max(p_next, 0.01), 0.99), 3)

    def compute_sequence_mastery(self, response_sequence: List[bool]) -> float:
        """
        Feeds a historical boolean response sequence through BKT to compute current state.
        """
        p = self.p_init
        for is_correct in response_sequence:
            p = self.update_single_step(p, is_correct)
        return p
