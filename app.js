const YES_NO = [
  { value: 'sim', label: 'Sim' },
  { value: 'nao', label: 'Não' },
];

const HEALTH_CONDITIONS = [
  'Diabetes', 'Hipertensão', 'Problemas cardíacos', 'Problemas circulatórios',
  'Trombose', 'Varizes', 'Epilepsia', 'Doença autoimune',
  'Tratamento oncológico', 'Nenhuma', 'Outra',
];

const SKIN_CONDITIONS = [
  'Acne', 'Manchas ou melasma', 'Rosácea ou dermatite',
  'Sensibilidade', 'Feridas ou lesões', 'Nenhuma',
];

const TITLES = [
  '1. Identificação',
  '2. Atendimento desejado',
  '3. Informações de saúde',
  '4. Avaliação estética',
  '5. Rotina e hábitos',
  '6. Privacidade e imagem',
  '7. Confirmação eletrônica',
];

const state = {
  step: 1,
  isSending: false,
  values: {
    fullName: '', birthDate: '', phone: '', email: '',
    procedure: '', otherProcedure: '', objective: '', previousProcedure: '', previousResult: '',
    healthConditions: [], medicalTreatment: '', medications: '', allergies: '', surgery: '',
    pregnancy: '', breastfeeding: '', healthDetails: '', skinPain: '', skinType: '',
    skinConditions: [], acids: '', facialProcedure: '', circulation: '', restrictedArea: '',
    skinDetails: '', sunExposure: '', skincareRoutine: '', sunscreen: '', hormones: '',
    habitsDetails: '', dataConsent: '', imageConsent: '', confirmationDate: '', confirmed: false,
  },
};

const form = document.querySelector('#anamnese-form');
const formFields = document.querySelector('#form-fields');
const formActions = document.querySelector('#form-actions');
const formError = document.querySelector('#form-error');

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
  })[character]);
}

function phoneMask(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function requiredMark(required) {
  return required ? ' <em>*</em>' : '';
}

function field(label, control, required = false) {
  return `<label class="field-label">${label}${requiredMark(required)}${control}</label>`;
}

function textInput(key, options = {}) {
  const { type = 'text', placeholder = '', required = false, autocomplete = '', maxLength = '', inputMode = '' } = options;
  const value = escapeHtml(state.values[key]);
  const attrs = [
    `type="${type}"`, `data-key="${key}"`, `value="${value}"`,
    placeholder ? `placeholder="${escapeHtml(placeholder)}"` : '',
    required ? 'required' : '', autocomplete ? `autocomplete="${autocomplete}"` : '',
    maxLength ? `maxlength="${maxLength}"` : '', inputMode ? `inputmode="${inputMode}"` : '',
  ].filter(Boolean).join(' ');
  return `<input ${attrs} />`;
}

function textarea(key, rows = 4, required = false) {
  return `<textarea data-key="${key}" rows="${rows}" ${required ? 'required' : ''}>${escapeHtml(state.values[key])}</textarea>`;
}

function selectField(key, label, options = YES_NO, required = true) {
  const choices = [`<option value="">Selecione</option>`].concat(options.map((option) => {
    const selected = state.values[key] === option.value ? 'selected' : '';
    return `<option value="${escapeHtml(option.value)}" ${selected}>${escapeHtml(option.label)}</option>`;
  }));
  return field(label, `<select data-key="${key}" ${required ? 'required' : ''}>${choices.join('')}</select>`, required);
}

function choiceCards(key, options, required = true) {
  return `<div class="choice-cards" role="radiogroup" aria-label="${escapeHtml(key)}">${options.map((option) => {
    const checked = state.values[key] === option.value ? 'checked' : '';
    return `<label class="choice-card"><input type="radio" name="${key}" data-key="${key}" value="${escapeHtml(option.value)}" ${checked} ${required ? 'required' : ''} /><span>${escapeHtml(option.label)}</span></label>`;
  }).join('')}</div>`;
}

function checkboxGrid(key, options) {
  const selected = state.values[key];
  return `<div class="check-grid check-grid-2">${options.map((option) => {
    const checked = selected.includes(option) ? 'checked' : '';
    return `<label class="check-card"><input type="checkbox" data-key="${key}" data-option="${escapeHtml(option)}" ${checked} /><span>${escapeHtml(option)}</span></label>`;
  }).join('')}</div>`;
}

function stepOne() {
  const emailInvalid = state.values.email && !validEmail(state.values.email);
  return `
    <aside class="notice">Preencha esta ficha com atenção. As informações serão usadas para avaliar a segurança do atendimento.<br />Campos marcados com * são obrigatórios.</aside>
    <div class="field-grid">
      ${field('Nome completo', textInput('fullName', { required: true, autocomplete: 'name' }), true)}
      ${field('Data de nascimento', textInput('birthDate', { type: 'date', required: true, autocomplete: 'bday' }), true)}
      ${field('WhatsApp', textInput('phone', { type: 'tel', placeholder: '(11) 99999-9999', required: true, autocomplete: 'tel', maxLength: 15, inputMode: 'numeric' }), true)}
      ${field('E-mail', `${textInput('email', { type: 'email', required: true, autocomplete: 'email' })}<span id="email-warning" class="field-warning" ${emailInvalid ? '' : 'hidden'}>Digite um e-mail válido, como nome@dominio.com.</span>`, true)}
    </div>`;
}

function stepTwo() {
  const procedures = [
    { value: 'Limpeza de pele', label: 'Limpeza de pele' }, { value: 'Peeling', label: 'Peeling' },
    { value: 'Microagulhamento', label: 'Microagulhamento' }, { value: 'Massagem modeladora', label: 'Massagem modeladora' },
    { value: 'Outro procedimento', label: 'Outro procedimento' },
  ];
  return `<div class="stack">
    ${selectField('procedure', 'Procedimento', procedures)}
    ${state.values.procedure === 'Outro procedimento' ? field('Qual procedimento deseja realizar?', textInput('otherProcedure', { required: true }), true) : ''}
    ${field('Principal objetivo', textarea('objective', 4, true), true)}
    ${field('Já realizou esse procedimento?', choiceCards('previousProcedure', YES_NO), true)}
    ${field('Se sim, informe quando e como foi o resultado', textarea('previousResult', 4))}
  </div>`;
}

function stepThree() {
  return `<div class="stack">
    ${field('Marque as condições que possui ou já apresentou', checkboxGrid('healthConditions', HEALTH_CONDITIONS), true)}
    <div class="field-grid compact-grid">
      ${selectField('medicalTreatment', 'Tratamento médico atual?')}
      ${selectField('medications', 'Usa medicamentos?')}
      ${selectField('allergies', 'Possui alergias?')}
      ${selectField('surgery', 'Passou por cirurgia?')}
      ${selectField('pregnancy', 'Grávida ou possibilidade?')}
      ${selectField('breastfeeding', 'Está amamentando?')}
    </div>
    ${field('Medicamentos, alergias, cirurgias, tratamentos ou outras informações importantes', textarea('healthDetails', 4))}
    ${selectField('skinPain', 'Possui dor, febre, inflamação, infecção ou lesão na área?')}
  </div>`;
}

function stepFour() {
  const skinTypes = [
    { value: 'normal', label: 'Normal' }, { value: 'seca', label: 'Seca' }, { value: 'oleosa', label: 'Oleosa' },
    { value: 'mista', label: 'Mista' }, { value: 'nao-sei', label: 'Não sei informar' },
  ];
  return `<div class="stack">
    ${selectField('skinType', 'Tipo de pele', skinTypes)}
    ${field('Condições da pele', checkboxGrid('skinConditions', SKIN_CONDITIONS))}
    <div class="field-grid compact-grid">
      ${selectField('acids', 'Usa ou usou ácidos recentemente?')}
      ${selectField('facialProcedure', 'Procedimento facial recente?')}
      ${selectField('circulation', 'Possui varizes ou alteração circulatória?')}
      ${selectField('restrictedArea', 'Há região que não deve ser manipulada?')}
    </div>
    ${field('Detalhes adicionais', textarea('skinDetails', 4))}
  </div>`;
}

function stepFive() {
  const frequency = [
    { value: 'nunca', label: 'Nunca' }, { value: 'raramente', label: 'Raramente' },
    { value: 'as-vezes', label: 'Às vezes' }, { value: 'frequentemente', label: 'Frequentemente' },
  ];
  return `<div class="stack">
    <aside class="notice">Estas informações ajudam a personalizar orientações antes e depois do atendimento.</aside>
    <div class="field-grid compact-grid">
      ${selectField('sunExposure', 'Exposição solar sem proteção?', frequency)}
      ${selectField('sunscreen', 'Usa protetor solar?', frequency)}
      ${selectField('skincareRoutine', 'Possui rotina de cuidados com a pele?')}
      ${selectField('hormones', 'Usa hormônios ou anticoncepcional?')}
    </div>
    ${field('Produtos que utiliza, hábitos ou observações relevantes', textarea('habitsDetails', 5))}
  </div>`;
}

function stepSix() {
  const imageOptions = [
    { value: 'autorizo', label: 'Autorizo o uso de imagem' },
    { value: 'nao-autorizo', label: 'Não autorizo o uso de imagem' },
  ];
  const consentOptions = [
    { value: 'aceito', label: 'Li e autorizo o tratamento dos dados para as finalidades informadas.' },
    { value: 'recuso', label: 'Não autorizo.' },
  ];
  return `<div class="stack">
    <aside class="privacy-copy">Autorizo a Clau Estética a coletar e utilizar os dados pessoais e as informações de saúde fornecidas exclusivamente para avaliação, planejamento, execução e acompanhamento dos serviços, comunicação sobre o atendimento e cumprimento de obrigações aplicáveis.<br /><br />Estou ciente de que o acesso deve ser restrito às pessoas responsáveis pelo atendimento. Posso solicitar atualização ou correção das informações pelos canais oficiais da Clau Estética.</aside>
    ${field('Consentimento de dados', choiceCards('dataConsent', consentOptions), true)}
    ${selectField('imageConsent', 'Autorização de imagem', imageOptions)}
    <p class="help-text">A autorização de divulgação é opcional e a recusa não impede o atendimento.</p>
  </div>`;
}

function stepSeven() {
  return `<div class="stack">
    <aside class="notice">Revise suas respostas. Ao digitar seu nome abaixo, você registra sua confirmação eletrônica nesta ficha.</aside>
    ${field('Digite seu nome completo', textInput('fullName', { required: true, autocomplete: 'name' }), true)}
    ${field('Data da confirmação', textInput('confirmationDate', { type: 'date', required: true }), true)}
    <label class="confirm-card"><input type="checkbox" data-key="confirmed" ${state.values.confirmed ? 'checked' : ''} required /><span>Confirmo que fui eu quem preencheu este formulário, li as declarações e concordo com as confirmações assinaladas.</span></label>
    <p class="help-text">Ao enviar a ficha, suas respostas serão encaminhadas ao e-mail responsável pelo atendimento.</p>
  </div>`;
}

function getStepContent() {
  return [stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven][state.step - 1]();
}

function clearError() {
  formError.hidden = true;
  formError.textContent = '';
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function render() {
  document.querySelector('#progress-fill').style.width = `${(state.step / 7) * 100}%`;
  document.querySelector('#step-label').textContent = `Etapa ${state.step} de 7`;
  document.querySelector('#form-title').textContent = TITLES[state.step - 1];
  formFields.innerHTML = getStepContent();
  formActions.className = `form-actions ${state.step === 1 ? 'form-actions-end' : ''}`;
  formActions.innerHTML = `${state.step > 1 ? '<button class="button button-secondary" type="button" data-action="back">Voltar</button>' : ''}<button class="button button-primary" type="submit" ${state.isSending ? 'disabled' : ''}>${state.step === 7 ? (state.isSending ? 'Enviando...' : 'Enviar ficha') : 'Continuar'}</button>`;
}

function updateEmailWarning(input) {
  const warning = document.querySelector('#email-warning');
  if (!warning) return;
  const invalid = input.value.length > 0 && !validEmail(input.value);
  input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
  warning.hidden = !invalid;
}

function toggleCheckbox(key, option) {
  const current = state.values[key];
  if (option === 'Nenhuma') {
    state.values[key] = current.includes(option) ? [] : [option];
    return;
  }
  const withoutNone = current.filter((value) => value !== 'Nenhuma');
  state.values[key] = withoutNone.includes(option) ? withoutNone.filter((value) => value !== option) : [...withoutNone, option];
}

form.addEventListener('input', (event) => {
  const input = event.target;
  const key = input.dataset.key;
  if (!key) return;
  if (input.dataset.option) return;
  if (key === 'phone') input.value = phoneMask(input.value);
  if (input.type === 'checkbox') state.values[key] = input.checked;
  else if (input.type !== 'radio') state.values[key] = input.value;
  if (key === 'email') updateEmailWarning(input);
  clearError();
});

form.addEventListener('change', (event) => {
  const input = event.target;
  const key = input.dataset.key;
  if (!key) return;
  if (input.dataset.option) {
    toggleCheckbox(key, input.dataset.option);
    clearError();
    render();
    return;
  }
  if (input.type === 'radio') state.values[key] = input.value;
  else if (input.type === 'checkbox') state.values[key] = input.checked;
  else state.values[key] = input.value;
  clearError();
  if (key === 'procedure') render();
});

formActions.addEventListener('click', (event) => {
  const action = event.target.dataset.action;
  if (action === 'back') {
    state.step = Math.max(1, state.step - 1);
    clearError();
    render();
  }
});

function validateCurrentStep() {
  if (!form.checkValidity()) {
    form.reportValidity();
    return false;
  }
  if (state.step === 1 && !validEmail(state.values.email)) {
    showError('Digite um e-mail válido, como nome@dominio.com.');
    return false;
  }
  if (state.step === 3 && !state.values.healthConditions.length) {
    showError('Selecione ao menos uma condição de saúde.');
    return false;
  }
  return true;
}

function renderSuccess() {
  const name = escapeHtml(state.values.fullName || 'cliente');
  document.querySelector('.form-area').innerHTML = `<div class="form-card success-card" role="status"><div class="success-icon">✓</div><h1>Ficha recebida</h1><p>Obrigada, ${name}. Sua ficha foi enviada ao e-mail responsável pelo atendimento.</p></div>`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateCurrentStep()) return;
  if (state.step < 7) {
    state.step += 1;
    clearError();
    render();
    return;
  }
  state.isSending = true;
  clearError();
  render();
  try {
    const response = await fetch('/api/send-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: state.values }),
    });
    if (!response.ok) throw new Error('Falha no envio');
    renderSuccess();
  } catch {
    state.isSending = false;
    showError('Não foi possível enviar a ficha agora. Verifique sua conexão e tente novamente.');
    render();
  }
});

render();
