FROM python:3.10.10-bullseye AS builder

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml ./
COPY uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev --python 3.10

COPY ./djangobackend .

FROM python:3.10-slim-bullseye

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

RUN mkdir -p /uploads /redditvideos

ARG USERNAME=appuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m $USERNAME