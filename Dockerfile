FROM node:18-alpine

WORKDIR /usr/src/app

COPY src/* ./

RUN npm install --omit=dev

EXPOSE 8080
RUN adduser -D appuser
USER appuser

ENV PORT=8080

CMD ["node", "app.js"]
