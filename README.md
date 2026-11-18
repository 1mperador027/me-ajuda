# Me Ajuda

Comparador de preços de eletrônicos para o Brasil.

## Integrações e estado

- **Mercado Livre:** endpoint de busca implementado com OAuth Bearer token. Configure `ML_ACCESS_TOKEN` na Vercel. O acesso também depende das permissões e políticas aplicadas à aplicação no DevCenter.
- **Amazon:** requer aprovação no programa de Associados, acesso à Creators API e credenciais.
- **Magalu:** requer habilitação comercial/API e credenciais de parceiro.
- **Shopee:** requer acesso aprovado à Open API de afiliados e credenciais.

O sistema não inventa ofertas: fontes sem acesso configurado aparecem como pendentes.

## Variáveis de ambiente

Configure em Vercel → Project → Settings → Environment Variables. Nunca coloque tokens no GitHub.

| Variável | Loja |
|---|---|
| `ML_ACCESS_TOKEN` | Mercado Livre OAuth |
| `AMAZON_PARTNER_TAG` | Amazon Associados |
| `AMAZON_CREDENTIAL_ID` | Amazon Creators API |
| `AMAZON_CREDENTIAL_SECRET` | Amazon Creators API |
| `MAGALU_API_BASE_URL` | Magalu parceiro |
| `MAGALU_API_TOKEN` | Magalu parceiro |
| `SHOPEE_APP_ID` | Shopee Open API |
| `SHOPEE_APP_SECRET` | Shopee Open API |

Um token do Mercado Livre pode expirar. Para operação contínua, será necessário implementar OAuth com refresh token e armazenamento seguro/rotativo, ou atualizar o token manualmente durante a fase de testes. A presença de credenciais não substitui aprovação, escopos ou permissões exigidas pela loja.

## Desenvolvimento

A interface está em `index.html`; a função serverless está em `api/search.js`.
