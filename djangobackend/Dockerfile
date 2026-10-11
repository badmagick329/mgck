FROM node:22-alpine AS styles

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts

COPY djangobackend /app/djangobackend
RUN pnpm run django:css:build

FROM python:3.10-bookworm AS builder

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml ./
COPY uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev --python 3.10

COPY ./djangobackend .
# The runtime needs the compiled stylesheet, not Node or the CSS build tools.
COPY --from=styles /app/djangobackend/urlshortener/static/css/style.css ./urlshortener/static/css/style.css

FROM python:3.10-slim-bookworm

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy the virtual environment from builder
COPY --from=builder /usr/src/app/.venv /usr/src/app/.venv

# Copy the application code
COPY --from=builder /usr/src/app /usr/src/app

# Add venv to PATH
ENV PATH="/usr/src/app/.venv/bin:$PATH"

# UID 1000 matches the VPS owner of the uploads and reddit-video bind mounts, so
# files stay manageable from the host. Only the write paths belong to appuser: a
# compromised worker cannot rewrite the code or venv. A new staticfiles volume
# copies this directory's ownership; an existing one must be chowned once.
ARG USERNAME=appuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m $USERNAME && \
    mkdir -p /uploads /redditvideos /usr/src/app/staticfiles && \
    chown $USERNAME:$USERNAME /uploads /redditvideos /usr/src/app/staticfiles

USER $USERNAME

