# Use the latest version of Node.js as the base image
FROM node:latest
RUN npm i -g pnpm

# Create the directory!
RUN mkdir -p /mizuki
WORKDIR /mizuki

# Copy and Install our bot
COPY . /mizuki
RUN pnpm i

# Start the bot!
CMD ["npm", "run", "deploy"]