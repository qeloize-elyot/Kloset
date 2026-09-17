# Kloset

Sistema inteligente de guarda-roupa digital.

Kloset ajuda você a montar looks com base no clima, ocasião e no seu gosto real — sem sugestões genéricas e sem visual de ferramenta de IA.

## O que faz

- Cadastro de peças com foto multi-ângulo
- Remoção automática de fundo
- Tagging inteligente (categoria, cor, tecido, estilo)
- Sugestão de looks considerando temperatura e ocasião
- Aprendizado contínuo a partir do feedback (gostei / não usaria / usei)
- Interface limpa e sóbria, feita para uso diário

## Stack

**Backend**
- Python 3.11+
- FastAPI
- SQLAlchemy + PostgreSQL
- JWT Authentication
- Pillow + rembg (remoção de fundo)
- Integração preparada para OpenAI / modelos de visão

**Frontend**
- React 18 + TypeScript + Vite
- Tailwind CSS
- React Router
- Zustand (estado)
- Design system próprio (sem emojis, sem visual genérico de IA)

## Estrutura

```
wardrobe-app/
├── backend/          # API FastAPI
├── frontend/         # Aplicação React
├── docker-compose.yml
└── README.md
```

## Como rodar localmente

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Com Docker (recomendado)

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:8000
- Docs API: http://localhost:8000/docs

## Variáveis de ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
DATABASE_URL=postgresql+asyncpg://kloset:kloset@localhost:5432/kloset
SECRET_KEY=troque-por-uma-chave-secreta-forte
OPENWEATHER_API_KEY=
OPENAI_API_KEY=
```

## Próximos passos de desenvolvimento

1. Conectar banco PostgreSQL real
2. Implementar upload real + rembg
3. Integrar modelo de visão (GPT-4o Vision ou YOLO)
4. Conectar OpenWeather
5. Ajustar prompts de combinação de looks
6. Adicionar sistema de feedback e pesos por usuário

## Licença

Uso privado / projeto pessoal.
