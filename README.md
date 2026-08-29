# NEXUS HUB

Site local de rede com visual estilo gaming, feito com 4 AIs em conjunto.

## O que tem

- Pagina web visual (tema neon escuro)
- Secoes: Downloads, Visuals e Aimbot Configs
- Servidor Node.js que mostra o IP da rede
- Pasta `/downloads` com arquivos acessiveis por todo mundo na rede

## Como rodar

```bash
node server.js
```

Ou duplique o arquivo `iniciar_site.bat` no Windows.

Depois acesse o IP exibido no terminal pela porta 8080.

## Estrutura

```
webch/
  server.js          <- servidor (Node.js, sem dependencias)
  public/index.html  <- pagina principal
  downloads/         <- arquivos servidos para a rede
  MENSAGEM_PARA_AS_AIS.md <- mensagem para as AIs do projeto
```

## Requisitos

- Node.js 18+

Feito para uso interno na rede local. Open source.