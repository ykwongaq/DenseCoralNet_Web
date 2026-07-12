import logging
import os
from logging.handlers import RotatingFileHandler

_FORMATTER = logging.Formatter(
    fmt="[%(levelname)s | %(name)s |  %(asctime)s ] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

_initialized = False


def setup_logging(log_dir: str, log_filename: str = "app.log") -> None:
    """Initialize the root logger with file and console handlers.

    Args:
        log_dir: Directory where log files will be written.
                 Created automatically if it doesn't exist.
        log_filename: Name of the log file. Defaults to "app.log".
    """
    global _initialized
    if _initialized:
        return

    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, log_filename)

    root = logging.getLogger()
    root.setLevel(logging.DEBUG)

    # File handler – rotates at 10 MB, keeps 5 backups
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10 * 1024 * 1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(_FORMATTER)

    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(_FORMATTER)

    root.addHandler(file_handler)
    root.addHandler(console_handler)

    _initialized = True


def get_logger(name: str) -> logging.Logger:
    """Return a named logger.

    Call once per module/class, e.g. get_logger(__name__).
    Make sure setup_logging() has been called first.
    """
    return logging.getLogger(name)
