# Mgck

This project hosts a collection of web apps related to Kpop and Discord

## Features

1. [Red Velvet Gfys Archive](https://mgck.ink/gfys) - Browse High Quality Gfys of the famous Kpop girl group Red Velvet
2. [Kpop Comebacks](https://mgck.ink/kpop) - Stay ahead of the latest Kpop comebacks by your favourite groups. Search for any comebacks you may have missed.
3. [Emojify Your Messages](https://mgck.ink/emojify) - Use the emoji generator to improve your messages by 300%. Add an emoji between each word to impress everyone.
4. [Discord gifs](https://mgck.ink/discordgifs) - Create emotes and stickers for Discord from your video clips, complying with Discord's size limits.

## Setup

You will need the follow files to run this:

- .env
- docker-compose.yml
- nginx/conf.d/main.conf
- frontend/.env.local

Sample files are provided.

Start the app with:

```bash
docker-compose up -d
```

### Django styles

The Django Docker build compiles Tailwind CSS before packaging the app. Build it from the repository root:

```bash
docker build -f djangobackend/Dockerfile -t mgckdjangobackend:prod .
```

For local Django development, install the frontend dependencies and generate the stylesheet:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm run django:css:build
```

Use `pnpm run django:css:watch` while editing Django templates. Edit `djangobackend/urlshortener/static/css/input.css` or `djangobackend/tailwind.config.js` for custom styles. The generated `style.css` is ignored by Git; Django's `collectstatic` collects it but does not compile it.

## Contact

If you have any suggestions, feedback feel free to [open an issue.](https://github.com/badmagick329/mgck/issues)
