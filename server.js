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
const COINGECKO_SEARCH_API = 'https://api.coingecko.com/api/v3/search';

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
 * Formata valores em BRL com precisão adaptativa:
 * valores >= 1 usam 2 casas; valores pequenos usam 4 dígitos significativos.
 * Ex.: 425810 -> "425.810,00" | 0.00005 -> "0,00005"
 */
export function formatarPrecoBRL(valor) {
    if (valor >= 1) {
        return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return valor.toLocaleString('pt-BR', { maximumSignificantDigits: 4 });
}

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
                rate: formatarPrecoBRL(coinData.brl),
                value: coinData.brl,
                updated_at: updatedAt,
            };
        }
    });

    return { precos, updated_at: updatedAt };
}

/**
 * Busca criptomoedas por nome/símbolo e retorna os preços em BRL.
 * Usa /search para descobrir IDs e /simple/price para os preços.
 * @param {string} query - termo de busca
 * @param {number} limit - máximo de resultados
 */
export async function searchCoins(query, limit = 12) {
    const searchResponse = await axios.get(COINGECKO_SEARCH_API, {
        params: { query },
        timeout: 10000,
    });

    const coins = (searchResponse.data.coins || []).slice(0, limit);
    if (coins.length === 0) return [];

    const ids = coins.map(c => c.id).join(',');
    const priceResponse = await axios.get(COINGECKO_API, {
        params: {
            ids,
            vs_currencies: 'brl',
            include_last_updated_at: 'true',
        },
        timeout: 10000,
    });

    const prices = priceResponse.data || {};
    const firstCoin = Object.values(prices)[0];
    const updatedAt = new Date((firstCoin?.last_updated_at || Math.floor(Date.now() / 1000)) * 1000).toISOString();

    // Evita símbolos duplicados (diferentes coins podem compartilhar o mesmo ticker)
    const vistos = new Set();

    return coins
        .map(coin => {
            const preco = prices[coin.id];
            return {
                id: coin.id,
                code: (coin.symbol || '').toUpperCase(),
                name: coin.name,
                thumb: coin.thumb,
                market_cap_rank: coin.market_cap_rank ?? null,
                rate: preco?.brl !== undefined ? formatarPrecoBRL(preco.brl) : null,
                value: preco?.brl ?? null,
                updated_at: updatedAt,
            };
        })
        .filter(coin => {
            if (!coin.code || vistos.has(coin.code)) return false;
            vistos.add(coin.code);
            return true;
        });
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

    // API: busca de criptomoedas por nome/símbolo (com preços em BRL)
    app.get('/api/busca', async (request, reply) => {
        const query = String(request.query.q || '').trim();

        if (query.length < 2) {
            return reply.status(400).send({ sucesso: false, erro: 'Informe ao menos 2 caracteres para buscar.' });
        }

        try {
            const resultados = await searchCoins(query);
            reply.send({ sucesso: true, query, resultados });
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
