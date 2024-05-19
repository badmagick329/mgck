import logging
import sys


def get_stream_logger(log_level: int | None = None) -> logging.Logger:
    log_level = log_level or logging.DEBUG
    log = logging.getLogger(__name__)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
    )
    log.addHandler(handler)
    log.setLevel(log_level)
    return log
