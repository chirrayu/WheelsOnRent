# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBIAN_FRONTEND=noninteractive

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for EasyOCR and OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download EasyOCR models (stops slow startup on first request)
RUN python -c "import easyocr; easyocr.Reader(['en'], gpu=False)"

# Copy the rest of the application code
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Run gunicorn
# Note: Bind to 0.0.0.0:5000 for Docker networking
CMD ["gunicorn", "--config", "gunicorn_config.py", "app:app"]
