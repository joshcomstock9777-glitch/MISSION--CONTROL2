FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.mjs ./
COPY public ./public
COPY data ./data
ENV NODE_ENV=production
ENV PORT=3030
EXPOSE 3030
CMD ["node", "server.mjs"]
