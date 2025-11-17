FROM node:18-alpine

WORKDIR /usr/src/app

# Copy package.json only
COPY package.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy all application files
COPY src/ ./

# Create non-root user
RUN adduser -D appuser
USER appuser

EXPOSE 8080
ENV PORT=8080

CMD ["node", "app.js"]
