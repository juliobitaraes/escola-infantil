# Escola Infantil

Sistema web para operação escolar com Firebase Hosting, Firestore, Storage e Cloud Functions. O projeto cobre comunicação com famílias, gestão pedagógica, financeiro, matrículas, usuários, segurança, LGPD e administração multiunidade.

## Visão Geral

O frontend fica em `public/` e funciona como aplicação única em HTML, CSS e JavaScript. A autenticação usa Firebase Authentication, os dados operacionais ficam no Firestore, os documentos de matrícula usam Firebase Storage e as rotinas sensíveis ficam em Cloud Functions.

Áreas principais do sistema:

- Comunicação: agenda digital, mural, chat, galeria e autorizações
- Pedagógico: BNCC, planejamento, anamnese, ocorrências e frequência
- Financeiro: cobranças, régua de cobrança, extras e fluxo de caixa
- Administrativo: matrículas, alunos, prontuários, usuários, turmas e faixas etárias
- Segurança e conformidade: portaria, consentimentos LGPD e auditoria
- Superadmin: escolas, diretores, métricas e manutenção global de responsáveis

## Estrutura do Projeto

- `public/index.html`: layout principal e formulários da interface
- `public/assets/css/styles.css`: estilos da aplicação e modal de ajuda
- `public/assets/js/app.js`: regras de UI, autenticação, integração Firebase e fluxos dos módulos
- `public/assets/js/help.js`: manual exibido no botão "Manual"
- `functions/index.js`: Cloud Functions HTTP, callable e agendadas
- `functions/scripts/`: scripts de manutenção e migração
- `firestore.rules`: autorização por perfil e por escola
- `firestore.indexes.json`: índices compostos do Firestore
- `storage.rules`: escopo dos arquivos por escola
- `firebase.json`: configuração de hosting, rules e source das functions

## Perfis e Escopo

Os perfis ficam em `usuarios/{uid}.role` e o escopo institucional em `usuarios/{uid}.escola_id`.

Perfis suportados:

- `superadmin`
- `admin`
- `direcao`
- `coordenacao`
- `professor`
- `financeiro`
- `secretaria`
- `portaria`
- `responsavel`

Resumo de acesso:

- `superadmin`: visão global, cadastro de escolas e diretores, manutenção geral
- `admin` e `direcao`: gestão ampla da escola, incluindo usuários e exclusões administrativas
- `coordenacao` e `professor`: foco pedagógico, agenda, comunicação e registros escolares
- `financeiro`: cobranças, régua, extras e fluxo de caixa
- `secretaria`: matrículas, alunos, prontuários e apoio administrativo
- `portaria`: operações de retirada e segurança
- `responsavel`: acesso restrito a rotinas da família e interações permitidas

## Cloud Functions

Funções exportadas em `functions/index.js`:

- `uploadMatriculaDocumento` (HTTP): upload de arquivos de matrícula para o Storage
- `deleteMatriculaDocumento` (HTTP): exclusão de arquivos de matrícula
- `serveMatriculaDocumento` (HTTP): entrega autenticada de documentos de matrícula
- `criarDiretorEscola` (callable): cria diretor vinculado a uma escola
- `criarUsuarioEscola` (callable): cria usuário operacional com perfil e escola
- `criarResponsavelDeMatricula` (callable): cria ou vincula usuário responsável a partir da matrícula
- `migrarResponsaveisUsuarios` (callable): gera usuários para responsáveis sem conta
- `resetDiretorSenha` (callable): redefine senha de diretor
- `setDiretorStatus` (callable): ativa ou inativa diretor
- `criarCobrancaExterna` (callable): integra cobrança com provedor externo
- `processarReguaCobranca` (agendada): processa a régua diariamente às 08:00 em `America/Sao_Paulo`
- `receberWebhookCobranca` (HTTP): recebe eventos do provedor de cobrança

## Ambiente e Configuração

### Requisitos

- Node.js 22 nas Cloud Functions
- Firebase CLI autenticado no projeto correto
- Projeto Firebase com Authentication, Firestore, Hosting e Storage habilitados

### Variáveis de ambiente

Copie `functions/.env.example` para `functions/.env` e preencha os valores necessários:

```env
BILLING_PROVIDER=asaas
ASAAS_API_KEY=
ASAAS_BASE_URL=https://api.asaas.com/v3
BILLING_WEBHOOK_TOKEN=
MAIL_PROVIDER=none
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=
```

Observação: os canais de e-mail e SMS são opcionais no código, mas precisam de credenciais reais para produção.

## Execução e Deploy

### Instalar dependências das Functions

```bash
cd functions
npm install
```

### Emular apenas as Functions

```bash
cd functions
npm run serve
```

### Deploy de rules e hosting

```bash
firebase deploy --only firestore,storage,hosting
```

### Deploy das Functions

```bash
firebase deploy --only functions
```

### Deploy completo

```bash
firebase deploy
```

## Scripts de Manutenção

Scripts disponíveis em `functions/scripts/`:

- `npm run migrate:school`: ajusta ou vincula `escola_id` conforme a estratégia do script `migrate-escola-id.js`
- `npm run migrate:prontuarios`: deduplica registros de prontuários
- `node scripts/migrate-responsaveis-usuarios.js`: rotina manual complementar para usuários de responsáveis

Antes de executar scripts de manutenção em produção, valide o alvo e gere backup da base.

## Regras e Segurança

- `firestore.rules` aplica acesso por perfil e por `escola_id`
- `storage.rules` restringe arquivos de matrícula ao escopo da escola do usuário autenticado
- a coleção `auditoria` registra ações administrativas sensíveis
- o superusuário é reconhecido pelo e-mail fixado no backend e nas rules

## Observações Operacionais

- O botão "Manual" da interface abre a documentação resumida dos módulos em `public/assets/js/help.js`
- Os documentos de matrícula e prontuário aceitam upload direto, com validação de tipo e escopo institucional
- O módulo LGPD registra consentimentos por finalidade e deve ser acompanhado por processo jurídico e administrativo da escola
- URLs públicas de functions no frontend precisam ser revisadas se houver troca de projeto, região ou endpoints após novo deploy
