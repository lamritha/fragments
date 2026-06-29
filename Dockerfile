# Dockerfile for the fragments Node.js microservice

############### Stage 1: Build/Install dependencies ###############
FROM node:22.12.0-alpine AS dependencies

LABEL maintainer="Amritha Lingeswaran <alingeswaran1@myseneca.ca>"
LABEL description="Fragments node.js microservice"

WORKDIR /app

COPY package*.json ./

# Install only production dependencies, using package-lock.json for reproducibility
RUN npm ci --omit=dev

############### Stage 2: Production image ###############
FROM node:22.12.0-alpine AS production

ENV NODE_ENV=production
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

WORKDIR /app

# Copy only the installed node_modules from the dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

COPY package*.json ./
COPY ./src ./src
COPY ./tests/.htpasswd ./tests/.htpasswd

# Run as the existing non-root `node` user instead of root
USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "src/index.js"]
