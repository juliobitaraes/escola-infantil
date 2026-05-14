# Escola Infantil - MVP Completo

Este projeto agora possui:

- Frontend modularizado (HTML + CSS + JS)
- Autenticacao Firebase
- Modulos de comunicacao, pedagogico, financeiro, administrativo, seguranca e LGPD
- Regras Firestore por perfil
- Cloud Functions para cobranca externa, processamento de regua e webhook de pagamento

## Estrutura

- public/index.html
- public/assets/css/styles.css
- public/assets/js/app.js
- firestore.rules
- firestore.indexes.json
- functions/index.js

## Perfis de acesso

Os perfis sao armazenados em `usuarios/{uid}.role`.

Perfis suportados:

- admin
- direcao
- coordenacao
- professor
- financeiro
- secretaria
- portaria

## Variaveis de ambiente das Functions

Copie `functions/.env.example` para `functions/.env` e preencha:

- BILLING_PROVIDER=asaas
- ASAAS_API_KEY
- ASAAS_BASE_URL
- BILLING_WEBHOOK_TOKEN
- MAIL_PROVIDER
- RESEND_API_KEY
- TWILIO_ACCOUNT_SID
- TWILIO_AUTH_TOKEN
- TWILIO_FROM

## Funcoes disponiveis

- `criarCobrancaExterna` (callable)
- `processarReguaCobranca` (agendada diariamente 08:00 America/Sao_Paulo)
- `receberWebhookCobranca` (HTTP)

## Deploy

### 1) Deploy regras e hosting

```bash
firebase deploy --only firestore,hosting
```

### 2) Deploy functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3) Deploy completo

```bash
firebase deploy
```

## Observacoes

- Para uso em producao, configure providers reais de email/sms.
- O frontend salva URLs para fotos/documentos; upload seguro pode ser feito depois via Firebase Storage.
- Regras LGPD operacionais (retencao, anonimização, direito ao esquecimento) devem ser complementadas por processo juridico e funcional.
