from enum import Enum

class PartyType(str, Enum):
    SUPPLIER = "SUPPLIER"
    CUSTOMER = "CUSTOMER"

class UnitType(str, Enum):
    KG = "KG"
    UNIT = "UNIT"

class TransactionType(str, Enum):
    RECEIVED = "received"
    PAID = "paid"
