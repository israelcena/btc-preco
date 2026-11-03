import { expect } from 'chai';
import {
    COINS,
    formatarNumero,
    formatarHoraISO,
    encontrarCoin,
    montarPrecoPrincipal,
    montarCardsHTML,
} from '../js/core.js';

describe('core.js - Lógica do frontend', () => {
    describe('formatarNumero', () => {
        it('deve formatar valores grandes no padrão brasileiro', () => {
            expect(formatarNumero(425810)).to.equal('425.810,00');
        });

        it('deve formatar valores com centavos', () => {
            expect(formatarNumero(12595.34)).to.equal('12.595,34');
        });

        it('deve arredondar para 2 casas decimais', () => {
            expect(formatarNumero(0.412567)).to.equal('0,41');
        });
    });

    describe('formatarHoraISO', () => {
        it('deve formatar uma data ISO como dd/mm/aaaa hh:mm', () => {
            const resultado = formatarHoraISO('2026-11-03T12:00:00.000Z');
            expect(resultado).to.match(/03\/11\/2026/);
            expect(resultado).to.match(/\d{2}:\d{2}/);
        });
    });

    describe('encontrarCoin', () => {
        it('deve encontrar uma coin existente', () => {
            expect(encontrarCoin('BTC')).to.have.property('name', 'Bitcoin');
            expect(encontrarCoin('ETH')).to.have.property('name', 'Ethereum');
        });

        it('deve retornar null para coin inexistente', () => {
            expect(encontrarCoin('XYZ')).to.be.null;
        });
    });

    describe('montarPrecoPrincipal', () => {
        it('deve montar o preço principal com os dados em memória', () => {
            const dados = montarPrecoPrincipal('BTC', { BTC: { rate: '425.810,00' } });
            expect(dados).to.deep.equal({
                preco: 'R$ 425.810,00',
                simbolo: '₿',
                nome: 'Bitcoin',
            });
        });

        it('deve trocar para a coin selecionada (ETH)', () => {
            const dados = montarPrecoPrincipal('ETH', { ETH: { rate: '12.595,34' } });
            expect(dados.preco).to.equal('R$ 12.595,34');
            expect(dados.simbolo).to.equal('Ξ');
            expect(dados.nome).to.equal('Ethereum');
        });

        it('não deve quebrar quando não há dados (placeholder)', () => {
            const dados = montarPrecoPrincipal('SOL', {});
            expect(dados.preco).to.equal('R$ --,--');
            expect(dados.nome).to.equal('Solana');
        });

        it('não deve quebrar com código inválido', () => {
            const dados = montarPrecoPrincipal('XYZ', {});
            expect(dados.preco).to.equal('R$ --,--');
            expect(dados.nome).to.equal('XYZ');
        });
    });

    describe('montarCardsHTML', () => {
        const html = montarCardsHTML('BTC');

        it('deve renderizar um card para cada coin', () => {
            COINS.forEach(coin => {
                expect(html).to.include(`data-code="${coin.code}"`);
            });
        });

        it('deve marcar apenas a coin selecionada', () => {
            expect(html).to.include('data-code="BTC" role="button" tabindex="0" aria-pressed="true"');
            expect(html).to.include('data-code="ETH" role="button" tabindex="0" aria-pressed="false"');
        });

        it('deve conter os placeholders de valor', () => {
            expect(html).to.include('data-value="BTC"');
            expect(html).to.include('--,--');
        });
    });
});
