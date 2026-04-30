# syntax=docker/dockerfile:1
FROM python:3.13-slim-bookworm AS base

# Instalar dependências de sistema necessárias para compilar pacotes nativos
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar e instalar dependências primeiro (aproveita cache de build)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o restante da aplicação
COPY . .

# Expor a porta (Railway sobrescreve via $PORT, mas é boa prática)
EXPOSE 8000

# Railway injeta a variável PORT automaticamente
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
