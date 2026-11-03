import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

describe('Integridade do frontend (contrato HTML <-> JS)', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const appJs = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
    const coreJs = fs.readFileSync(path.join(root, 'js/core.js'), 'utf8');

    it('index.html deve conter todos os IDs usados pelo app.js', () => {
        const ids = [
            'preco-brl',
            'simbolo-principal',
            'nome-principal',
            'atualizado-em',
            'variacao-24h',
            'grid-moedas',
            'btn-atualizar',
        ];

        ids.forEach(id => {
            expect(html, `faltando id="${id}" no index.html`).to.include(`id="${id}"`);
            expect(appJs, `app.js deveria referenciar "${id}"`).to.include(`'${id}'`);
        });
    });

    it('index.html deve carregar o app.js como módulo ES', () => {
        expect(html).to.include('<script type="module" src="js/app.js"></script>');
    });

    it('app.js deve importar a lógica pura de core.js', () => {
        expect(appJs).to.include("from './core.js'");
        expect(coreJs).to.include('export function montarPrecoPrincipal');
        expect(coreJs).to.include('export function montarCardsHTML');
    });

    it('a lista de coins do core deve ter códigos únicos', () => {
        const matches = [...coreJs.matchAll(/code:\s*'([A-Z]+)'/g)].map(m => m[1]);
        const unicos = new Set(matches);
        expect(matches.length).to.be.greaterThan(0);
        expect(unicos.size).to.equal(matches.length);
    });

    it('app.js não deve usar onclick inline (evita dependência de global)', () => {
        expect(html).to.not.include('onclick="app.atualizar()"');
        expect(html).to.include('id="btn-atualizar"');
    });
});
