import re
import subprocess
from pathlib import Path

import requests

from djangobackend.exceptions import DownloadError, RedditAudioNotFound
from djangobackend.settings import (CONTAINERED, REDDIT_VIDEOS,
                                    REDDIT_VIDEOS_STATIC)

VIDEO_RE = r"(https?://v\.redd\.it)/(\w+)/(\w+\.mp4)"


def mux_video(video_url: str) -> str | None:
    DL_DIR = Path(REDDIT_VIDEOS_STATIC) if CONTAINERED else Path(REDDIT_VIDEOS)
    match = re.match(VIDEO_RE, video_url)
    if match is None:
        return None
    base, id_, _ = match.groups()
    ofile = DL_DIR / f"{id_}.mp4"
    if ofile.exists():
        return f"{id_}.mp4"
    vfile = DL_DIR / f"{id_}_video.mp4"
    afile = DL_DIR / f"{id_}_audio.mp4"
    if download_audio(video_url, vfile) is None:
        return None
    result = download_audio(f"{base}/{id_}/" + "DASH_{}.mp4", afile)
    if isinstance(result, RedditAudioNotFound):
        vfile.rename(ofile)
        return f"{id_}.mp4"
    elif isinstance(result, DownloadError):
        return None
    outfile = mux(vfile, afile, ofile)
    if outfile is None:
        return None
    cleanup(vfile, afile)
    return outfile


def download_audio(url: str, filename: Path) -> str | Exception:
    post_fixes = ("audio", "AUDIO_128", "AUDIO_64")
    r = None
    for pf in post_fixes:
        r = requests.get(url.format(pf))
        if r.status_code == 200:
            break
    if r is None:
        return RedditAudioNotFound()
    with open(filename, "wb") as f:
        f.write(r.content)
    return filename


def mux(video: str, audio: str, output: Path) -> str | None:
    cmd = 'ffmpeg -y -i "{}" -i "{}" -c:v copy -c:a copy -async 1 "{}"'
    cmd = cmd.format(video, audio, str(output))
    subprocess.run(cmd, shell=True)
    if Path(output).exists():
        return output.name


def cleanup(video: str, audio: str) -> None:
    try:
        Path(video).unlink()
    except (FileNotFoundError, OSError):
        pass
    try:
        Path(audio).unlink()
    except (FileNotFoundError, OSError):
        pass
