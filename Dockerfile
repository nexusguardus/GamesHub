FROM node:24-alpine

RUN apk add --no-cache git && npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile

COPY . .

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "index.js"]
