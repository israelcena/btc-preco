# BTC-Preço 💰

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![Coverage](https://img.shields.io/badge/coverage-%3E%3D80%25-brightgreen)](https://github.com/israelcena/btc-preco)

Um CLI moderno e elegante para consultar o preço do Bitcoin em tempo real em diferentes moedas.

## 🚀 Características

- ✅ Consulta de preço do Bitcoin em tempo real
- 💱 Suporte para múltiplas moedas (USD, BRL, EUR, GBP, JPY, ARS, CNY, INR, KRW, MXN)
- 🎨 Interface colorida e bonita no terminal
- ⚡ Rápido e eficiente
- 🧪 100% testado (cobertura > 80%)
- 🔒 Tratamento robusto de erros
- 🌐 API CoinGecko (confiável, sem rate limit rigoroso)

## 📦 Instalação

### Instalação Global

```bash
npm install -g btc-preco
```

### Instalação Local

```bash
npm install btc-preco
```

### A partir do código fonte

```bash
git clone https://github.com/israelcena/btc-preco.git
cd btc-preco
npm install
npm run build
npm link
```

## 🎯 Uso

### Consultar preço em USD (padrão)

```bash
btc-preco
```

### Consultar preço em outras moedas

```bash
btc-preco -c BRL
btc-preco -c EUR
btc-preco -c GBP
btc-preco -c JPY
btc-preco -c ARS
btc-preco -c CNY
btc-preco -c INR
btc-preco -c KRW
btc-preco -c MXN
```

### Ajuda

```bash
btc-preco --help
```

### Versão

```bash
btc-preco --version
```

## 💡 Exemplos

```bash
# Preço em Reais Brasileiros
$ btc-preco -c BRL

Fetching Bitcoin price in BRL...

============================================================
  💰 Bitcoin Price Information
============================================================

  Currency: Brazilian Real
  Rate:     415,838.00
  Symbol:   R$
  Updated:  Wed, 07 Oct 2026 13:20:20 GMT

============================================================

# Preço em Dólares
$ btc-preco -c USD

Fetching Bitcoin price in USD...

============================================================
  💰 Bitcoin Price Information
============================================================

  Currency: United States Dollar
  Rate:     83,447.00
  Symbol:   $
  Updated:  Wed, 07 Oct 2026 13:11:10 GMT

============================================================

# Preço em Euros
$ btc-preco -c EUR

Fetching Bitcoin price in EUR...

============================================================
  💰 Bitcoin Price Information
============================================================

  Currency: Euro
  Rate:     74,673.00
  Symbol:   €
  Updated:  Wed, 07 Oct 2026 13:11:50 GMT

============================================================
```

## 🛠️ Desenvolvimento

### Pré-requisitos

- Node.js >= 14.0.0
- npm >= 6.0.0

### Configuração do ambiente de desenvolvimento

```bash
# Clone o repositório
git clone https://github.com/israelcena/btc-preco.git
cd btc-preco

# Instale as dependências
npm install

# Execute os testes
npm test

# Execute com cobertura
npm run coverage

# Faça o build
npm run build
```

### Estrutura do Projeto

```
btc-preco/
├── src/
│   └── main.js           # Código principal do CLI
├── tests/
│   └── main.spec.js      # Testes unitários
├── bin/                  # Código compilado (gerado)
├── package.json
├── babel.config.json
└── README.md
```

### Scripts Disponíveis

- `npm test` - Executa os testes
- `npm run coverage` - Executa os testes com cobertura
- `npm run build` - Compila o código para produção
- `npm run clear` - Limpa a pasta bin

## 🧪 Testes

O projeto possui uma suíte completa de testes:

```bash
npm test
```

Para ver a cobertura de testes:

```bash
npm run coverage
```

## 📚 API

### fetchBitcoinPrice(currency)

Busca o preço do Bitcoin na moeda especificada.

**Parâmetros:**
- `currency` (String): Código da moeda (USD, BRL, EUR, etc.)

**Retorno:**
- Promise<Object>: Dados do preço do Bitcoin

**Exemplo:**
```javascript
import { cliCore } from 'btc-preco';

const data = await cliCore.fetchBitcoinPrice('BRL');
console.log(data);
```

### displayPrice(data, currency)

Exibe o preço do Bitcoin de forma formatada no console.

**Parâmetros:**
- `data` (Object): Dados retornados pela API
- `currency` (String): Código da moeda

## 🌍 Moedas Suportadas

O CLI suporta as seguintes moedas (via API CoinGecko):

- USD - Dólar Americano
- BRL - Real Brasileiro
- EUR - Euro
- GBP - Libra Esterlina
- JPY - Iene Japonês
- ARS - Peso Argentino
- CNY - Yuan Chinês
- INR - Rupia Indiana
- KRW - Won Sul-Coreano
- MXN - Peso Mexicano

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Sinta-se à vontade para:

1. Fazer um Fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENCE.md](LICENCE.md) para mais detalhes.

## 👤 Autor

**IsraelCena**

- GitHub: [@israelcena](https://github.com/israelcena)

## 🙏 Agradecimentos

- [CoinGecko](https://www.coingecko.com/) pela API de preços do Bitcoin
- Comunidade Node.js pelos excelentes pacotes e ferramentas

## 📊 Status do Projeto

✅ Projeto ativo e mantido

---

⭐ Se este projeto foi útil para você, considere dar uma estrela no GitHub!
