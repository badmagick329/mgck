from result import Result

from djangobackend.exceptions import MuxingError, RedditAudioNotFound

VideoResult = Result[str, Exception]
AudioResult = Result[str, Exception | RedditAudioNotFound]
MuxingResult = Result[str, MuxingError]
