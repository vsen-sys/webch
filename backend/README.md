# Backend - CS2 Offsets API

## Visao Geral
Backend para servir offsets do Counter-Strike 2 via API REST.

## Instalacao

```bash
cd backend
npm install
```

## Uso

```bash
npm start
```

O servidor iniciara na porta 3000.

## Endpoints da API

### GET /api/offsets
Lista todas as offsets disponiveis.

### GET /api/offsets/cs2
Retorna offsets do CS2.

### GET /api/offsets/cs2/:nome
Busca offset especifica por nome.
Exemplo: `/api/offsets/cs2/dwEntityList`

### GET /api/offsets/cs2/categoria/:categoria
Busca offsets por categoria.
Categorias disponiveis: jogador, arma, camera, jogo, misc

### GET /api/offsets/cs2/bonecs
Retorna lista de bonecs do CS2.

### POST /api/offsets
Adiciona nova offset.
```json
{
  "nome": "nome_da_offset",
  "valor": "0x12345678"
}
```

### PUT /api/offsets/cs2/:nome
Atualiza offset existente.
```json
{
  "valor": "0x12345678"
}
```

### DELETE /api/offsets/cs2/:nome
Remove offset.

## Exemplos de Uso

### Buscar todas as offsets do CS2
```bash
curl http://localhost:3000/api/offsets/cs2
```

### Buscar offset especifica
```bash
curl http://localhost:3000/api/offsets/cs2/dwEntityList
```

### Buscar por categoria
```bash
curl http://localhost:3000/api/offsets/cs2/categoria/jogador
```

## Estrutura

```
backend/
├── server.js        # Servidor principal
├── package.json     # Dependencias
└── README.md        # Esta documentacao
```

## Tecnologias

- **Node.js** - Runtime
- **Express** - Framework web
- **CORS** - Cross-origin resource sharing
- **JSON** - Formato de dados
