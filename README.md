# Categorizador Bancário

Aplicação SPA gamificada para categorização de estabelecimentos bancários, conectada ao Google Sheets via Google Apps Script.

## 🚀 Como Rodar o Projeto

### Pré-requisitos
- Node.js (v18+)
- NPM ou Yarn

### Instalação
1. Clone o repositório.
2. Instale as dependências:
   ```bash
   npm install
   ```

### Execução em Desenvolvimento
Para rodar a aplicação localmente:
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador.

### Build para Produção
Para gerar os arquivos estáticos para deploy:
```bash
npm run build
```
Os arquivos serão gerados na pasta `dist/`.

## ⚙️ Configuração da API (Google Apps Script)

A aplicação se comunica com um script do Google Apps Script. A URL padrão está configurada no arquivo `.env.example` (e deve ser copiada para `.env` se necessário, embora o Vite carregue variáveis de ambiente automaticamente em alguns contextos ou via `import.meta.env`).

**URL Atual:**
`https://script.google.com/macros/s/AKfycbwvlvTDoJEyKExJEU4Wpi_VsNXfjn_-gq9_vQeLA-8ZQIR7MTXFWAoveI0rmvwbVYtE/exec`

### Caso a URL mude:
1. Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`).
2. Adicione a nova URL:
   ```env
   VITE_APPS_SCRIPT_URL=SUA_NOVA_URL_AQUI
   ```
3. Reinicie o servidor de desenvolvimento (`npm run dev`) ou refaça o build (`npm run build`).

## 📱 Funcionalidades
- **Offline First:** Funciona sem internet. As categorizações são salvas localmente e sincronizadas quando a conexão retorna.
- **Gamificação:** Feedback visual (confetes) a cada 10 categorizações.
- **Acessibilidade:** Botões grandes e alto contraste.

## 🛠️ Tecnologias
- React 18 + Vite
- Material UI (MUI) v5
- TanStack Query (React Query)
- Framer Motion
- IDB-Keyval (IndexedDB wrapper)

## 📦 Deploy (GitHub Pages)
O projeto está pronto para deploy no GitHub Pages.
1. Ajuste a propriedade `base` no `vite.config.ts` se estiver rodando em um subdiretório.
2. Rode o build: `npm run build`.
3. Faça o deploy da pasta `dist/`.
