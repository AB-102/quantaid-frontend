# Production image for the Docker-route selfhost (quantaid-infra/selfhost/docker).
# VITE_BACKEND_URL is baked in at build time; CI passes it as a build arg.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_BACKEND_URL
RUN npm run build

FROM nginx:1.30.6-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
