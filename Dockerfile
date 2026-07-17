# Multi-stage: build the React frontend with Node, then serve everything
# from the FastAPI backend in a single Python process (one Render service).
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
# FastAPI serves this at "/" (see app/main.py); API routes take precedence.
COPY --from=frontend /app/frontend/dist frontend/dist
WORKDIR /app/backend
ENV PORT=8000
# Render provides $PORT; bind 0.0.0.0 so it's reachable.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
