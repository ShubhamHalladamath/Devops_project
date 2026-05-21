# ==============================================
# Build Stage: Compile Vite Production Code
# ==============================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors first to maximize layer caching efficiency
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Support injecting a custom API URL during Docker build stage
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build client production bundles
RUN npm run build

# ==============================================
# Run Stage: Serve static assets using Nginx
# ==============================================
FROM nginx:stable-alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from compiling phase
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
