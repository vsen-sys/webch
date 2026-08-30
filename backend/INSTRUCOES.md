# AGENTE 3 - BACKEND

## Sua Missao
Desenvolver toda a logica do servidor, API e banco de dados.

## Diretorio de Trabalho
- Seu trabalho deve ser salvo em: `C:\Users\Administrator\Documents\webch\backend`

## O que voce deve fazer:

1. **Estrutura do Backend**
   - Criar servidor principal
   - Configurar rotas da API
   - Gerenciar banco de dados

2. **Processar Offsets**
   - Receber offsets do Agente 2
   - Armazenar no banco de dados
   - Criar endpoints para consulta

3. **API Endpoints Necessarios:**
   - `GET /offsets` - Listar todas as offsets
   - `GET /offsets/:jogo` - Buscar offset de jogo especifico
   - `POST /offsets` - Adicionar nova offset
   - `PUT /offsets/:jogo` - Atualizar offset
   - `DELETE /offsets/:jogo` - Remover offset

4. **Integrar com Frontend**
   - Fornecer dados para o Agente 1
   - Documentar API para uso do frontend

## Arquivos que voce deve criar:
- `server.js` ou `app.js` - Servidor principal
- `routes/` - Rotas da API
- `models/` - Modelos de dados
- `controllers/` - Logica de negocios
- `README.md` - Documentacao da API

## Comunicacao
- Receba offsets do Agente 2 (via Comandante)
- Notifique o Agente 4 quando terminar para testes
- Forneça documentacao ao Agente 1 para integrar
