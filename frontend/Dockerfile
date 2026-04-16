FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_WS_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_WS_BASE_URL=$VITE_WS_BASE_URL

COPY package.json package-lock.json /app/
RUN npm ci

COPY . /app/
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=build /app/dist /app/dist

EXPOSE 3700

CMD ["serve", "-s", "dist", "-l", "3700"]
