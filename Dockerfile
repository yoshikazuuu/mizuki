# Use the latest version of Node.js as the base image
FROM node:latest
RUN npm install -g pnpm
RUN npm install -g nodemon

# Create the directory!
RUN mkdir -p /mizuki
WORKDIR /mizuki

# Copy and Install our bot
COPY . /mizuki
RUN pnpm install

# Start the bot!
CMD ["npm", "run", "dev"]