import re
import subprocess
from concurrent.futures import ALL_COMPLETED, ThreadPoolExecutor, wait
from pathlib import Path

import requests

from djangobackend.exceptions import (DownloadError, MuxingError,
                                      RedditAudioNotFound)
from djangobackend.settings import (CONTAINERED, REDDIT_VIDEOS,
                                    REDDIT_VIDEOS_STATIC)

VIDEO_RE = r"(https?://v\.redd\.it)/(\w+)/(\w+\.mp4)"


def mux_video(video_url: str) -> str | None:
    DL_DIR = Path(REDDIT_VIDEOS_STATIC) if CONTAINERED else Path(REDDIT_VIDEOS)
    match = re.match(VIDEO_RE, video_url)
    if match is None:
        return None
    base, video_id, _ = match.groups()
    ofile = DL_DIR / f"{video_id}.mp4"
    if ofile.exists():
        return f"{video_id}.mp4"
    vfile = DL_DIR / f"{video_id}_video.mp4"
    afile = DL_DIR / f"{video_id}_audio.mp4"
    audio_url = f"{base}/{video_id}/" + "DASH_{}.mp4"
    vresult, aresult = download(video_url, vfile, audio_url, afile)
    result = process_results(vresult, aresult, vfile, afile, ofile)
    cleanup(vfile, afile)
    return result


def download(video_url, vfile, audio_url, afile):
    with ThreadPoolExecutor(max_workers=2) as exc:
        vfuture = exc.submit(download_video, video_url, vfile)
        afuture = exc.submit(download_audio, audio_url, afile)
        wait([vfuture, afuture], return_when=ALL_COMPLETED)
        return vfuture.result(), afuture.result()


def download_video(url: str, filename: Path) -> str | Exception:
    try:
        r = requests.get(url)
        if r.status_code != 200:
            return DownloadError()
        with open(filename, "wb") as f:
            f.write(r.content)
        return filename
    except Exception as e:
        return e


def download_audio(url: str, filename: Path) -> str | Exception:
    try:
        post_fixes = ("audio", "AUDIO_128", "AUDIO_64")
        r = None
        for pf in post_fixes:
            r = requests.get(url.format(pf))
            if r.status_code == 200:
                break
            r = None
        if r is None:
            return RedditAudioNotFound()
        with open(filename, "wb") as f:
            f.write(r.content)
        return filename
    except Exception as e:
        return e


def mux(video: str, audio: str, output: Path) -> str | MuxingError:
    cmd = (
        'ffmpeg -y -i "{}" -i "{}" -c:v copy -c:a copy '
        '-async 1 -hide_banner -loglevel error "{}"'
    )
    cmd = cmd.format(video, audio, str(output))
    subprocess.run(cmd, shell=True)
    if Path(output).exists():
        return output.name
    return MuxingError()


def process_results(vresult, aresult, vfile, afile, ofile) -> str | None:
    if isinstance(vresult, Exception):
        return None
    if isinstance(aresult, Exception):
        vfile.rename(ofile)
        return ofile.name
    outfile = mux(vfile, afile, ofile)
    if isinstance(outfile, MuxingError):
        return None
    return outfile

def cleanup(*files) -> None:
    for file in files:
        try:
            Path(file).unlink()
        except (FileNotFoundError, OSError):
            pass
