from pathlib import Path

from result import Err, Ok, Result

from djangobackend.exceptions import MuxingError, RedditAudioNotFound

VideoResult = Ok[Path] | Err[Exception]
AudioResult = Ok[Path] | Err[Exception]
MuxingResult = Result[str, MuxingError]
