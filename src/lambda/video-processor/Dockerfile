# video-processor/Dockerfile
FROM python:3.11-slim

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Verify ffmpeg installation
RUN ffmpeg -version

# Set working directory
WORKDIR /app

# Copy requirements first for better Docker layer caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY processor.py .

# Create directories for processing
RUN mkdir -p /tmp/video_processing && \
    chmod 755 /tmp/video_processing

# Create non-root user for security
RUN useradd -m -u 1000 processor && \
    chown -R processor:processor /app /tmp/video_processing

# Switch to non-root user
USER processor

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import sys; sys.exit(0)"

# Environment variables with defaults (will be overridden by Fargate)
ENV INPUT_BUCKET=""
ENV INPUT_KEY=""
ENV OUTPUT_BUCKET=""
ENV LESSON_ID=""
ENV CREATOR_ID=""
ENV UPLOAD_ID=""
ENV API_BASE_URL=""
ENV API_KEY=""
ENV AWS_DEFAULT_REGION="us-east-1"

# Set entry point - this is what runs when container starts
ENTRYPOINT ["python", "processor.py"]

# Alternative: You could also use CMD if you want to override easily
# CMD ["python", "processor.py"]

# Build and test commands:
# docker build -t video-processor .
# 
# Test locally with environment variables:
# docker run --rm \
#   -e INPUT_BUCKET=my-raw-bucket \
#   -e INPUT_KEY=test-video.mp4 \
#   -e OUTPUT_BUCKET=my-processed-bucket \
#   -e LESSON_ID=lesson-123 \
#   -e CREATOR_ID=creator-456 \
#   -e API_BASE_URL=http://localhost:3000 \
#   -e API_KEY=test-key \
#   video-processor

# video-processor/requirements.txt
boto3==1.34.34
requests==2.31.0
botocore==1.34.34

# video-processor/.dockerignore
__pycache__
*.pyc
*.pyo
*.pyd
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.tox
.coverage
.coverage.*
.cache
nosetests.xml
coverage.xml
*.cover
*.log
.git
.mypy_cache
.pytest_cache
.hypothesis
.DS_Store
*.swp
*.swo
*~

# video-processor/test-local.sh
#!/bin/bash
# Local testing script

echo "Building Docker image..."
docker build -t video-processor .

echo "Testing with mock environment variables..."
docker run --rm \
    -e INPUT_BUCKET=test-raw-bucket \
    -e INPUT_KEY=test-video.mp4 \
    -e OUTPUT_BUCKET=test-processed-bucket \
    -e LESSON_ID=lesson-test-123 \
    -e CREATOR_ID=creator-test-456 \
    -e API_BASE_URL=http://host.docker.internal:3000 \
    -e API_KEY=test-api-key-123 \
    -e AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID} \
    -e AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY} \
    -e AWS_DEFAULT_REGION=us-east-1 \
    video-processor

echo "Container test complete!"

# How Fargate will run this:
# The Lambda function passes these environment variables to Fargate:
# - INPUT_BUCKET: where the raw video is stored
# - INPUT_KEY: the S3 key/path to the video file
# - OUTPUT_BUCKET: where to store processed videos
# - LESSON_ID: database lesson ID for updates
# - CREATOR_ID: for organizing output path
# - API_BASE_URL: your Next.js API URL
# - API_KEY: for secure API calls