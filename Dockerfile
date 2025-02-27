# Dockerfile for Fragments Microservice

# This file defines the instructions to build a Docker image for the Fragments
# microservice, which is a Node.js-based service. The image includes all the 
# necessary dependencies and configurations needed to run the application in 
# a containerized environment.

# ================================
# Stage 0: Install Dependencies
# ================================

# Using a minimal Node.js Alpine image for reduced storage size.
FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS dependencies

# Metadata labels for documentation and ownership
LABEL maintainer="Archi Kakadiya <akakadiya1@myseneca.ca>" \
      description="Fragments Node.js microservice"

# Set environment variables to optimize npm behavior
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn \
    NPM_CONFIG_COLOR=false

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install only necessary dependencies
COPY package*.json /app/

# Install only production dependencies (no dev dependencies)
RUN npm install --only=production


# ================================
# Stage 1: Build Application
# ================================

FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS build

WORKDIR /app

# Copy installed dependencies from the previous stage
COPY --from=dependencies /app/node_modules ./node_modules

COPY --from=dependencies /app/package*.json ./

# Copy the rest of the application source code
COPY . .


# ================================
# Stage 2: Final Runtime (Alpine)
# ================================

FROM node:22.14.0-alpine@sha256:9bef0ef1e268f60627da9ba7d7605e8831d5b56ad07487d24d1aa386336d1944 AS runtime

WORKDIR /app

# Copy built application from the previous build stage
COPY --from=build /app .

# Copy authentication file for basic auth if required
COPY ./tests/.htpasswd ./tests/.htpasswd

# Expose port 8080 for the microservice
EXPOSE 8080

# This ensures the service is running and accessible.
# It will check the status every 30 seconds.
# If it fails 3 times in a row, the container will be marked unhealthy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Defines the command that starts the microservice
CMD ["npm", "start"]
