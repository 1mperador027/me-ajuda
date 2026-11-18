# Me Ajuda

Comparador de preços de eletrônicos para o Brasil.

## Estado da integração

- **Mercado Livre:** busca pública pelo catálogo do site MLB implementada no endpoint `/api/search`.
- **Amazon:** conector pendente de acesso aprovado à Creators API e credenciais de Associados.
- **Magalu:** conector pendente de habilitação comercial/API para o canal de parceiro.
- **Shopee:** conector pendente de aprovação/acesso à Open API de afiliados e credenciais.

O sistema não inventa ofertas: fontes sem acesso configurado aparecem como pendentes.

## Publicação

Projeto compatível com Vercel. A pasta `api/` contém funções serverless; `index.html` é a interface estática.

## Variáveis de ambiente

Configure somente no painel da Vercel (Settings → Environment Variables), nunca no GitHub:

| Variável | Loja |
|---|---|
| `AMAZON_PARTNER_TAG` | Amazon Associados |
| `AMAZON_CREDENTIAL_ID` | Amazon Creators API |
| `AMAZON_CREDENTIAL_SECRET` | Amazon Creators API |
| `MAGALU_API_BASE_URL` | Magalu parceiro |
| `MAGALU_API_TOKEN` | Magalu parceiro |
| `SHOPEE_APP_ID` | Shopee Open API |
| `SHOPEE_APP_SECRET` | Shopee Open API |

A presença das variáveis não substitui aprovação, contrato, escopo ou homologação exigidos pela loja. Não coloque segredos em arquivos públicos.

## Desenvolvimento local

Requer Node.js e Vercel CLI para executar a função serverless:

```bash
npm i -g vercel
vercel dev
```

A interface consulta `/api/search?q=termo`.
