VENV=.venv
PYTHON=$(VENV)/bin/python
PIP=$(VENV)/bin/pip
PYTEST=$(VENV)/bin/pytest

.PHONY: venv install test dev backend frontend

venv:
	python3 -m venv $(VENV)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

test:
	$(PYTEST)

backend:
	PYTHONPATH=$(PWD) $(PYTHON) src/api_server.py

frontend:
	cd frontend && npm install && npm run dev

dev:
	# backend and frontend dev servers
	PYTHONPATH=$(PWD) $(PYTHON) src/api_server.py & \
	cd frontend && npm install && npm run dev
