# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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