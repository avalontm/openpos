FROM oven/bun:latest

WORKDIR /app

# Copy package.json and lock file (if any) first for better caching
COPY package.json bun.lock* package-lock.json* ./

# Install dependencies (using bun)
RUN bun install

# Copy the rest of the application
COPY . .

# Set environment variable to ensure terminal colors/formatting
ENV TERM=xterm-256color
ENV NODE_ENV=development

# Set entrypoint to the application main file
# This allows passing arguments like 'add user' directly
ENTRYPOINT ["bun", "src/app.tsx"]
