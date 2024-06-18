# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# Bundle app source
COPY env.local .env
COPY . .


# Your app binds to port 8080 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 8080

# Define the command to run your app using CMD which defines your runtime
CMD [ "npm", "start" ]
