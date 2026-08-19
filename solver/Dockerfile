FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1
WORKDIR /app
COPY solver/requirements.txt ./solver/requirements.txt
RUN pip install --no-cache-dir -r solver/requirements.txt
COPY solver ./solver
EXPOSE 8000
CMD ["uvicorn", "solver.main:app", "--host", "0.0.0.0", "--port", "8000"]
