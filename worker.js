const FIELD_LABELS = {
  fullName: 'Nome completo', birthDate: 'Data de nascimento', phone: 'WhatsApp', email: 'E-mail',
  procedure: 'Procedimento', otherProcedure: 'Outro procedimento', objective: 'Principal objetivo',
  previousProcedure: 'Já realizou esse procedimento?', previousResult: 'Experiência anterior e resultado',
  healthConditions: 'Condições de saúde', medicalTreatment: 'Tratamento médico atual?', medications: 'Usa medicamentos?',
  allergies: 'Possui alergias?', surgery: 'Passou por cirurgia?', pregnancy: 'Grávida ou possibilidade?',
  breastfeeding: 'Está amamentando?', healthDetails: 'Informações de saúde adicionais',
  skinPain: 'Dor, febre, inflamação, infecção ou lesão na área?', skinType: 'Tipo de pele',
  skinConditions: 'Condições da pele', acids: 'Usa ou usou ácidos recentemente?', facialProcedure: 'Procedimento facial recente?',
  circulation: 'Possui varizes ou alteração circulatória?', restrictedArea: 'Há região que não deve ser manipulada?',
  skinDetails: 'Detalhes adicionais da pele', sunExposure: 'Exposição solar sem proteção?',
  skincareRoutine: 'Possui rotina de cuidados com a pele?', sunscreen: 'Usa protetor solar?',
  hormones: 'Usa hormônios ou anticoncepcional?', habitsDetails: 'Produtos, hábitos ou observações',
  dataConsent: 'Consentimento de dados', imageConsent: 'Autorização de imagem',
  confirmationDate: 'Data da confirmação', confirmed: 'Confirmação eletrônica',
};

function asText(value) {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'Não informado';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  return String(value ?? '').trim() || 'Não informado';
}

function formLines(values) {
  return Object.entries(FIELD_LABELS).map(([key, label]) => `${label}: ${asText(values[key])}`);
}

function ascii(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '?');
}

function escapePdf(value) {
  return ascii(value).replace(/([\\()])/g, '\\$1');
}

function wrap(value, width) {
  const words = ascii(value).replace(/\s+/g, ' ').trim().split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= width) {
      current = candidate;
    } else if (word.length > width) {
      if (current) lines.push(current);
      for (let position = 0; position < word.length; position += width) lines.push(word.slice(position, position + width));
      current = '';
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ['Não informado'];
}

function createFormPdf(values) {
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 48;
  const entries = [];
  Object.entries(FIELD_LABELS).forEach(([key, label]) => {
    entries.push({ text: label, bold: true });
    wrap(asText(values[key]), 78).forEach((text) => entries.push({ text, indent: 12 }));
    entries.push({ text: '' });
  });

  const pages = [[]];
  let usedHeight = 0;
  const lineHeight = 13;
  const availableHeight = 670;
  entries.forEach((entry) => {
    if (usedHeight + lineHeight > availableHeight) {
      pages.push([]);
      usedHeight = 0;
    }
    pages[pages.length - 1].push(entry);
    usedHeight += lineHeight;
  });

  function pageStream(lines, pageNumber, totalPages) {
    const operations = [
      'q', '0.58 0.48 0.22 rg', `0.7 w ${margin} 758 m ${pageWidth - margin} 758 l S`, '0 0 0 rg',
      'BT', '/F2 18 Tf', `1 0 0 1 ${margin} 790 Tm`, '(FICHA DIGITAL DE ANAMNESE) Tj',
      '/F1 9 Tf', `1 0 0 1 ${margin} 773 Tm`, '(Clau Estetica - formulario recebido) Tj',
      `1 0 0 1 ${pageWidth - 110} 773 Tm`, `(Pagina ${pageNumber} de ${totalPages}) Tj`, 'ET',
    ];
    let y = 732;
    lines.forEach((line) => {
      if (line.text) {
        operations.push('BT', `/${line.bold ? 'F2' : 'F1'} ${line.bold ? 9.5 : 9} Tf`, `1 0 0 1 ${margin + (line.indent ?? 0)} ${y} Tm`, `(${escapePdf(line.text)}) Tj`, 'ET');
      }
      y -= lineHeight;
    });
    operations.push('Q');
    return operations.join('\n');
  }

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>', '',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  const pageIds = [];
  pages.forEach((page, index) => {
    const content = pageStream(page, index + 1, pages.length);
    const contentId = objects.length + 1;
    const pageId = contentId + 1;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let output = '%PDF-1.4\n%----\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(output.length);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) output += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(output);
}

function toBase64(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function toBase64Url(value) {
  return toBase64(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function bytesToBase64(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function wrapBase64(value) {
  return value.match(/.{1,76}/g)?.join('\r\n') ?? value;
}

function encodedHeader(value) {
  return `=?UTF-8?B?${toBase64(value.replace(/[\r\n]+/g, ' '))}?=`;
}

function buildMessage(values, sender, recipient) {
  const fullName = asText(values.fullName).replace(/[\r\n]+/g, ' ');
  const boundary = `form-${crypto.randomUUID()}`;
  const body = ['Nova ficha de anamnese recebida.', 'O PDF completo da ficha segue anexado a este e-mail.', '', ...formLines(values)].join('\r\n');
  const attachment = wrapBase64(bytesToBase64(createFormPdf(values)));
  return [
    `From: ${encodedHeader('Clau Estética')} <${sender}>`, `To: ${recipient}`,
    `Subject: ${encodedHeader(`Nova ficha de anamnese - ${fullName}`)}`, 'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`, '', `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', body, '',
    `--${boundary}`, 'Content-Type: application/pdf; name="ficha-anamnese.pdf"',
    'Content-Transfer-Encoding: base64', 'Content-Disposition: attachment; filename="ficha-anamnese.pdf"', '',
    attachment, `--${boundary}--`,
  ].join('\r\n');
}

async function sendForm(request, env) {
  try {
    const { values } = await request.json();
    if (!values || typeof values.fullName !== 'string' || typeof values.email !== 'string' || values.confirmed !== true) {
      return Response.json({ error: 'Dados incompletos.' }, { status: 400 });
    }
    const required = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_SENDER_EMAIL', 'FORM_RECIPIENT_EMAIL'];
    if (required.some((key) => !env[key])) return Response.json({ error: 'O envio não está configurado.' }, { status: 503 });

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: env.GMAIL_CLIENT_ID, client_secret: env.GMAIL_CLIENT_SECRET, refresh_token: env.GMAIL_REFRESH_TOKEN, grant_type: 'refresh_token' }),
    });
    const token = await tokenResponse.json();
    if (!tokenResponse.ok || !token.access_token) throw new Error('Falha de autenticação no Gmail.');

    const messageResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: toBase64Url(buildMessage(values, env.GMAIL_SENDER_EMAIL, env.FORM_RECIPIENT_EMAIL)) }),
    });
    if (!messageResponse.ok) throw new Error('Falha ao enviar o e-mail.');
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Não foi possível enviar a ficha.' }, { status: 500 });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/send-form' && request.method === 'POST') return sendForm(request, env);
    if (url.pathname === '/api/send-form') return new Response('Método não permitido.', { status: 405 });
    return env.ASSETS.fetch(request);
  },
};
