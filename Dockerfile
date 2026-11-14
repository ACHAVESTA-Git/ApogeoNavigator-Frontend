# --- build ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- serve ---
FROM nginx:1.27-alpine
# La imagen sustituye ${BACKEND_URL} al arrancar (plantillas en /etc/nginx/templates).
ENV BACKEND_URL=http://backend:8080 NGINX_ENVSUBST_FILTER=BACKEND_URL
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
