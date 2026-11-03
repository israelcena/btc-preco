import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

describe('Integridade do frontend (contrato HTML <-> JS)', () => {
    const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
    const appJs = fs.readFileSync(path.join(root, 'public/js/app.js'), 'utf8');
    const coreJs = fs.readFileSync(path.join(root, 'public/js/core.js'), 'utf8');

    it('index.html deve conter todos os IDs usados pelo app.js', () => {
        const ids = [
            'preco-brl',
            'simbolo-principal',
            'nome-principal',
            'atualizado-em',
            'variacao-24h',
            'grid-moedas',
            'btn-atualizar',
            'form-busca',
            'input-busca',
            'btn-busca',
            'busca-status',
            'resultados-busca',
            'busca-vazia',
            'busca-vazia-icone',
            'busca-vazia-x',
            'busca-vazia-titulo',
            'busca-vazia-texto',
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

    it('CSS deve conter breakpoints para mobile, tablet e telas gigantes', () => {
        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        expect(css, 'breakpoint mobile').to.include('@media (max-width: 575.98px)');
        expect(css, 'breakpoint tablet').to.include('@media (min-width: 576px) and (max-width: 991.98px)');
        expect(css, 'breakpoint desktop grande').to.include('@media (min-width: 1400px)');
        expect(css, 'breakpoint ultrawide').to.include('@media (min-width: 1800px)');
        expect(css, 'suporte a reduced motion').to.include('@media (prefers-reduced-motion: reduce)');
    });

    it('CSS deve estilizar o campo de busca gigante (pill) sem sobreposição', () => {
        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        expect(css).to.include('.search-input');
        expect(css).to.include('.search-panel');
        expect(css).to.include('border-radius: 999px');
        expect(css).to.include('flex: 1 1 auto;');
    });

    it('CSS deve estilizar o estado vazio da busca com ícone', () => {
        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        expect(css).to.include('.busca-vazia');
        expect(css).to.include('.busca-vazia-icone');
        expect(css).to.include('.busca-vazia-x');
    });

    it('index.html deve conter o formulário de busca acessível', () => {
        expect(html).to.include('id="form-busca"');
        expect(html).to.include('role="search"');
        expect(html).to.include('id="input-busca"');
        expect(html).to.include('id="resultados-busca"');
        expect(html).to.include('id="busca-vazia"');
        expect(html).to.include('bi bi-search');
        expect(html).to.include('bi bi-x-lg');
    });

    it('CSS deve destacar o card selecionado com escala e espaço ao redor', () => {
        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        expect(css).to.include('.moeda-card.selecionada');
        expect(css).to.include('transform: scale(1.06)');
        // No mobile a escala reduz para não vazar da tela
        expect(css).to.include('transform: scale(1.02)');
    });

    it('grades de cards devem usar espaçamento maior (g-4) e respiro após a busca', () => {
        expect(html).to.include('class="row g-4 mt-4" id="grid-moedas"');
        expect(html).to.include('class="row g-4 mt-4" id="resultados-busca"');

        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        // Resultados acompanham o layout ultrawide de 5 colunas
        expect(css).to.include('#resultados-busca > [class*="col-"]');
    });

    it('CSS deve conter animações de entrada no estilo Animista', () => {
        const css = fs.readFileSync(path.join(root, 'public/css/style.css'), 'utf8');
        expect(css).to.include('@keyframes cards-entrada');
        expect(css).to.include('.entrada-animada > [class*="col-"]');
        expect(css).to.include('@keyframes destaque-pulso');
        expect(css).to.include('@keyframes preco-pop');
        expect(css).to.include('animation: none !important');
    });

    it('app.js não deve rolar a página ao selecionar uma moeda', () => {
        expect(appJs).to.not.include('scrollIntoView');
    });

    it('app.js não deve usar onclick inline (evita dependência de global)', () => {
        expect(html).to.not.include('onclick="app.atualizar()"');
        expect(html).to.include('id="btn-atualizar"');
    });
});
