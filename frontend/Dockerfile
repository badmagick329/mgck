FROM node:20-alpine AS deploy
WORKDIR /app
RUN npm install --global pm2
COPY .env.local ./.env.local
COPY package.json package-lock.json ./
COPY next.config.js ./next.config.js
COPY tsconfig.json ./tsconfig.json
COPY tailwind.config.ts ./tailwind.config.ts
COPY postcss.config.js ./postcss.config.js
COPY ./src ./src
RUN npm ci
# ENV HOSTNAME "0.0.0.0"
RUN npm run build
EXPOSE 3000
RUN chown -R node /app
USER node
CMD [ "pm2-runtime", "npm", "--", "start" ]
