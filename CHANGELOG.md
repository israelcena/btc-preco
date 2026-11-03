# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-11-03

### Added
- **Dashboard web**: página responsiva com Bootstrap 5 no estilo DolarHoje, exibindo cotações de criptomoedas em Real (BRL)
- **10 criptomoedas**: BTC, ETH, ADA, SOL, DOGE, XRP, DOT, LTC, LINK e MATIC
- **Busca de criptomoedas**: campo gigante com debounce que consulta a API de search da CoinGecko e exibe resultados (incluindo shitcoins e tokens) com preços em BRL; clicar no resultado atualiza o destaque
  - `GET /api/busca?q=termo` — busca por nome/símbolo com preços em BRL
- **Formatação adaptativa de preços**: valores pequenos usam 4 dígitos significativos (ex.: `0,00002654` em vez de `0,00`)
- **Servidor Fastify**: serve o frontend e expõe API REST
  - `GET /api/precos` — cotações de todas as coins em BRL
  - `GET /api/preco/:moeda` — cotação de uma coin específica
  - `GET /api/variacao` — variação de 24h do Bitcoin
  - `GET /api/health` — health check
- **Interatividade**: clique (ou Enter/Espaço) em um card atualiza o preço em destaque no topo
- **Atualização automática** dos preços a cada 60 segundos e botão de refresh manual
- **Destaque ao clicar**: o card selecionado cresce (`scale(1.06)`) com sombra reforçada e mais espaço ao redor (grade com gutters maiores); no mobile a escala é reduzida
- **Busca integrada**: os resultados substituem os cards padrão enquanto a busca está ativa e usam exatamente o mesmo layout/efeito; sem resultados, **nenhum card é exibido** — aparece um estado vazio com ícone de lupa e a sugestão de tentar outro termo
- **Animações (inspiradas no Animista)**: entrada em cascata dos cards quando os resultados substituem a grade, pulso no card selecionado, "pop" no preço em destaque e fade na mensagem de status — com suporte a `prefers-reduced-motion`
- **Testes automatizados**: 62 novos testes (74 no total), incluindo testes de navegador com `jsdom` (busca, clique e destaque)
  - `tests/core.spec.js` — lógica pura (formatação, seleção, geração de cards)
  - `tests/server.spec.js` — endpoints com `app.inject()` e mock da CoinGecko via `nock`
  - `tests/frontend.spec.js` — contrato HTML ↔ JS
- **Scripts**: `npm start` e `npm run dev` para subir o servidor

### Changed
- **Frontend modular**: lógica pura extraída para `js/core.js` (testável em Node e browser)
- **`js/app.js`** agora é um ES module
- **`server.js`** refatorado com `buildApp()` exportável para testes sem subir servidor
- **Script de testes** compatível com Windows (sem `./node_modules/.bin/`)
- **Redesign do dashboard**: tema claro moderno com paleta laranja do Bitcoin, cards brancos, sombras suaves e textos com contraste adequado (substitui o tema escuro)
- **Responsividade completa**: layouts dedicados para mobile (<576px, incluindo <360px), tablet (576–991px), desktop (1400px+) e ultrawide (1800px+, com 5 cards por linha e container ampliado)
- **Acessibilidade de movimento**: respeita `prefers-reduced-motion`; hover desativado em dispositivos touch
- **Requisito de Node.js** atualizado para `>=20.19.0` (exigido por Babel 8 e Fastify 5), com `engines` no `package.json` e `.nvmrc` apontando para Node 24 LTS
- **README** atualizado com a nova versão mínima do Node

### Fixed
- **Rate limit da CoinGecko (429)**: cache em memória de 55s com fallback para o último preço válido — a página não mostra mais tudo como "indisponível" em picos de limite
- **Campo de busca**: layout refeito em estilo pill, corrigindo sobreposição do input com o botão
- **Atualização de preços**: merge corrigido, os valores agora atualizam sem perder os extras da busca
- **Segurança/performance**: frontend movido para `public/` e servidor restrito a essa pasta — `node_modules` não é mais enumerado nem exposto (a inicialização da API caiu de >2s para <1s)
- **Clique nos cards**: selecionar uma moeda não recria mais os cards nem reseta os valores para `--,--`
- **Contraste**: seção de cards não usa mais fundo claro com texto claro
- **Variação 24h**: busca via backend (`/api/variacao`), evitando chamadas diretas do browser à CoinGecko
- **Endpoint individual**: `last_updated_at` agora funciona para qualquer coin (não só Bitcoin)

## [1.1.0] - 2026-10-07

### Added
- **Nova API**: Migração de CoinDesk para CoinGecko (API confiável, sem problemas de DNS)
- **6 novas moedas suportadas**: JPY (Iene), ARS (Peso Argentino), CNY (Yuan Chinês), INR (Rupia Indiana), KRW (Won Sul-Coreano), MXN (Peso Mexicano)
- **Novos testes**: Rate limiting (429), preço não retornado pela API, timeout de rede (ETIMEDOUT/ECONNABORTED)
- **Cobertura de código**: Configuração nyc/c8 com threshold 80% (atual: 81.61%)
- **Badge de cobertura** no README

### Changed
- **Babel**: Atualizado v7 → v8 (compatível com Node.js 22+)
- **Ferramenta de cobertura**: nyc → c8 (nativo ESM, mais confiável)
- **Help do CLI**: Lista todas as 10 moedas suportadas
- **README**: Documentação atualizada com exemplos reais, moedas completas, créditos CoinGecko
- **Tratamento de erros**: Mensagens específicas para rate limit, timeout, moeda não suportada, preço ausente

### Fixed
- **Build**: Resolvido erro `LRUCache` do Babel v7 no Node 22
- **DNS**: CoinDesk não resolvia DNS no ambiente; CoinGecko funciona
- **Cobertura**: Era 0% (config quebrada), agora 81.61% com thresholds enforceados
- **Testes**: 9 → 12 passing

## [1.0.0] - 2025-11-18

### Added
- Versão inicial do CLI BTC-Preço
- Consulta de preço Bitcoin em USD, BRL, EUR, GBP via CoinDesk API
- Interface colorida com chalk
- Testes unitários com Mocha + Chai + Sinon
- Build com Babel
- Publicação como pacote npm global