# Use an official Node.js runtime as the base image
FROM node:20.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the project files to the container
COPY . .

# build the project
RUN npm run build

# Expose the port on which the API will run
EXPOSE 3000

# Start the API
CMD [ "npm", "start" ]
