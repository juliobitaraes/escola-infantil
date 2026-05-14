// Sistema de Temas e Manual de Ajuda

// Dados do manual por módulo
const manualData = {
  agenda: {
    title: '📅 Agenda Digital',
    content: `
      <p><strong>Descrição:</strong> Módulo para registrar e compartilhar a rotina diária de cada aluno com as famílias, incluindo alimentação, sono, atividades e observações do dia.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno para o qual está criando a agenda. Ao digitar, o sistema busca automaticamente o turma e responsável vinculado.</p>
        </div>
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Turma/sala do aluno. Preenchida automaticamente ao selecionar o aluno.</p>
        </div>
        <div class="field-doc">
          <strong>Data</strong>
          <small>Campo: Data (AAAA-MM-DD)</small>
          <p>Data do registro. Define o dia específico da rotina documentada.</p>
        </div>
        <div class="field-doc">
          <strong>Responsável UID</strong>
          <small>Campo: Texto (somente leitura)</small>
          <p>Identificador único do responsável vinculado. Preenchido automaticamente.</p>
        </div>
        <div class="field-doc">
          <strong>Status</strong>
          <small>Campo: Select (Rascunho, Enviado, Corrigido)</small>
          <p><strong>Rascunho:</strong> Agenda em preparação. <strong>Enviado:</strong> Publicada para a família. <strong>Corrigido:</strong> Feedback da família foi incorporado.</p>
        </div>
        <div class="field-doc">
          <strong>Alimentação</strong>
          <small>Campo: Select (Comeu tudo, Comeu pouco, Não comeu)</small>
          <p>Registro de quanto o aluno comeu durante as principais refeições (café, almoço, lanche).</p>
        </div>
        <div class="field-doc">
          <strong>Observação Alimentação</strong>
          <small>Campo: Texto</small>
          <p>Detalhes adicionais: preferências, alimentos rejeitados, comportamento durante as refeições.</p>
        </div>
        <div class="field-doc">
          <strong>Sono - Horário</strong>
          <small>Campo: Hora (HH:MM)</small>
          <p>Hora de início e fim do sono/repouso. Importante para monitorar padrão de descanso.</p>
        </div>
        <div class="field-doc">
          <strong>Qualidade do Sono</strong>
          <small>Campo: Select (Dormiu bem, Sono leve, Não dormiu)</small>
          <p>Avaliação qualitativa do repouso: se dormiu profundamente ou teve dificuldades.</p>
        </div>
        <div class="field-doc">
          <strong>Humor</strong>
          <small>Campo: Select (Tranquilo, Agitado, Sonolento, Choroso)</small>
          <p>Estado emocional geral do aluno durante o dia. Indicador importante de bem-estar.</p>
        </div>
        <div class="field-doc">
          <strong>Evacuação</strong>
          <small>Campo: Texto</small>
          <p>Registro de movimentos intestinais: frequência, consistência, observações relevantes à saúde.</p>
        </div>
        <div class="field-doc">
          <strong>Banho e Higiene</strong>
          <small>Campo: Texto</small>
          <p>Registro de atividades de higiene: banho, troca de fraldas, escovação de dentes.</p>
        </div>
        <div class="field-doc">
          <strong>Saúde (Rápida)</strong>
          <small>Campo: Texto</small>
          <p>Intercorrências de saúde: febre, medicações oferecidas, queixa de dores, alergias manifestadas.</p>
        </div>
        <div class="field-doc">
          <strong>Atividades e Participação</strong>
          <small>Campo: Texto</small>
          <p>Descrição das atividades pedagógicas/lúdicas realizadas e nível de engajamento do aluno.</p>
        </div>
        <div class="field-doc">
          <strong>Destaque Positivo</strong>
          <small>Campo: Textarea (múltiplas linhas)</small>
          <p>Aspecto positivo do dia: conquista, atitude, aprendizado, comportamento que merece ser compartilhado com a família.</p>
        </div>
        <div class="field-doc">
          <strong>Ponto de Atenção</strong>
          <small>Campo: Textarea</small>
          <p>Situação que requer atenção: dificuldade na socialização, recusa de alimento, choro excessivo.</p>
        </div>
        <div class="field-doc">
          <strong>Recado da Escola</strong>
          <small>Campo: Textarea</small>
          <p>Mensagem genérica ou específica da escola para os responsáveis. Avisos, solicitações, lembretes.</p>
        </div>
      </div>
      <p><strong>Funcionalidades:</strong></p>
      <ul style="color: var(--text-muted); line-height: 2;">
        <li>✅ <strong>Salvar Agenda:</strong> Grava a rotina como rascunho</li>
        <li>✅ <strong>Copiar Rotina Base:</strong> Replica a última agenda do aluno para acelerar preenchimento</li>
        <li>✅ <strong>Marcar como Enviada:</strong> Publica para a família visualizar</li>
        <li>✅ <strong>Confirmar Leitura (Família):</strong> Responsável confirma que leu a agenda</li>
        <li>✅ <strong>Resposta da Família:</strong> Responsável pode deixar feedback ou dúvidas</li>
      </ul>
    `
  },
  
  mural: {
    title: '📢 Mural de Avisos',
    content: `
      <p><strong>Descrição:</strong> Sistema de comunicação centralizado para publicar avisos, notícias e comunicados para toda a comunidade escolar.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Título do Aviso</strong>
          <small>Campo: Input de texto</small>
          <p>Título principal do comunicado. Deve ser conciso e informativo (ex: "Reunião de Pais", "Dia de Festa", "Fechamento de Atividades").</p>
        </div>
        <div class="field-doc">
          <strong>Tipo</strong>
          <small>Campo: Input de texto</small>
          <p>Categoria do aviso (ex: "evento", "reunião", "recado", "urgente"). Facilita filtragem e organização.</p>
        </div>
        <div class="field-doc">
          <strong>Comunicado</strong>
          <small>Campo: Textarea</small>
          <p>Conteúdo completo do aviso. Pode incluir datas, horários, instruções e contatos importantes.</p>
        </div>
      </div>
      <p><strong>Casos de Uso:</strong></p>
      <ul style="color: var(--text-muted); line-height: 2;">
        <li>📋 Avisos administrativos (datas de recesso, mudanças de horário)</li>
        <li>🎉 Convite para eventos (festa de encerramento, apresentações)</li>
        <li>👨‍👩‍👧 Reuniões de pais (datas e pautas)</li>
        <li>⚠️ Alertas urgentes (fechamento excepcional, segurança)</li>
        <li>📢 Notícias gerais da escola</li>
      </ul>
    `
  },

  chat: {
    title: '💬 Chat Integrado',
    content: `
      <p><strong>Descrição:</strong> Canal de comunicação direta e rápida entre equipe escolar e famílias, permitindo troca de mensagens.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Para (Destinatário)</strong>
          <small>Campo: Input de texto</small>
          <p>Destinatário da mensagem: nome do responsável, turma, ou "coordenação". Define quem receberá o recado.</p>
        </div>
        <div class="field-doc">
          <strong>Mensagem</strong>
          <small>Campo: Textarea</small>
          <p>Conteúdo da comunicação. Pode ser pergunta, informação, coordenação de atividades ou aviso rápido.</p>
        </div>
      </div>
      <p><strong>Funcionalidades:</strong></p>
      <ul style="color: var(--text-muted); line-height: 2;">
        <li>📤 Histórico de mensagens consultável</li>
        <li>🔄 Comunicação bidirecional (escola → família e família → escola)</li>
        <li>⏰ Timestamp de cada mensagem</li>
        <li>🏷️ Identificação de quem enviou (email do usuário)</li>
      </ul>
    `
  },

  galeria: {
    title: '📸 Galeria e Autorizações',
    content: `
      <p><strong>Descrição:</strong> Módulo duplo para compartilhar fotos de atividades e gerenciar autorizações de uso de imagem das crianças.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Galeria de Fotos</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno/Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Qual aluno ou turma a foto se refere. Facilita busca posterior.</p>
        </div>
        <div class="field-doc">
          <strong>URL da Foto</strong>
          <small>Campo: Input de texto (URL)</small>
          <p>Link direto para imagem hospedada em nuvem. Exemplo: "https://example.com/foto.jpg"</p>
        </div>
        <div class="field-doc">
          <strong>Legenda</strong>
          <small>Campo: Input de texto</small>
          <p>Descrição breve da foto: contexto, atividade realizada, data do evento.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Autorizações Digitais</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno para o qual a autorização se aplica.</p>
        </div>
        <div class="field-doc">
          <strong>Tipo de Autorização</strong>
          <small>Campo: Input de texto</small>
          <p>Tipo de consentimento (ex: "Uso de imagem", "Passeio externo", "Fotografia", "Consentimento LGPD").</p>
        </div>
        <div class="field-doc">
          <strong>Terceiro Autorizado</strong>
          <small>Campo: Input de texto (opcional)</small>
          <p>Se aplicável, nome de quem está autorizado (ex: "Avó Maria Silva" para retirada).</p>
        </div>
      </div>
    `
  },

  bncc: {
    title: '📋 BNCC e Planejamento',
    content: `
      <p><strong>Descrição:</strong> Módulo de documentação pedagógica alinhado à Base Nacional Comum Curricular e planejamento de aulas.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Relatórios BNCC</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno sendo avaliado.</p>
        </div>
        <div class="field-doc">
          <strong>Campo BNCC</strong>
          <small>Campo: Input de texto</small>
          <p>Componente curricular avaliado (ex: "Linguagem oral", "Pensamento matemático", "Criatividade", "Convivência social").</p>
        </div>
        <div class="field-doc">
          <strong>Avaliação de Evolução</strong>
          <small>Campo: Textarea</small>
          <p>Descrição detalhada da evolução: conquistas, dificuldades, próximos passos pedagógicos.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Planejamento de Aulas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Turma para a qual o planejamento se destina.</p>
        </div>
        <div class="field-doc">
          <strong>Faixa Etária</strong>
          <small>Campo: Input de texto</small>
          <p>Idade/nível dos alunos (ex: "Berçário", "Maternal", "Pré-escolar").</p>
        </div>
        <div class="field-doc">
          <strong>Planejamento de Aulas</strong>
          <small>Campo: Textarea</small>
          <p>Descrição das atividades, objetivos pedagógicos, materiais usados, duração.</p>
        </div>
      </div>
    `
  },

  anamnese: {
    title: '📊 Anamnese, Ocorrências e Frequência',
    content: `
      <p><strong>Descrição:</strong> Conjunto de ferramentas para conhecer melhor cada aluno (histórico), registrar eventos importantes e controlar presença.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Ficha de Anamnese</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno para criar a ficha de anamnese.</p>
        </div>
        <div class="field-doc">
          <strong>Alergias</strong>
          <small>Campo: Input de texto</small>
          <p>Lista de alergias conhecidas (alimentos, medicamentos, materiais). Crítico para segurança.</p>
        </div>
        <div class="field-doc">
          <strong>Restrições Alimentares</strong>
          <small>Campo: Input de texto</small>
          <p>Restrições e preferências alimentares: vegetariano, intolerância à lactose, etc.</p>
        </div>
        <div class="field-doc">
          <strong>Histórico de Saúde</strong>
          <small>Campo: Textarea</small>
          <p>Informações médicas importantes: doenças crônicas, hospitalizações, tratamentos em curso, medicações contínuas.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Ocorrências</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Aluno envolvido na ocorrência.</p>
        </div>
        <div class="field-doc">
          <strong>Tipo</strong>
          <small>Campo: Input de texto</small>
          <p>Categoria (ex: "Febre", "Queda", "Briga", "Reação alérgica", "Comportamento", "Medicação").</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Textarea</small>
          <p>Relato detalhado do evento, ações tomadas, resultado. Importante para seguimento com família.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Frequência</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Data</strong>
          <small>Campo: Data (AAAA-MM-DD)</small>
          <p>Dia do registro de frequência.</p>
        </div>
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Turma do aluno.</p>
        </div>
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno.</p>
        </div>
        <div class="field-doc">
          <strong>Presença</strong>
          <small>Campo: Select (Presente, Ausente)</small>
          <p>Marcar comparecimento do dia.</p>
        </div>
      </div>
    `
  },

  cobrancas: {
    title: '💰 Cobranças e Régua',
    content: `
      <p><strong>Descrição:</strong> Módulo financeiro para controlar mensalidades, taxas e agendar cobranças com reminders automáticos.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Cobranças</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Aluno responsável pela cobrança (para identificar quem deve pagar).</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Valor em reais da cobrança. Use ponto (.) como separador decimal.</p>
        </div>
        <div class="field-doc">
          <strong>Vencimento</strong>
          <small>Campo: Data (AAAA-MM-DD)</small>
          <p>Data de vencimento do boleto/nota.</p>
        </div>
        <div class="field-doc">
          <strong>Método</strong>
          <small>Campo: Select (Boleto, PIX, Cartão)</small>
          <p>Forma de pagamento disponível. Comunique com a família qual usar.</p>
        </div>
        <div class="field-doc">
          <strong>Status</strong>
          <small>Campo: Select (Pendente, Pago, Atrasado)</small>
          <p>Situação atual do pagamento. Sistema atualiza automaticamente para "Atrasado" após vencimento.</p>
        </div>
        <div class="field-doc">
          <strong>Recorrente</strong>
          <small>Campo: Checkbox (Sim/Não)</small>
          <p>Marque se é cobrança mensal recorrente (mensalidade) ou única (taxa).</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Régua de Cobrança</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>ID da Cobrança</strong>
          <small>Campo: Input de texto</small>
          <p>Referência/ID único da cobrança criada.</p>
        </div>
        <div class="field-doc">
          <strong>Canal</strong>
          <small>Campo: Select (Email, SMS, App)</small>
          <p>Como enviar o lembrete de cobrança: por e-mail, mensagem de texto ou notificação de app.</p>
        </div>
        <div class="field-doc">
          <strong>Enviar em</strong>
          <small>Campo: Data (AAAA-MM-DD)</small>
          <p>Data automática para enviar o lembrete. Sistema envia automaticamente nesse dia às 08h00 São Paulo.</p>
        </div>
      </div>
    `
  },

  extras: {
    title: '➕ Extras e Fluxo de Caixa',
    content: `
      <p><strong>Descrição:</strong> Registro de cobranças adicionais e gestão de todas as movimentações financeiras da escola.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Extras Financeiros</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Aluno que utilizou o serviço extra.</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Input de texto</small>
          <p>Tipo de extra (ex: "Período estendido", "Aula de reforço", "Oficina de inglês", "Material extra").</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Valor cobrado pelo serviço extra.</p>
        </div>
        <div class="field-doc">
          <strong>Competência</strong>
          <small>Campo: Mês-Ano (MM-AAAA)</small>
          <p>Mês de referência do extra para controle contábil.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Fluxo de Caixa</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Tipo de Movimento</strong>
          <small>Campo: Select (Receber, Pagar)</small>
          <p><strong>Receber:</strong> Dinheiro entrando. <strong>Pagar:</strong> Despesa/gasto saindo.</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Input de texto</small>
          <p>Detalhamento: "Mensalidade turma A", "Fornecedor X", "Aluguel", "Salários", etc.</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Quantidade em reais do movimento.</p>
        </div>
        <div class="field-doc">
          <strong>Vencimento</strong>
          <small>Campo: Data (AAAA-MM-DD)</small>
          <p>Data que o movimento deve ocorrer/foi realizado.</p>
        </div>
        <div class="field-doc">
          <strong>Número da Nota</strong>
          <small>Campo: Input de texto (opcional)</small>
          <p>NF ou comprovante para controle e auditoria.</p>
        </div>
      </div>
      <p style="color: var(--text-muted); margin-top: 16px;"><strong>KPI Automático:</strong> O sistema calcula automaticamente o saldo de caixa somando entradas e subtraindo saídas.</p>
    `
  },

  matriculas: {
    title: '📚 Matrículas e Prontuários',
    content: `
      <p><strong>Descrição:</strong> Gestão do cadastro de alunos e arquivo de documentação oficial de cada criança.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Matrículas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome completo da criança conforme RG/Certidão de Nascimento.</p>
        </div>
        <div class="field-doc">
          <strong>Responsável</strong>
          <small>Campo: Input de texto</small>
          <p>Nome completo do responsável legal (pai, mãe ou responsável).</p>
        </div>
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Turma de alocação (ex: "Berçário A", "Maternal B", "Pré I").</p>
        </div>
        <div class="field-doc">
          <strong>UID do Responsável</strong>
          <small>Campo: Input de texto (opcional)</small>
          <p>ID de login do sistema para esse responsável, caso tenha conta ativa.</p>
        </div>
        <div class="field-doc">
          <strong>Email do Responsável</strong>
          <small>Campo: Input de texto (opcional)</small>
          <p>E-mail para comunicação e receita de boletos.</p>
        </div>
        <div class="field-doc">
          <strong>Documentos URL</strong>
          <small>Campo: Input de texto (URL)</small>
          <p>Link para pasta com documentos digitalizados (RG, certidão, atestado, etc).</p>
        </div>
        <div class="field-doc">
          <strong>Contrato Assinado</strong>
          <small>Campo: Checkbox</small>
          <p>Marque se o contrato de prestação de serviço foi assinado digitalmente.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Prontuários</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Aluno dono do documento.</p>
        </div>
        <div class="field-doc">
          <strong>Tipo de Documento</strong>
          <small>Campo: Input de texto</small>
          <p>Categoria (ex: "RG", "Atestado de Vacinação", "Laudo Médico", "Termo de Autorização").</p>
        </div>
        <div class="field-doc">
          <strong>URL Arquivo</strong>
          <small>Campo: Input de texto</small>
          <p>Link para o documento digitalizado hospedado em nuvem.</p>
        </div>
        <div class="field-doc">
          <strong>Observação</strong>
          <small>Campo: Textarea</small>
          <p>Anotações: validade, pendências, observações do documento.</p>
        </div>
      </div>
    `
  },

  acessos: {
    title: '👥 Acessos e Turmas',
    content: `
      <p><strong>Descrição:</strong> Gestão de permissões de usuários do sistema e cadastro de turmas/salas.</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Gestão de Acessos</h4>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Perfis disponíveis:</strong></p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Admin</strong>
          <p>Acesso total ao sistema e gerenciamento de permissões.</p>
        </div>
        <div class="field-doc">
          <strong>Direção</strong>
          <p>Gestão estratégica: usuários, turmas, visão completa financeira.</p>
        </div>
        <div class="field-doc">
          <strong>Coordenação</strong>
          <p>Coordenação pedagógica: planejamento, relatórios, comunicação.</p>
        </div>
        <div class="field-doc">
          <strong>Professor</strong>
          <p>Registro de rotinas, ocorrências, comunicação com famílias.</p>
        </div>
        <div class="field-doc">
          <strong>Financeiro</strong>
          <p>Acesso exclusivo a: Cobranças, Régua, Extras, Fluxo de Caixa.</p>
        </div>
        <div class="field-doc">
          <strong>Secretaria</strong>
          <p>Matrículas, alunos, turmas, documentação administrativa.</p>
        </div>
        <div class="field-doc">
          <strong>Portaria</strong>
          <p>Registro de retiradas de alunos, segurança patrimonial.</p>
        </div>
        <div class="field-doc">
          <strong>Responsável</strong>
          <p>Acesso limitado: apenas visualização de agenda e respostas.</p>
        </div>
      </div>
      
      <div class="fields-grid" style="margin-top: 20px;">
        <div class="field-doc">
          <strong>UID do Usuário</strong>
          <small>Campo: Input de texto</small>
          <p>ID único do usuário no sistema Firebase (email). Obtém ao criar conta.</p>
        </div>
        <div class="field-doc">
          <strong>Novo Perfil</strong>
          <small>Campo: Select</small>
          <p>Perfil que será atribuído/alterado para esse usuário.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Turmas/Salas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Nome da Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Identificação (ex: "Berçário A", "Maternal I", "Pré II").</p>
        </div>
        <div class="field-doc">
          <strong>Faixa Etária</strong>
          <small>Campo: Input de texto</small>
          <p>Idade atendida (ex: "0 a 1 ano", "1 a 2 anos", "4 a 5 anos").</p>
        </div>
        <div class="field-doc">
          <strong>Limite de Alunos</strong>
          <small>Campo: Número</small>
          <p>Capacidade máxima da sala (importante para segurança e planejamento).</p>
        </div>
        <div class="field-doc">
          <strong>Professor Responsável UID</strong>
          <small>Campo: Input de texto</small>
          <p>ID/Email do professor coordenador da turma.</p>
        </div>
      </div>
    `
  },

  portaria: {
    title: '🚪 Portaria e LGPD',
    content: `
      <p><strong>Descrição:</strong> Registro de segurança (retiradas) e gestão de consentimentos LGPD (Lei de Proteção de Dados).</p>
      
      <h4 style="color: var(--primary-light); margin-top: 20px;">Portaria - Retiradas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Criança sendo retirada.</p>
        </div>
        <div class="field-doc">
          <strong>Retirado por</strong>
          <small>Campo: Input de texto</small>
          <p>Nome completo de quem está retirando a criança.</p>
        </div>
        <div class="field-doc">
          <strong>Parentesco</strong>
          <small>Campo: Input de texto</small>
          <p>Relação com a criança (ex: "Mãe", "Avó", "Tio").</p>
        </div>
        <div class="field-doc">
          <strong>RG</strong>
          <small>Campo: Input de texto</small>
          <p>Número do RG da pessoa retirado para validação.</p>
        </div>
        <div class="field-doc">
          <strong>Foto do Retirante</strong>
          <small>Campo: Input de texto (URL)</small>
          <p>Foto digitalizada da pessoa para verificação de identidade (segurança).</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">LGPD - Consentimentos</h4>
      <p style="color: var(--text-muted); margin-bottom: 16px;">Lei Geral de Proteção de Dados Pessoais: registro formal de autorização para uso de dados de alunos menores.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno (Titular)</strong>
          <small>Campo: Input de texto</small>
          <p>Criança cujos dados serão tratados.</p>
        </div>
        <div class="field-doc">
          <strong>Responsável Legal</strong>
          <small>Campo: Input de texto</small>
          <p>Pai/mãe que está consentindo.</p>
        </div>
        <div class="field-doc">
          <strong>Escopo de Consentimento</strong>
          <small>Campo: Textarea</small>
          <p>Quais dados podem ser usados e para quê (ex: "Fotos para mural escolar", "Relatórios pedagógicos compartilhados").</p>
        </div>
      </div>
    `
  }
};

// Inicializar tema ao carregar a página
function initTheme() {
  const savedTheme = localStorage.getItem('educakids-theme') || 'dark';
  applyTheme(savedTheme);
}

// Aplicar tema
function applyTheme(theme) {
  const body = document.body;
  
  if (theme === 'light') {
    body.classList.add('light-theme');
    document.getElementById('themeToggle').textContent = '☀️';
    document.getElementById('themeToggle').title = 'Alternar para tema escuro';
  } else {
    body.classList.remove('light-theme');
    document.getElementById('themeToggle').textContent = '🌙';
    document.getElementById('themeToggle').title = 'Alternar para tema claro';
  }
  
  localStorage.setItem('educakids-theme', theme);
}

// Toggle tema
function toggleTheme() {
  const currentTheme = localStorage.getItem('educakids-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Renderizar manual em HTML
function renderManualContent(moduleKey) {
  const manual = manualData[moduleKey];
  if (!manual) {
    return '<p>Módulo não encontrado no manual.</p>';
  }
  
  return `
    <div class="manual-section">
      <h3>${manual.title}</h3>
      ${manual.content}
    </div>
  `;
}

// Abrir modal com manual
function openHelp(moduleKey = null) {
  const modal = document.getElementById('helpModal');
  const content = document.getElementById('manualContent');
  
  if (moduleKey && manualData[moduleKey]) {
    content.innerHTML = renderManualContent(moduleKey);
  } else {
    // Mostrar índice completo
    const modules = Object.keys(manualData);
    let indexHTML = '<div class="manual-section"><h3>📚 Índice de Módulos</h3><p>Clique em um módulo na sidebar para acessar seu manual.</p>';
    modules.forEach(key => {
      indexHTML += `<p style="margin-bottom: 12px;"><a href="#" onclick="openHelp('${key}'); return false;" style="color: var(--primary-light); text-decoration: none; cursor: pointer;">${manualData[key].title}</a></p>`;
    });
    indexHTML += '</div>';
    content.innerHTML = indexHTML;
  }
  
  modal.classList.add('active');
}

// Fechar modal
function closeHelp() {
  const modal = document.getElementById('helpModal');
  modal.classList.remove('active');
}

// Fechar ao clicar fora
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  
  // Botão de tema
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Botão de ajuda
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => openHelp());
  }
  
  // Fechar ajuda
  const closeBtn = document.getElementById('closeHelp');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeHelp);
  }
  
  // Fechar ao clicar no overlay
  const modal = document.getElementById('helpModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeHelp();
      }
    });
  }
});
