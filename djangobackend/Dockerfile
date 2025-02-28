FROM python:3.10.10-bullseye AS builder

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg cron && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip && \
    pip install poetry==1.8.2

COPY pyproject.toml poetry.lock ./
RUN poetry config virtualenvs.create false && \
    poetry install --no-root --without dev

COPY ./djangobackend .
COPY crontab /etc/cron.d/crontab

FROM python:3.10-slim-bullseye

WORKDIR /usr/src/app

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg cron && \
    rm -rf /var/lib/apt/lists/*

# Copy Python packages installed in the builder stage
COPY --from=builder /usr/local /usr/local

# Copy the application code
COPY --from=builder /usr/src/app /usr/src/app

RUN mkdir -p /uploads /redditvideos

COPY --from=builder /etc/cron.d/crontab /etc/cron.d/crontab
RUN chmod 0644 /etc/cron.d/crontab && \
    crontab /etc/cron.d/crontab && \
    touch /var/log/cron.log

ARG USERNAME=appuser
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME && \
    useradd --uid $USER_UID --gid $USER_GID -m $USERNAME
