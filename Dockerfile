FROM node:24-alpine

WORKDIR /home/app

# Copy dependency manifests first to maximize Docker layer cache re-use.
COPY ./app/package*.json ./
RUN npm ci --omit=dev

COPY ./app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]

