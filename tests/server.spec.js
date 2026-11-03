import { expect } from 'chai';
import nock from 'nock';
import { buildApp } from '../server.js';

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
