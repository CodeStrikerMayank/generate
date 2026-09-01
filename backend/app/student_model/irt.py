import math
from typing import List, Tuple, Dict, Any

class ItemResponseTheory:
    """
    Item Response Theory (IRT) 2PL/3PL module.
    Estimates student latent ability (theta) and question information gain.
    """
    @staticmethod
    def difficulty_to_b_parameter(difficulty_01: float) -> float:
        """Converts normalized [0, 1] difficulty to IRT b parameter in [-2.5, +2.5]."""
        clamped = min(max(difficulty_01, 0.05), 0.95)
        # Logit scaling
        return round(math.log(clamped / (1.0 - clamped)) * 1.5, 3)

    @staticmethod
    def probability_correct(
        theta: float,
        difficulty_b: float,
        discrimination_a: float = 1.0,
        guessing_c: float = 0.25
    ) -> float:
        """
        3PL IRT probability curve: P(theta) = c + (1-c) / (1 + exp(-a*(theta - b)))
        """
        z = discrimination_a * (theta - difficulty_b)
        # Numerical stability clamp
        z = max(min(z, 20.0), -20.0)
        p_logistic = 1.0 / (1.0 + math.exp(-z))
        return guessing_c + (1.0 - guessing_c) * p_logistic

    @staticmethod
    def item_information(
        theta: float,
        difficulty_b: float,
        discrimination_a: float = 1.0,
        guessing_c: float = 0.25
    ) -> float:
        """
        Fisher Information of a question at ability level theta.
        Higher information indicates higher diagnostic power.
        """
        P = ItemResponseTheory.probability_correct(theta, difficulty_b, discrimination_a, guessing_c)
        z = discrimination_a * (theta - difficulty_b)
        z = max(min(z, 20.0), -20.0)
        p_logistic = 1.0 / (1.0 + math.exp(-z))
        q_logistic = 1.0 - p_logistic

        # I(theta) = a^2 * (p_logistic * q_logistic)^2 / P * (1 - guessing_c)^2 / (1 - P)
        numerator = (discrimination_a ** 2) * ((1.0 - guessing_c) ** 2) * (p_logistic ** 2) * (q_logistic ** 2)
        denominator = max(P * (1.0 - P), 1e-6)
        return numerator / denominator

    @classmethod
    def estimate_student_ability(
        cls,
        responses: List[Tuple[bool, float, float]],  # List of (is_correct, difficulty_01, discrimination)
        initial_theta: float = 0.0,
        max_iterations: int = 25
    ) -> float:
        """
        Estimates latent student ability theta using Newton-Raphson maximum likelihood.
        """
        if not responses:
            return initial_theta

        theta = initial_theta
        for _ in range(max_iterations):
            score_sum = 0.0
            info_sum = 0.0

            for is_correct, diff_01, disc in responses:
                b = cls.difficulty_to_b_parameter(diff_01)
                a = disc if disc > 0 else 1.0
                P = cls.probability_correct(theta, b, a, guessing_c=0.20)
                u = 1.0 if is_correct else 0.0

                score_sum += a * (u - P)
                info_sum += (a ** 2) * P * (1.0 - P)

            if info_sum <= 1e-5:
                break

            delta = score_sum / info_sum
            # Step size dampening for stability
            delta = max(min(delta, 0.75), -0.75)
            theta += delta

            if abs(delta) < 0.01:
                break

        return round(min(max(theta, -3.0), 3.0), 3)
