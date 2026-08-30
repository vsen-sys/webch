# WEBCH - Central de Cheats

Site para gerenciamento de offsets (CS2, Fortnite, Roblox) com sistema de contas, verificacao por e-mail, area premium e downloads.

## Acesso

- Site: `http://192.168.1.107:8080`
- IP fixo configurado na maquina (Wi-Fi, estatico 192.168.1.107)

## Inicio do servidor

O servidor inicia automaticamente ao ligar o PC via **Agendador de Tarefas do Windows** ("WEBCH Server", trigger no boot, rodando como SYSTEM).

Arquivos de inicio:

- `iniciar_servidor.bat` - loop de inicializacao (reinicia sozinho se cair)
- `iniciar_servidor.vbs` - executa o bat sem janela
- `iniciar_site.bat` - inicio manual

Log do servidor: `backend/server.log`

## Estrutura

```
webch/
  backend/          # Servidor Node/Express, autenticacao, PIX, premium
  frontend/         # Site (HTML/CSS/JS) - visual preto e branco
  offsets/          # Dados de offsets (cs2.json, fortnite.json, roblox.json)
  downloads/        # Apps/arquivos para download (vazio por padrao)
  iniciar_servidor.bat / .vbs  # Auto-start
```

## Funcionalidades

- **Offsets por jogo**: CS2, Fortnite, Roblox em abas separadas, com preview in-game vertical
- **Pesquisa**: barra global + API `/api/offsets/search?q=...`
- **Contas**: cadastro com confirmacao por codigo enviado ao Gmail da pessoa
  - Login real com token (Bearer)
  - Senhas com hash (PBKDF2 + salt)
- **Premium**: aba dedicada com planos, pagamento via **PIX** (chave + QR Code gerado pelo servidor)
  - Ativacao manual apos o pagamento (chave admin)
  - Conteudo exclusivo (apps complexos + offsets atualizadas)
- **APIs**
  - `GET /api/offsets`, `/api/offsets/todos`, `/api/offsets/search?q=`
  - `POST /api/auth/register`, `/api/auth/verify`, `/api/auth/resend`, `/api/auth/login`
  - `GET /api/auth/me` (Bearer token)
  - `POST /api/auth/premium` (ativacao manual, chave admin)
  - `GET /api/premium/planos`, `/api/premium/conteudo` (protegido)
  - `GET /api/pix/pagamento` (chave + QR Code)

## Configuracao (backend/.env)

| Variavel | Descricao |
|----------|-----------|
| `SMTP_USER` / `SMTP_PASS` | Gmail remetente dos codigos (senha de app do Google) |
| `PIX_KEY` | Chave PIX que aparece no site |
| `PIX_AMOUNT` | Valor padrao do pagamento |
| `ADMIN_KEY` | Chave para ativar premium manualmente |

Crie o arquivo `backend/.env` copiando o modelo (campos esperados documentados acima). O codigo de verificacao, se `SMTP_PASS` estiver vazio, aparece no log do servidor.

## Dependencias

- Node.js + Express
- nodemailer (e-mails)
- qrcode (QR Code do PIX)
- dotenv

Instalacao: `cd backend && npm install`