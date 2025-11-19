from typing import Generic, TypeVar, Union, cast

T = TypeVar("T")
E = TypeVar("E")


class Result(Generic[T, E]):
    def __init__(self, value: Union[T, None] = None, error: Union[E, None] = None):
        if value is not None and error is not None:
            raise ValueError("Cannot have both value and error")
        if value is None and error is None:
            raise ValueError("Must have either value or error")
        self.value = value
        self.error = error

    @property
    def is_ok(self) -> bool:
        return self.value is not None

    @property
    def is_err(self) -> bool:
        return self.error is not None

    def unwrap(self) -> T:
        if self.is_err:
            raise ValueError(f"Unwrapped an error: {self.error}")
        return cast(T, self.value)

    def unwrap_err(self) -> E:
        if self.is_ok:
            raise ValueError(f"Unwrapped a value: {self.value}")
        return cast(E, self.error)


def Ok(value: T):
    return Result(value=value)


def Err(error: E):
    return Result(error=error)
