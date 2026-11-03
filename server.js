/**
 * Crypto Preço - Servidor Fastify
 * Serve a página web e expõe API de preços de criptomoedas em BRL via CoinGecko.
 */

import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const COINGECKO_COIN_API = 'https://api.coingecko.com/api/v3/coins/bitcoin';

// Criptomoedas suportadas (preço em BRL)
export const COINS = {
    BTC: { symbol: '₿', name: 'Bitcoin', coingeckoId: 'bitcoin' },
    ETH: { symbol: 'Ξ', name: 'Ethereum', coingeckoId: 'ethereum' },
    ADA: { symbol: 'ₐ', name: 'Cardano', coingeckoId: 'cardano' },
    SOL: { symbol: '◎', name: 'Solana', coingeckoId: 'solana' },
    DOGE: { symbol: 'Ð', name: 'Dogecoin', coingeckoId: 'dogecoin' },
    XRP: { symbol: '✕', name: 'XRP', coingeckoId: 'ripple' },
    DOT: { symbol: '●', name: 'Polkadot', coingeckoId: 'polkadot' },
    LTC: { symbol: 'Ł', name: 'Litecoin', coingeckoId: 'litecoin' },
    LINK: { symbol: '⌘', name: 'Chainlink', coingeckoId: 'chainlink' },
    MATIC: { symbol: '▲', name: 'Polygon', coingeckoId: 'matic-network' },
};

/**
 * Busca preços de criptomoedas em BRL na CoinGecko
 * @param {string[]} coinIds - IDs da CoinGecko
 */
export async function fetchCryptoPrices(coinIds = ['bitcoin']) {
    const response = await axios.get(COINGECKO_API, {
        params: {
            ids: coinIds.join(','),
            vs_currencies: 'brl',
            include_last_updated_at: 'true',
        },
        timeout: 10000,
    });

    const data = response.data;
    const firstCoin = Object.values(data)[0];
    const lastUpdated = firstCoin?.last_updated_at || Math.floor(Date.now() / 1000);
    const updatedAt = new Date(lastUpdated * 1000).toISOString();

    const precos = {};
    Object.entries(COINS).forEach(([codigo, info]) => {
        const coinData = data[info.coingeckoId];
        if (coinData && coinData.brl !== undefined) {
            precos[codigo] = {
                code: codigo,
                symbol: info.symbol,
                name: info.name,
                rate: coinData.brl.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                value: coinData.brl,
                updated_at: updatedAt,
            };
        }
    });

    return { precos, updated_at: updatedAt };
}

/** Busca variação de 24h do Bitcoin */
export async function fetchBitcoinVariation() {
    const response = await axios.get(COINGECKO_COIN_API, {
        params: {
            localization: 'false',
            tickers: 'false',
            market_data: 'true',
            community_data: 'false',
            developer_data: 'false',
            sparkline: 'false',
        },
        timeout: 10000,
    });

    return response.data?.market_data?.price_change_percentage_24h ?? null;
}

/**
 * Constrói a aplicação Fastify (exportada para testes com inject)
 */
export function buildApp(options = {}) {
    const app = fastify({ logger: options.logger ?? false });

    // Registra servidor de arquivos estáticos
    app.register(fastifyStatic, {
        root: path.join(__dirname),
        wildcard: false,
    });

    // API: lista de preços de todas as criptomoedas em BRL
    app.get('/api/precos', async (request, reply) => {
        try {
            const coinIds = Object.values(COINS).map(c => c.coingeckoId);
            const data = await fetchCryptoPrices(coinIds);
            reply.send({ sucesso: true, ...data });
        } catch (error) {
            app.log.error(error);
            reply.status(502).send({ sucesso: false, erro: error.message });
        }
    });

    // API: preço de uma criptomoeda específica
    app.get('/api/preco/:moeda', async (request, reply) => {
        try {
            const { moeda } = request.params;
            const codigo = moeda.toUpperCase();
            const info = COINS[codigo];

            if (!info) {
                return reply.status(404).send({ sucesso: false, erro: `Criptomoeda ${moeda} não suportada` });
            }

            const data = await fetchCryptoPrices([info.coingeckoId]);
            const preco = data.precos[codigo];

            if (!preco) {
                return reply.status(404).send({ sucesso: false, erro: `Preço de ${codigo} não disponível` });
            }

            reply.send({ sucesso: true, ...preco, updated_at: data.updated_at });
        } catch (error) {
            app.log.error(error);
            reply.status(502).send({ sucesso: false, erro: error.message });
        }
    });

    // API: variação 24h do Bitcoin
    app.get('/api/variacao', async (request, reply) => {
        try {
            const variacao = await fetchBitcoinVariation();
            reply.send({ sucesso: true, variacao });
        } catch (error) {
            app.log.error(error);
            reply.status(502).send({ sucesso: false, erro: error.message });
        }
    });

    // API: health check
    app.get('/api/health', async () => ({ status: 'ok', servico: 'crypto-preco' }));

    return app;
}

const app = buildApp({ logger: true });

// Só escuta quando executado diretamente (não em testes)
const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;

if (isMain) {
    const PORT = process.env.PORT || 3333;
    const HOST = '0.0.0.0';

    app.listen({ port: PORT, host: HOST }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        console.log(`🚀 Servidor rodando em ${address}`);
    });
}

export default app;
