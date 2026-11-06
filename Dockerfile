# =============================================================================
# Stage 1: Build Frontend (React + Vite)
# =============================================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# =============================================================================
# Stage 2: Runtime Backend (FastAPI + Uvicorn + HL7 FHIR R4)
# =============================================================================
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/backend

COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/main.py ./
COPY backend/static/ ./static/
COPY backend/data/ ./data/

# Salin hasil build frontend ke /app/frontend_dist agar dilayani langsung oleh FastAPI
COPY --from=frontend-builder /app/frontend/dist /app/frontend_dist

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

