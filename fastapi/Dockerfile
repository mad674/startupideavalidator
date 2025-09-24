# Use full Python image
FROM python:3.10

# Set working directory
WORKDIR /app

# You may not need to install gcc/python3-dev with the full image
# RUN apt-get update && apt-get install -y gcc python3-dev \
#     && rm -rf /var/lib/apt/lists/*

# Use pip cache for faster builds
RUN pip config set global.cache-dir /tmp/pipcache

# Copy requirements first (for caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Hugging Face requires app to run on port 7860
ENV PORT=7860
EXPOSE 7860

# Start FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
