FROM node:24-alpine

WORKDIR /home/app

# Copy dependency manifests first to maximize Docker layer cache re-use.
COPY ./app/package*.json ./
RUN npm ci --omit=dev

COPY ./app ./

ARG CV_REPO=hamedtu/CV
ARG CV_REF=main
ENV CV_REPO=$CV_REPO
ENV CV_REF=$CV_REF
RUN npm run ingest:cv

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "server.js"]

