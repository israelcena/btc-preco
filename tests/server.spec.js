import { expect } from 'chai';
import nock from 'nock';
import { buildApp, formatarPrecoBRL } from '../server.js';

describe('API Fastify - Endpoints', () => {
    let app;

    before(async () => {
        app = buildApp();
        await app.ready();
    });

    after(async () => {
        await app.close();
        nock.cleanAll();
        nock.enableNetConnect();
    });

    afterEach(() => {
        nock.cleanAll();
    });

    describe('GET /api/health', () => {
        it('deve responder status ok', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/health' });
            expect(res.statusCode).to.equal(200);
            expect(res.json()).to.deep.equal({ status: 'ok', servico: 'crypto-preco' });
        });
    });

    describe('GET /api/precos', () => {
        it('deve retornar os preços em BRL retornados pela CoinGecko', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, {
                    bitcoin: { brl: 425810, last_updated_at: 1731888000 },
                    ethereum: { brl: 12595.34, last_updated_at: 1731888000 },
                });

            const res = await app.inject({ method: 'GET', url: '/api/precos' });
            expect(res.statusCode).to.equal(200);

            const body = res.json();
            expect(body.sucesso).to.equal(true);
            expect(body.precos.BTC.value).to.equal(425810);
            expect(body.precos.BTC.rate).to.equal('425.810,00');
            expect(body.precos.ETH.value).to.equal(12595.34);
            expect(body.precos.ETH.rate).to.equal('12.595,34');
        });

        it('não deve incluir coins ausentes na resposta da API', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, { bitcoin: { brl: 100, last_updated_at: 1731888000 } });

            const res = await app.inject({ method: 'GET', url: '/api/precos' });
            const body = res.json();
            expect(body.precos.BTC).to.exist;
            expect(body.precos.ETH).to.be.undefined;
        });

        it('deve retornar 502 quando a CoinGecko falha', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .replyWithError('falha de rede');

            const res = await app.inject({ method: 'GET', url: '/api/precos' });
            expect(res.statusCode).to.equal(502);
            expect(res.json().sucesso).to.equal(false);
        });
    });

    describe('GET /api/preco/:moeda', () => {
        it('deve retornar o preço de uma coin específica', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, { ethereum: { brl: 12595.34, last_updated_at: 1731888000 } });

            const res = await app.inject({ method: 'GET', url: '/api/preco/ETH' });
            expect(res.statusCode).to.equal(200);

            const body = res.json();
            expect(body.sucesso).to.equal(true);
            expect(body.code).to.equal('ETH');
            expect(body.rate).to.equal('12.595,34');
        });

        it('deve aceitar código em minúsculo', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, { bitcoin: { brl: 425810, last_updated_at: 1731888000 } });

            const res = await app.inject({ method: 'GET', url: '/api/preco/btc' });
            expect(res.statusCode).to.equal(200);
            expect(res.json().code).to.equal('BTC');
        });

        it('deve retornar 404 para coin não suportada (sem chamar API)', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/preco/XYZ' });
            expect(res.statusCode).to.equal(404);
            expect(res.json().erro).to.include('não suportada');
        });

        it('deve retornar 404 quando o preço não vem na resposta', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, {});

            const res = await app.inject({ method: 'GET', url: '/api/preco/ETH' });
            expect(res.statusCode).to.equal(404);
        });
    });

    describe('GET /api/busca', () => {
        it('deve retornar 400 para termo com menos de 2 caracteres', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/busca?q=a' });
            expect(res.statusCode).to.equal(400);
            expect(res.json().erro).to.include('ao menos 2 caracteres');
        });

        it('deve retornar 400 quando o termo está vazio', async () => {
            const res = await app.inject({ method: 'GET', url: '/api/busca' });
            expect(res.statusCode).to.equal(400);
        });

        it('deve buscar coins e retornar preços em BRL', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/search')
                .query(true)
                .reply(200, {
                    coins: [
                        { id: 'pepe', symbol: 'pepe', name: 'Pepe', thumb: 'https://x/pepe.png', market_cap_rank: 50 },
                        { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu', thumb: 'https://x/shib.png', market_cap_rank: 20 },
                    ],
                });

            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, {
                    pepe: { brl: 0.00005, last_updated_at: 1731888000 },
                    'shiba-inu': { brl: 0.0001, last_updated_at: 1731888000 },
                });

            const res = await app.inject({ method: 'GET', url: '/api/busca?q=pepe' });
            expect(res.statusCode).to.equal(200);

            const body = res.json();
            expect(body.sucesso).to.equal(true);
            expect(body.resultados).to.have.length(2);

            const pepe = body.resultados.find(r => r.code === 'PEPE');
            expect(pepe).to.exist;
            expect(pepe.name).to.equal('Pepe');
            expect(pepe.rate).to.equal('0,00005');
            expect(pepe.thumb).to.equal('https://x/pepe.png');

            const shib = body.resultados.find(r => r.code === 'SHIB');
            expect(shib.rate).to.equal('0,0001');
        });

        it('deve retornar lista vazia quando nada é encontrado', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/search')
                .query(true)
                .reply(200, { coins: [] });

            const res = await app.inject({ method: 'GET', url: '/api/busca?q=zzzzzz' });
            expect(res.statusCode).to.equal(200);
            expect(res.json().resultados).to.deep.equal([]);
        });

        it('deve remover símbolos duplicados', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/search')
                .query(true)
                .reply(200, {
                    coins: [
                        { id: 'coin-a', symbol: 'dup', name: 'Coin A', thumb: '', market_cap_rank: 1 },
                        { id: 'coin-b', symbol: 'dup', name: 'Coin B', thumb: '', market_cap_rank: 2 },
                    ],
                });

            nock('https://api.coingecko.com')
                .get('/api/v3/simple/price')
                .query(true)
                .reply(200, {
                    'coin-a': { brl: 10, last_updated_at: 1731888000 },
                    'coin-b': { brl: 20, last_updated_at: 1731888000 },
                });

            const res = await app.inject({ method: 'GET', url: '/api/busca?q=dup' });
            expect(res.json().resultados).to.have.length(1);
        });

        it('deve retornar 502 quando a busca falha', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/search')
                .query(true)
                .replyWithError('falha');

            const res = await app.inject({ method: 'GET', url: '/api/busca?q=pepe' });
            expect(res.statusCode).to.equal(502);
        });
    });

    describe('formatarPrecoBRL', () => {
        it('deve usar 2 casas para valores >= 1', () => {
            expect(formatarPrecoBRL(425810)).to.equal('425.810,00');
            expect(formatarPrecoBRL(12.5)).to.equal('12,50');
        });

        it('deve usar precisão adaptativa para valores pequenos', () => {
            expect(formatarPrecoBRL(0.412567)).to.equal('0,4126');
            expect(formatarPrecoBRL(0.00005)).to.equal('0,00005');
        });
    });

    describe('GET /api/variacao', () => {
        it('deve retornar a variação de 24h do Bitcoin', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/coins/bitcoin')
                .query(true)
                .reply(200, { market_data: { price_change_percentage_24h: 2.53 } });

            const res = await app.inject({ method: 'GET', url: '/api/variacao' });
            expect(res.statusCode).to.equal(200);
            expect(res.json().variacao).to.equal(2.53);
        });

        it('deve retornar 502 quando a API falha', async () => {
            nock('https://api.coingecko.com')
                .get('/api/v3/coins/bitcoin')
                .query(true)
                .replyWithError('falha');

            const res = await app.inject({ method: 'GET', url: '/api/variacao' });
            expect(res.statusCode).to.equal(502);
        });
    });

    describe('GET / (frontend)', () => {
        it('deve servir a página index.html', async () => {
            const res = await app.inject({ method: 'GET', url: '/' });
            expect(res.statusCode).to.equal(200);
            expect(res.body).to.include('Crypto Preço');
            expect(res.body).to.include('id="grid-moedas"');
        });
    });
});
