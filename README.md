# Clau Estética - HTML, CSS e JavaScript

O formulário usa HTML, CSS e JavaScript puro. O arquivo `worker.js` recebe a ficha, gera o PDF e envia o e-mail sem expor as credenciais do Gmail no navegador.

## Publicação com Cloudflare Workers

1. Envie estes arquivos para um repositório no GitHub.
2. Instale o Wrangler e entre na sua conta Cloudflare:

   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. Configure estas variáveis no painel da Cloudflare:

   - `GMAIL_CLIENT_ID`
   - `GMAIL_CLIENT_SECRET`
   - `GMAIL_REFRESH_TOKEN`
   - `GMAIL_SENDER_EMAIL`
   - `FORM_RECIPIENT_EMAIL`

4. Publique com `npm run deploy`.

Para testar no computador, crie um arquivo `.dev.vars` com essas variáveis e execute `npm run dev`. Nunca envie esse arquivo ao GitHub.
