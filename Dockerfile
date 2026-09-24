FROM node:24-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3000 DATA_DIR=/app/data
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund
COPY server.cjs store.cjs game.cjs cards.cjs default-board.json ./
COPY public ./public
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "server.cjs"]
