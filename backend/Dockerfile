FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Ensure uploads directory exists and is ready for persistent volume mount
RUN mkdir -p /app/uploads

EXPOSE 4000

ENV PORT=4000 \
    NODE_ENV=production

VOLUME ["/app/uploads"]

CMD ["npm", "start"]
