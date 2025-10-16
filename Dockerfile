# Multi-stage build
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY app.py .

# Create uploads directory
RUN mkdir -p uploads

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Expose port
EXPOSE 10000

# Start app
CMD ["gunicorn", "--bind", "0.0.0.0:10000", "app:app"]
