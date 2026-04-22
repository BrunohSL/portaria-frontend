.PHONY: help dev build start install clean

help:
	@echo "Comandos disponíveis:"
	@echo "  make install       - Instala dependencias"
	@echo "  make dev           - Roda o frontend em modo dev (porta 3001)"
	@echo "  make build         - Build de producao"
	@echo "  make start         - Roda build de producao"
	@echo "  make clean         - Remove .next e node_modules"

install:
	npm install

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

clean:
	rm -rf .next node_modules
