from typing import Generic, TypeVar

E = TypeVar("E")


class Error(Generic[E]):
    def __init__(self, error: E):
        self.error = error

    def __str__(self) -> str:
        return str(self.error)
