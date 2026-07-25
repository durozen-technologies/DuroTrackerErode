"""Unit tests: bill amount math used by purchase/sale routes."""

import pytest


def _line_amount(quantity: float, rate: float) -> float:
    """Mirrors server recompute in purchases/sales routes."""
    return round(float(quantity) * float(rate), 2)


@pytest.mark.unit
def test_line_amount_basic():
    assert _line_amount(40, 100) == 4000.0


@pytest.mark.unit
def test_line_amount_rounds_to_paise():
    assert _line_amount(1.5, 33.33) == 49.99


@pytest.mark.unit
def test_balance_from_cash_upi():
    total = _line_amount(30, 120)
    cash, upi = 2000.0, 1600.0
    balance = round(total - (cash + upi), 2)
    assert total == 3600.0
    assert balance == 0.0
