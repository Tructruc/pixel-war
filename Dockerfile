FROM node:latest
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM alpine:latest
RUN apk add --no-cache nodejs npm caddy tini

WORKDIR /app

COPY backend/package*.json ./backend/
RUN npm ci --prefix ./backend


COPY --from=0 /app/build ./frontend/build
COPY Caddyfile .
COPY run-prod.sh .
COPY --chown=1000:1000 backend ./backend
RUN chmod +x ./run-prod.sh
USER 1000:1000

EXPOSE 80
ENTRYPOINT ["/sbin/tini", "--"]

CMD ["./run-prod.sh"]


