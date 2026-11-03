import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const PRECOS_MOCK = {
    precos: {
        BTC: {
            code: 'BTC', symbol: '₿', name: 'Bitcoin',
            rate: '425.810,00', value: 425810,
            updated_at: '2026-11-03T18:25:56.000Z',
        },
        ETH: {
            code: 'ETH', symbol: 'Ξ', name: 'Ethereum',
            rate: '12.595,34', value: 12595.34,
            updated_at: '2026-11-03T18:25:56.000Z',
        },
    },
    updated_at: '2026-11-03T18:25:56.000Z',
};

const BUSCA_MOCK = {
    resultados: [
        {
            id: 'pepe', code: 'PEPE', name: 'Pepe',
            thumb: 'https://x/pepe.png',
            rate: '0,00002654', value: 0.00002654,
            updated_at: '2026-11-03T18:25:56.000Z',
        },
    ],
};

const esperar = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms));

describe('Frontend (jsdom) - Busca e interação', () => {
    let dom;
    let app;

    before(async () => {
        const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
        dom = new JSDOM(html, { url: 'http://localhost:3333/' });

        // Globais para o app.js (que usa document/window)
        global.window = dom.window;
        global.document = dom.window.document;
        global.Element = dom.window.Element;

        // jsdom não implementa scrollIntoView
        dom.window.Element.prototype.scrollIntoView = () => {};

        // Bootstrap Toast mock
        dom.window.bootstrap = {
            Toast: class {
                constructor() {}
                show() {}
            },
        };

        // Fetch mockado (API local)
        global.fetch = async (url) => {
            const destino = String(url);

            const responder = (corpo) => ({
                ok: true,
                status: 200,
                json: async () => corpo,
            });

            if (destino.includes('/api/precos')) return responder(PRECOS_MOCK);
            if (destino.includes('/api/variacao')) return responder({ variacao: 1.5 });
            if (destino.includes('/api/busca')) return responder(BUSCA_MOCK);

            return {
                ok: false,
                status: 404,
                json: async () => ({ erro: 'não encontrado' }),
            };
        };

        // Carrega o app e garante a inicialização (sem init duplicado)
        await import(`../public/js/app.js?teste=${Date.now()}`);
        app = dom.window.cryptoApp;

        if (!app.intervalId) {
            if (dom.window.document.readyState === 'loading') {
                await new Promise(resolve => {
                    dom.window.document.addEventListener('DOMContentLoaded', resolve, { once: true });
                });
            } else {
                dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
            }
        }

        await esperar(120);
    });

    after(() => {
        if (app?.intervalId) clearInterval(app.intervalId);
        delete global.window;
        delete global.document;
        delete global.Element;
        delete global.fetch;
        dom.window.close();
    });

    it('deve inicializar e renderizar os cards fixos com preços', () => {
        expect(app, 'cryptoApp deve existir').to.exist;
        expect(app.moedaSelecionada).to.equal('BTC');

        const cardBTC = document.querySelector('#grid-moedas [data-code="BTC"]');
        expect(cardBTC, 'card do BTC').to.exist;
        expect(cardBTC.querySelector('[data-value="BTC"]').textContent).to.equal('425.810,00');
        expect(document.getElementById('preco-brl').textContent).to.contain('R$ 425.810,00');
    });

    it('deve buscar e renderizar os resultados ao submeter o formulário', async () => {
        const input = document.getElementById('input-busca');
        input.value = 'pepe';

        document.getElementById('form-busca').dispatchEvent(
            new dom.window.Event('submit', { bubbles: true, cancelable: true })
        );

        await esperar();

        const cardPepe = document.querySelector('#resultados-busca [data-code="PEPE"]');
        expect(cardPepe, 'card de resultado do PEPE').to.exist;
        expect(cardPepe.textContent).to.contain('0,00002654');
        expect(document.getElementById('busca-status').textContent).to.contain('resultado');
        // Resultados substituem os cards padrão
        expect(document.getElementById('grid-moedas').classList.contains('d-none')).to.equal(true);
    });

    it('deve atualizar o preço em destaque ao clicar em um resultado', async () => {
        const cardPepe = document.querySelector('#resultados-busca [data-code="PEPE"]');
        cardPepe.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        await esperar(30);

        expect(app.moedaSelecionada).to.equal('PEPE');
        expect(document.getElementById('preco-brl').textContent).to.contain('R$ 0,00002654');
        expect(document.getElementById('nome-principal').textContent).to.equal('Pepe');
        expect(cardPepe.classList.contains('selecionada')).to.equal(true);
    });

    it('deve limpar a busca e voltar aos cards padrão', async () => {
        const input = document.getElementById('input-busca');
        input.value = '';
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

        await esperar(30);

        expect(document.getElementById('resultados-busca').innerHTML).to.equal('');
        expect(document.getElementById('grid-moedas').classList.contains('d-none')).to.equal(false);
    });

    it('deve voltar ao BTC ao clicar em um card fixo', async () => {
        const cardBTC = document.querySelector('#grid-moedas [data-code="BTC"]');
        cardBTC.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        await esperar(30);

        expect(app.moedaSelecionada).to.equal('BTC');
        expect(document.getElementById('preco-brl').textContent).to.contain('R$ 425.810,00');
    });

    it('deve limpar os resultados quando o termo tiver menos de 2 caracteres', async () => {
        const input = document.getElementById('input-busca');
        input.value = 'a';
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));

        await esperar(30);

        expect(document.getElementById('resultados-busca').innerHTML).to.equal('');
    });
});
