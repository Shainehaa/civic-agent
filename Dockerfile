# --- Stage 1: install dependencies and build the app ---
FROM node:20-slim AS builder
WORKDIR /app

# Copy only package files first so Docker can cache the npm install step
# and skip re-running it if your code changes but dependencies don't.
COPY package.json package-lock.json ./
RUN npm ci

# Now copy the rest of the source code and build it.
COPY . .
RUN npm run build

# --- Stage 2: run the app using only what's needed ---
# Using a fresh, slim image here keeps the final container small —
# none of the build tools or dev dependencies from Stage 1 are included.
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Thanks to `output: "standalone"` in next.config.js, everything needed
# to run the app in production lives in .next/standalone.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Cloud Run sets the PORT environment variable itself and expects the
# container to listen on it — defaulting to 8080 here for local testing.
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.js"]
