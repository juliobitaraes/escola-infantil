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
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> preencher os dados do aluno e do responsável, selecionar a turma, revisar endereço, anexar documentos/foto e salvar. Caso necessário, use os botões <strong>Editar</strong> e <strong>Excluir</strong> na lista de matrículas.</p>
      
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
          <small>Campo: Lista de seleção</small>
          <p>Selecione a turma do aluno entre as turmas cadastradas no módulo de Acessos e Turmas.</p>
        </div>
        <div class="field-doc">
          <strong>UID do Responsável</strong>
          <small>Campo: Somente leitura (automático)</small>
          <p>Identificador preenchido automaticamente quando o e-mail do responsável corresponde a um usuário já cadastrado.</p>
        </div>
        <div class="field-doc">
          <strong>Email do Responsável</strong>
          <small>Campo: Input de texto (opcional)</small>
          <p>E-mail para comunicação e cobrança; usado para tentar vincular automaticamente o responsável no sistema.</p>
        </div>
        <div class="field-doc">
          <strong>CPF do Responsável</strong>
          <small>Campo: Input com máscara automática</small>
          <p>Formato aplicado automaticamente: 000.000.000-00.</p>
        </div>
        <div class="field-doc">
          <strong>Telefone do Responsável</strong>
          <small>Campo: Input com máscara automática</small>
          <p>Formato aplicado automaticamente para telefone fixo e celular.</p>
        </div>
        <div class="field-doc">
          <strong>CEP e Endereço</strong>
          <small>Campo: Inputs + botão Buscar CEP</small>
          <p>CEP com máscara automática; ao buscar CEP o sistema preenche logradouro, bairro, cidade e UF.</p>
        </div>
        <div class="field-doc">
          <strong>Documentos URL</strong>
          <small>Campo: Input de texto (URL, opcional)</small>
          <p>Link externo adicional para documentos, se necessário.</p>
        </div>
        <div class="field-doc">
          <strong>Upload de Documentos</strong>
          <small>Campo: Upload múltiplo</small>
          <p>Aceita PDF, JPG e PNG; múltiplos arquivos com limite de 20 MB por arquivo.</p>
        </div>
        <div class="field-doc">
          <strong>Ações dos Documentos</strong>
          <small>Campo: Botões na lista de arquivos</small>
          <p>Permite visualizar, baixar, baixar todos e excluir documentos selecionados e já salvos.</p>
        </div>
        <div class="field-doc">
          <strong>Foto do Aluno</strong>
          <small>Campo: Upload ou câmera</small>
          <p>É possível anexar por arquivo ou capturar pela câmera diretamente no formulário.</p>
        </div>
        <div class="field-doc">
          <strong>Contrato Assinado</strong>
          <small>Campo: Checkbox</small>
          <p>Marque se o contrato de prestação de serviço foi assinado digitalmente.</p>
        </div>
      </div>

      <p style="color: var(--text-muted); margin-top: 16px;"><strong>Gestão de registros:</strong> cada matrícula pode ser editada e excluída pela lista, mantendo atualização dos dados vinculados do aluno.</p>

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
            <strong>Upload de Documentos</strong>
            <small>Campo: Upload múltiplo</small>
            <p>Aceita PDF, JPG e PNG; os arquivos são enviados direto no cadastro, com preview e barra de progresso.</p>
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
      <p><strong>Descrição:</strong> Gestão de usuários, permissões, turmas e faixas etárias. Este módulo centraliza o provisionamento dos acessos operacionais da escola.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> criar o usuário, vincular a escola e o perfil, revisar a lista de usuários e então cadastrar turmas e faixas etárias para uso em matrículas, agenda e relatórios.</p>
      
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
          <strong>Novo Usuário</strong>
          <small>Campos: Nome, e-mail, senha temporária e perfil</small>
          <p>Cria a conta de acesso no Firebase Authentication e registra o usuário no Firestore para uso imediato no sistema.</p>
        </div>
        <div class="field-doc">
          <strong>Selecionar Usuário</strong>
          <small>Campo: Lista de seleção</small>
          <p>Carrega um usuário existente para revisar UID, escola vinculada e perfil atual antes da atualização.</p>
        </div>
        <div class="field-doc">
          <strong>UID do Usuário</strong>
          <small>Campo: Somente leitura</small>
          <p>Identificador interno do usuário. É preenchido automaticamente ao selecionar um cadastro existente.</p>
        </div>
        <div class="field-doc">
          <strong>ID da Escola</strong>
          <small>Campo: Input de texto</small>
          <p>Escopo institucional do usuário. Define quais documentos e registros o colaborador poderá acessar.</p>
        </div>
        <div class="field-doc">
          <strong>Novo Perfil</strong>
          <small>Campo: Select</small>
          <p>Perfil que será atribuído ou alterado para o usuário selecionado.</p>
        </div>
        <div class="field-doc">
          <strong>Criar usuários de responsáveis</strong>
          <small>Campo: Botão de manutenção</small>
          <p>Gera automaticamente os logins das famílias a partir das matrículas que ainda não possuem conta vinculada.</p>
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
          <small>Campo: Lista de seleção</small>
          <p>Selecione o professor responsável entre os usuários cadastrados da escola.</p>
        </div>
        <div class="field-doc">
          <strong>Faixas Etárias</strong>
          <small>Campos: Nome e descrição</small>
          <p>Cadastre as faixas etárias para padronizar o uso em turmas, relatórios BNCC e organização pedagógica.</p>
        </div>
      </div>
    `
  },

  superadmin: {
    title: '🏛️ Superadmin - Escolas e Diretores',
    content: `
      <p><strong>Descrição:</strong> Painel global para operação multiunidade. Disponível apenas para o superusuário, concentra cadastro de escolas, diretores, métricas e rotinas de manutenção.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> cadastrar a escola, criar o diretor vinculado, revisar status e métricas e usar as rotinas de manutenção apenas quando houver necessidade administrativa.</p>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Resumo e métricas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Resumo geral</strong>
          <small>Campo: Cards automáticos</small>
          <p>Mostra totais de escolas, diretores, alunos e matrículas para acompanhamento rápido da base.</p>
        </div>
        <div class="field-doc">
          <strong>Métricas por escola</strong>
          <small>Campo: Lista filtrável</small>
          <p>Permite filtrar por cidade e ordenar por totais, alunos, matrículas ou diretores.</p>
        </div>
        <div class="field-doc">
          <strong>Gráfico por escola</strong>
          <small>Campo: Painel visual</small>
          <p>Apresenta comparativos entre unidades para leitura rápida de volume e atividade.</p>
        </div>
        <div class="field-doc">
          <strong>Ranking de atividade</strong>
          <small>Campo: Lista automática</small>
          <p>Destaca as escolas mais ativas de acordo com os dados consolidados no sistema.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Cadastro e gestão de escolas</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Buscar escola</strong>
          <small>Campo: Input de busca</small>
          <p>Localiza escolas por nome ou ID para edição rápida.</p>
        </div>
        <div class="field-doc">
          <strong>ID, nome e cidade</strong>
          <small>Campos: Input de texto</small>
          <p>Dados principais da unidade. O ID é usado como referência técnica em usuários e escopo de dados.</p>
        </div>
        <div class="field-doc">
          <strong>Status da escola</strong>
          <small>Campo: Select</small>
          <p>Define se a unidade está ativa ou inativa. A inativação preserva histórico e facilita bloqueio operacional.</p>
        </div>
        <div class="field-doc">
          <strong>Ações</strong>
          <small>Campos: Salvar, limpar e inativar</small>
          <p>Use salvar para cadastrar ou atualizar; use inativar quando a unidade deixar de operar.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Cadastro e gestão de diretores</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Buscar diretor</strong>
          <small>Campo: Input de busca</small>
          <p>Pesquisa por nome, e-mail ou escola vinculada.</p>
        </div>
        <div class="field-doc">
          <strong>Nome, e-mail e escola</strong>
          <small>Campos: Formulário principal</small>
          <p>Dados usados para criar ou atualizar o acesso do diretor e definir a unidade que ele administrará.</p>
        </div>
        <div class="field-doc">
          <strong>Senha temporária</strong>
          <small>Campo: Input opcional</small>
          <p>Se informada, é usada na criação inicial do diretor. Pode ser redefinida depois pelo botão de manutenção.</p>
        </div>
        <div class="field-doc">
          <strong>Status do diretor</strong>
          <small>Campo: Select</small>
          <p>Controla se o diretor está ativo ou inativo no ambiente.</p>
        </div>
        <div class="field-doc">
          <strong>Ações de manutenção</strong>
          <small>Campos: Cadastrar, salvar, redefinir senha e alternar status</small>
          <p>Essas ações usam Cloud Functions administrativas e devem ser restritas ao superusuário.</p>
        </div>
      </div>

      <h4 style="color: var(--primary-light); margin-top: 20px;">Manutenção de responsáveis</h4>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Criar usuários de responsáveis</strong>
          <small>Campo: Botão de manutenção</small>
          <p>Executa a rotina global que cria logins para responsáveis cadastrados em matrículas sem usuário correspondente.</p>
        </div>
      </div>
    `
  },

  portaria: {
    title: '🚪 Portaria e LGPD',
    content: `
      <p><strong>Descrição:</strong> Registro de retiradas, controle de identidade e gestão de consentimentos LGPD (Lei Geral de Proteção de Dados).</p>
      
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

      <p style="color: var(--text-muted); margin-top: 16px;"><strong>Boas práticas:</strong> confirme parentesco, documento e autorização antes de concluir a retirada, principalmente para terceiros autorizados.</p>

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
        <div class="field-doc">
          <strong>Termos por finalidade</strong>
          <small>Campo: Opções SIM/NÃO</small>
          <p>O sistema registra autorizações separadas para comunicação institucional, fotos/vídeos pedagógicos semanais e uso em eventos/redes sociais.</p>
        </div>
        <div class="field-doc">
          <strong>Edição de consentimento</strong>
          <small>Campo: Modo de edição</small>
          <p>Consentimentos já cadastrados podem ser revisados e atualizados sem perder o histórico operacional da matrícula.</p>
        </div>
      </div>
    `
  }
};

const manualOrder = [
  'agenda',
  'mural',
  'chat',
  'galeria',
  'autorizacoes',
  'bncc',
  'planejamento',
  'anamnese',
  'ocorrencias',
  'frequencia',
  'cobrancas',
  'regua',
  'extras',
  'caixa',
  'matriculas',
  'alunos',
  'prontuarios',
  'usuarios',
  'turmas',
  'portaria',
  'lgpd',
  'superadmin'
];

Object.assign(manualData, {
  galeria: {
    title: '📸 Galeria',
    content: `
      <p><strong>Descrição:</strong> Publicação de registros visuais das atividades da escola para consulta interna e compartilhamento conforme as permissões vigentes.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> selecione o aluno, informe a URL da imagem, registre uma legenda objetiva e confira se existe autorização adequada antes da divulgação.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Lista de seleção</small>
          <p>Identifica a criança vinculada ao registro fotográfico.</p>
        </div>
        <div class="field-doc">
          <strong>URL da Foto</strong>
          <small>Campo: Input de texto</small>
          <p>Endereço da imagem já hospedada para exibição no mural visual.</p>
        </div>
        <div class="field-doc">
          <strong>Legenda</strong>
          <small>Campo: Input de texto</small>
          <p>Descrição curta do contexto pedagógico ou institucional da foto.</p>
        </div>
      </div>
    `
  },
  autorizacoes: {
    title: '✅ Autorizações',
    content: `
      <p><strong>Descrição:</strong> Registro de permissões formais relacionadas ao aluno, incluindo uso de imagem, retirada por terceiros e outras autorizações específicas.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno ao qual a autorização se aplica.</p>
        </div>
        <div class="field-doc">
          <strong>Tipo de Autorização</strong>
          <small>Campo: Input de texto</small>
          <p>Classificação do consentimento ou permissão registrada.</p>
        </div>
        <div class="field-doc">
          <strong>Terceiro Autorizado</strong>
          <small>Campo: Input de texto opcional</small>
          <p>Preencha quando a autorização envolver retirada ou representação por outra pessoa.</p>
        </div>
      </div>
    `
  },
  bncc: {
    title: '📋 BNCC',
    content: `
      <p><strong>Descrição:</strong> Emissão de relatórios pedagógicos alinhados à BNCC, com foco em objetivos de aprendizagem, parecer descritivo e impressão da ficha.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> selecione aluno e faixa, revise a tabela de objetivos, registre o parecer global e salve antes de imprimir.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno e Faixa</strong>
          <small>Campos: Listas de seleção</small>
          <p>Definem a base curricular e o estudante avaliado.</p>
        </div>
        <div class="field-doc">
          <strong>Identificação pedagógica</strong>
          <small>Campos: Idade, período e professor</small>
          <p>Complementam a ficha com o contexto da turma e do ciclo letivo.</p>
        </div>
        <div class="field-doc">
          <strong>Matriz BNCC</strong>
          <small>Campo: Tabela interativa</small>
          <p>Permite registrar observações e evolução por objetivo de aprendizagem.</p>
        </div>
        <div class="field-doc">
          <strong>Parecer Global</strong>
          <small>Campo: Textarea</small>
          <p>Sintetiza o desenvolvimento do aluno em linguagem pedagógica formal.</p>
        </div>
      </div>
    `
  },
  planejamento: {
    title: '📝 Planejamento',
    content: `
      <p><strong>Descrição:</strong> Organização das atividades da turma com foco em faixa etária, objetivos e rotina pedagógica.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Identifica para qual grupo o planejamento será aplicado.</p>
        </div>
        <div class="field-doc">
          <strong>Faixa Etária</strong>
          <small>Campo: Input de texto</small>
          <p>Define o nível esperado de desenvolvimento das atividades.</p>
        </div>
        <div class="field-doc">
          <strong>Planejamento de Aulas</strong>
          <small>Campo: Textarea</small>
          <p>Registre objetivos, materiais, propostas e sequência de execução.</p>
        </div>
      </div>
    `
  },
  anamnese: {
    title: '🩺 Anamnese',
    content: `
      <p><strong>Descrição:</strong> Cadastro inicial de informações de saúde e cuidados essenciais do aluno para apoio pedagógico e segurança diária.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno associado à ficha.</p>
        </div>
        <div class="field-doc">
          <strong>Alergias</strong>
          <small>Campo: Input de texto</small>
          <p>Informe alergias alimentares, medicamentosas ou ambientais relevantes.</p>
        </div>
        <div class="field-doc">
          <strong>Restrições Alimentares</strong>
          <small>Campo: Input de texto</small>
          <p>Registre restrições permanentes ou temporárias.</p>
        </div>
        <div class="field-doc">
          <strong>Histórico de Saúde</strong>
          <small>Campo: Textarea</small>
          <p>Descreva informações clínicas importantes para acompanhamento institucional.</p>
        </div>
      </div>
    `
  },
  ocorrencias: {
    title: '⚠️ Ocorrências',
    content: `
      <p><strong>Descrição:</strong> Registro formal de eventos relevantes envolvendo o aluno, com foco em rastreabilidade e comunicação interna.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Identifica o estudante envolvido.</p>
        </div>
        <div class="field-doc">
          <strong>Tipo</strong>
          <small>Campo: Input de texto</small>
          <p>Classifique a natureza do evento para facilitar consulta futura.</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Textarea</small>
          <p>Relate o ocorrido, as providências tomadas e o encaminhamento dado.</p>
        </div>
      </div>
    `
  },
  frequencia: {
    title: '✏️ Frequência',
    content: `
      <p><strong>Descrição:</strong> Controle diário de presença por aluno e turma.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Data</strong>
          <small>Campo: Data</small>
          <p>Dia de referência do lançamento.</p>
        </div>
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campo: Input de texto</small>
          <p>Turma vinculada ao registro.</p>
        </div>
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Nome do aluno com presença registrada.</p>
        </div>
        <div class="field-doc">
          <strong>Presença</strong>
          <small>Campo: Select</small>
          <p>Indica se o aluno esteve presente ou ausente no período informado.</p>
        </div>
      </div>
    `
  },
  cobrancas: {
    title: '💰 Cobranças',
    content: `
      <p><strong>Descrição:</strong> Registro das mensalidades, taxas e cobranças individuais da escola.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> informe aluno, valor, vencimento e método, revise o status e use a régua para programar lembretes quando necessário.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Identifica quem está vinculado à cobrança.</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Montante cobrado em reais.</p>
        </div>
        <div class="field-doc">
          <strong>Vencimento</strong>
          <small>Campo: Data</small>
          <p>Prazo previsto para pagamento.</p>
        </div>
        <div class="field-doc">
          <strong>Método</strong>
          <small>Campo: Select</small>
          <p>Forma de pagamento associada à cobrança.</p>
        </div>
        <div class="field-doc">
          <strong>Status</strong>
          <small>Campo: Select</small>
          <p>Indica se a cobrança está pendente, paga ou atrasada.</p>
        </div>
        <div class="field-doc">
          <strong>Recorrência</strong>
          <small>Campo: Checkbox</small>
          <p>Use para cobranças periódicas, como mensalidades.</p>
        </div>
      </div>
    `
  },
  regua: {
    title: '📈 Régua',
    content: `
      <p><strong>Descrição:</strong> Programação de lembretes de cobrança por canal e data de envio.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>ID da Cobrança</strong>
          <small>Campo: Input de texto</small>
          <p>Referência da cobrança que receberá o lembrete.</p>
        </div>
        <div class="field-doc">
          <strong>Canal</strong>
          <small>Campo: Select</small>
          <p>Escolha entre e-mail, SMS ou aplicativo conforme o fluxo configurado.</p>
        </div>
        <div class="field-doc">
          <strong>Data do Lembrete</strong>
          <small>Campo: Data</small>
          <p>Define quando a automação deverá processar o envio.</p>
        </div>
      </div>
    `
  },
  extras: {
    title: '➕ Extras',
    content: `
      <p><strong>Descrição:</strong> Lançamento de serviços, materiais ou períodos adicionais fora da cobrança principal.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Aluno vinculado ao item adicional.</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Input de texto</small>
          <p>Identifica o serviço ou material cobrado.</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Valor financeiro do item extra.</p>
        </div>
        <div class="field-doc">
          <strong>Competência</strong>
          <small>Campo: Mês</small>
          <p>Mês de referência para consolidação financeira.</p>
        </div>
      </div>
    `
  },
  caixa: {
    title: '💼 Fluxo de Caixa',
    content: `
      <p><strong>Descrição:</strong> Controle das entradas e saídas financeiras da unidade.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Tipo</strong>
          <small>Campo: Select</small>
          <p>Defina se o lançamento é a receber ou a pagar.</p>
        </div>
        <div class="field-doc">
          <strong>Descrição</strong>
          <small>Campo: Input de texto</small>
          <p>Resumo objetivo da movimentação.</p>
        </div>
        <div class="field-doc">
          <strong>Valor</strong>
          <small>Campo: Número decimal</small>
          <p>Valor da movimentação.</p>
        </div>
        <div class="field-doc">
          <strong>Vencimento</strong>
          <small>Campo: Data</small>
          <p>Data prevista ou efetiva do movimento.</p>
        </div>
        <div class="field-doc">
          <strong>Número da Nota</strong>
          <small>Campo: Input de texto opcional</small>
          <p>Use para auditoria e conciliação documental.</p>
        </div>
      </div>
    `
  },
  matriculas: {
    title: '📚 Matrículas',
    content: `
      <p><strong>Descrição:</strong> Cadastro completo do aluno e do responsável, com documentos, foto, turma e dados contratuais.</p>
      <p style="color: var(--text-muted); margin-bottom: 16px;"><strong>Fluxo recomendado:</strong> preencha os dados do aluno, revise os dados do responsável, consulte o CEP, anexe documentos e finalize a matrícula antes de gerar acessos complementares.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Dados principais</strong>
          <small>Campos: Aluno, responsável e turma</small>
          <p>Formam a base do cadastro acadêmico e administrativo.</p>
        </div>
        <div class="field-doc">
          <strong>Contato do responsável</strong>
          <small>Campos: E-mail, CPF e telefone</small>
          <p>Usados para comunicação, vínculo de acesso e rotinas financeiras.</p>
        </div>
        <div class="field-doc">
          <strong>Endereço</strong>
          <small>Campos: CEP e logradouro</small>
          <p>Podem ser preenchidos com apoio da busca automática por CEP.</p>
        </div>
        <div class="field-doc">
          <strong>Documentos e foto</strong>
          <small>Campos: Upload, câmera e links</small>
          <p>Centralizam a documentação do aluno no processo de ingresso.</p>
        </div>
        <div class="field-doc">
          <strong>Contrato assinado</strong>
          <small>Campo: Checkbox</small>
          <p>Indica a formalização do vínculo contratual.</p>
        </div>
      </div>
    `
  },
  alunos: {
    title: '👤 Alunos',
    content: `
      <p><strong>Descrição:</strong> Consulta operacional da base de alunos já vinculada às matrículas da escola.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Lista de alunos</strong>
          <small>Campo: Painel de consulta</small>
          <p>Exibe os registros consolidados para conferência e apoio aos demais módulos.</p>
        </div>
      </div>
    `
  },
  prontuarios: {
    title: '📁 Prontuários',
    content: `
      <p><strong>Descrição:</strong> Arquivo documental do aluno com filtro por turma e professor, preview de anexos e observações de validade ou pendência.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Filtros</strong>
          <small>Campos: Turma, professor e busca por aluno</small>
          <p>Facilitam a localização dos documentos cadastrados.</p>
        </div>
        <div class="field-doc">
          <strong>Aluno e Tipo</strong>
          <small>Campos: Seleção do aluno e tipo do documento</small>
          <p>Identificam o prontuário que será salvo.</p>
        </div>
        <div class="field-doc">
          <strong>Arquivos</strong>
          <small>Campos: URLs, upload múltiplo e preview</small>
          <p>Permitem anexar documentos digitalizados com acompanhamento visual.</p>
        </div>
        <div class="field-doc">
          <strong>Observação</strong>
          <small>Campo: Textarea</small>
          <p>Registre validade, pendências e notas administrativas.</p>
        </div>
      </div>
    `
  },
  usuarios: {
    title: '👥 Usuários',
    content: `
      <p><strong>Descrição:</strong> Criação e atualização de contas de acesso da escola, com perfil e vínculo institucional.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Novo usuário</strong>
          <small>Campos: Nome, e-mail, senha e perfil</small>
          <p>Cria a conta de autenticação e o cadastro operacional do usuário.</p>
        </div>
        <div class="field-doc">
          <strong>Atualização de acesso</strong>
          <small>Campos: Seleção do usuário, UID, escola e perfil</small>
          <p>Permite corrigir escopo e permissões conforme a função do colaborador.</p>
        </div>
        <div class="field-doc">
          <strong>Usuários de responsáveis</strong>
          <small>Campo: Botão de manutenção</small>
          <p>Gera acessos de famílias a partir das matrículas existentes.</p>
        </div>
      </div>
    `
  },
  turmas: {
    title: '🏫 Turmas',
    content: `
      <p><strong>Descrição:</strong> Cadastro das turmas e das faixas etárias utilizadas na organização pedagógica e administrativa.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Turma</strong>
          <small>Campos: Nome, faixa etária, limite e professor</small>
          <p>Estrutura a composição das salas e sua capacidade.</p>
        </div>
        <div class="field-doc">
          <strong>Faixa etária</strong>
          <small>Campos: Nome e descrição</small>
          <p>Padroniza a classificação das turmas e relatórios pedagógicos.</p>
        </div>
      </div>
    `
  },
  portaria: {
    title: '🚪 Portaria',
    content: `
      <p><strong>Descrição:</strong> Registro de retirada com foco em segurança, identificação do retirante e rastreabilidade.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno</strong>
          <small>Campo: Input de texto</small>
          <p>Indica quem está deixando a unidade.</p>
        </div>
        <div class="field-doc">
          <strong>Retirado por</strong>
          <small>Campos: Nome e parentesco</small>
          <p>Identifica a pessoa responsável pela retirada.</p>
        </div>
        <div class="field-doc">
          <strong>Documento e foto</strong>
          <small>Campos: RG e URL da foto</small>
          <p>Servem para conferência da identidade no momento do atendimento.</p>
        </div>
      </div>
      <p style="color: var(--text-muted); margin-top: 16px;"><strong>Boas práticas:</strong> confirme a autorização previamente cadastrada e registre a retirada sem abreviações ou dados incompletos.</p>
    `
  },
  lgpd: {
    title: '🔐 LGPD',
    content: `
      <p><strong>Descrição:</strong> Formalização de consentimentos para tratamento de dados pessoais de menores, com escopos separados por finalidade.</p>
      <div class="fields-grid">
        <div class="field-doc">
          <strong>Aluno e responsável legal</strong>
          <small>Campos: Seleção do aluno e responsável</small>
          <p>Definem o titular dos dados e quem concede o consentimento.</p>
        </div>
        <div class="field-doc">
          <strong>Comunicação institucional</strong>
          <small>Campo: Radio SIM/NÃO</small>
          <p>Controla o uso de dados em canais de aviso e relacionamento escolar.</p>
        </div>
        <div class="field-doc">
          <strong>Fotos e vídeos pedagógicos</strong>
          <small>Campo: Radio SIM/NÃO</small>
          <p>Define se registros de rotina podem ser compartilhados em canais fechados da turma.</p>
        </div>
        <div class="field-doc">
          <strong>Eventos e redes sociais</strong>
          <small>Campo: Radio SIM/NÃO</small>
          <p>Regula a divulgação institucional em eventos, site e redes oficiais.</p>
        </div>
        <div class="field-doc">
          <strong>Modo de edição</strong>
          <small>Campo: Atualização de consentimento</small>
          <p>Permite revisar o termo sem perder a consistência do cadastro existente.</p>
        </div>
      </div>
    `
  }
});

function getPreferredHelpKey() {
  const activeItem = document.querySelector('.nav-item.active');
  if (!activeItem) {
    return null;
  }

  const activeSection = activeItem.getAttribute('data-section');
  return manualData[activeSection] ? activeSection : null;
}

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
    let indexHTML = '<div class="manual-section"><h3>📚 Índice de Módulos</h3><p>Selecione o módulo desejado. O índice abaixo segue a mesma ordem da navegação lateral do sistema.</p>';
    manualOrder.forEach(key => {
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
    helpBtn.addEventListener('click', () => openHelp(getPreferredHelpKey()));
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
