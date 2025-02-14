# Dockerfile for Fragments Microservice

# This file defines the instructions to build a Docker image for the Fragments
# microservice, which is a Node.js-based service. The image includes all the 
# necessary dependencies and configurations needed to run the application in 
# a containerized environment.

# 1. Use an official Node.js image as the base
# Use node version 22.13.0
FROM node:22.13.0

# 2. LABEL instruction adds key=value pairs with arbitrary metadata about the image
LABEL maintainer="Archi Kakadiya <akakadiya1@myseneca.ca>"
LABEL description="Fragments node.js microservice"

# 3. Define environment variables for the application
# We default to use port 8080 in our service
ENV PORT=8080

# Reduce npm spam when installing within Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#loglevel
ENV NPM_CONFIG_LOGLEVEL=warn

# Disable color when run inside Docker
# https://docs.npmjs.com/cli/v8/using-npm/config#color
ENV NPM_CONFIG_COLOR=false

# 4. Set up a working directory for the app
# Use /app as our working directory
WORKDIR /app

# 5. Copy package.json and package-lock.json

# Option 1: explicit path - Copy the package.json and package-lock.json
# files into /app. NOTE: the trailing `/` on `/app/`, which tells Docker
# that `app` is a directory and not a file.
COPY package*.json /app/

# Option 2: relative path - Copy the package.json and package-lock.json
# files into the working dir (/app).  NOTE: this requires that we have
# already set our WORKDIR in a previous step.
# COPY package*.json ./

# Option 3: explicit filenames - Copy the package.json and package-lock.json
# files into the working dir (/app), using full paths and multiple source
# files.  All of the files will be copied into the working dir `./app`
# COPY package.json package-lock.json ./

# 6. Install node dependencies defined in package-lock.json
RUN npm install

# 7. Copy the application source code into the container
# Copy src to /app/src/
COPY ./src ./src

# Copy our HTPASSWD file
COPY ./tests/.htpasswd ./tests/.htpasswd

# 8. Define the command to start the application
# Start the container by running our server
CMD npm start

# 9. Expose the required port for the service
# We run our service on port 8080
EXPOSE 8080
