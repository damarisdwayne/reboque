# Reboque

PWA para anotar os serviços de reboque — qual serviço, quando, quanto e para
qual empresa — e cobrar cada empresa depois. Sem servidor, sem conta, sem
dependências: os dados ficam no `localStorage` do aparelho.

## Rodar localmente

```sh
python3 -m http.server 8000
```

Abrir `http://localhost:8000`. Em `file://` a tela funciona, mas o service
worker não registra.

## Publicar

Site estático, sem build. Na Vercel, basta apontar para o repositório —
sem comando de build e sem diretório de saída.

## Ao alterar qualquer arquivo do app

Suba o número em `const CACHE = 'reboque-vN'` no `sw.js`. Sem isso o
navegador continua servindo a versão antiga do cache e a mudança nunca chega
a quem já instalou.

## Estrutura

| Arquivo | O que faz |
|---|---|
| `js/db.js` | dados, contas e regras (valores sempre em centavos) |
| `js/novo.js` | formulário de novo serviço |
| `js/cobrar.js` | aba A receber, agrupada por empresa |
| `js/compartilhar.js` | mensagem de cobrança e resumo no WhatsApp |
| `js/export.js` | planilha CSV, backup JSON e restauração |
| `js/ui.js` | telas, abas e ações |
