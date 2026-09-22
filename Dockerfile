FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY app.js ./app.js
COPY bin ./bin
COPY public ./public
COPY routes ./routes
COPY views ./views
EXPOSE 3000
CMD [ "node", "./bin/www" ]