# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
# This leverages Docker's layer caching.
COPY package*.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the application's source code to the working directory
COPY . .

# Define the command to run the app
CMD ["npm", "start"]