/**
 * Crypto Preço - Aplicação web
 * Consome a API local (Fastify -> CoinGecko) e exibe preços em Real (BRL).
 */

import {
    COINS,
    montarCardsHTML,
    montarPrecoPrincipal,
    formatarHoraISO,
} from './core.js';

const API_BASE = '';

const app = {
    elementos: {
        precoPrincipal: document.getElementById('preco-brl'),
        simboloPrincipal: document.getElementById('simbolo-principal'),
        nomePrincipal: document.getElementById('nome-principal'),
        atualizadoEm: document.getElementById('atualizado-em'),
        variacao24h: document.getElementById('variacao-24h'),
        gridMoedas: document.getElementById('grid-moedas'),
        btnAtualizar: document.getElementById('btn-atualizar'),
    },

    moedaSelecionada: 'BTC',
    precos: {},
    ultimaAtualizacao: null,
    intervalId: null,

    /** Inicializa a aplicação */
    init() {
        this.renderCardsMoedas();
        this.elementos.btnAtualizar.addEventListener('click', () => this.atualizar());
        // Acessibilidade: Enter/Espaço nos cards
        this.elementos.gridMoedas.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const card = event.target.closest('.moeda-card');
                if (card) {
                    event.preventDefault();
                    this.selecionarMoeda(card.dataset.code);
                }
            }
        });
        this.atualizar();
        // Atualiza automaticamente a cada 60 segundos
        this.intervalId = setInterval(() => this.atualizar(), 60000);
    },

    /** Renderiza os cards de cada criptomoeda (apenas uma vez) */
    renderCardsMoedas() {
        this.elementos.gridMoedas.innerHTML = montarCardsHTML(this.moedaSelecionada);

        // Delegação de eventos: um único listener para todos os cards.
        // Assim os cards não são recriados e os valores não são resetados ao clicar.
        this.elementos.gridMoedas.addEventListener('click', (event) => {
            const card = event.target.closest('.moeda-card');
            if (card) {
                this.selecionarMoeda(card.dataset.code);
            }
        });
    },

    /** Seleciona uma criptomoeda e atualiza o preço principal sem re-renderizar os cards */
    selecionarMoeda(codigo) {
        if (!COINS.some(c => c.code === codigo)) return;

        this.moedaSelecionada = codigo;

        // Atualiza destaque visual sem destruir os cards
        this.elementos.gridMoedas.querySelectorAll('.moeda-card').forEach(card => {
            const selecionado = card.dataset.code === codigo;
            card.classList.toggle('selecionada', selecionado);
            card.setAttribute('aria-pressed', String(selecionado));

            const label = card.querySelector('.coin-code');
            if (label) {
                label.classList.toggle('text-warning', selecionado);
                label.classList.toggle('text-muted', !selecionado);
            }
        });

        this.atualizarPrecoPrincipal();
    },

    /** Atualiza o preço principal com os dados já carregados em memória */
    atualizarPrecoPrincipal() {
        const dados = montarPrecoPrincipal(this.moedaSelecionada, this.precos);
        this.elementos.precoPrincipal.textContent = dados.preco;
        this.elementos.simboloPrincipal.textContent = dados.simbolo;
        this.elementos.nomePrincipal.textContent = dados.nome;

        if (this.ultimaAtualizacao) {
            this.elementos.atualizadoEm.textContent = formatarHoraISO(this.ultimaAtualizacao);
        }
    },

    /** Atualiza todos os preços */
    async atualizar() {
        this.setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/precos`, { cache: 'no-cache' });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const data = await response.json();
            this.precos = data.precos || {};
            this.ultimaAtualizacao = data.updated_at;

            // Atualiza valores dos cards
            COINS.forEach(coin => {
                const info = this.precos[coin.code];
                const elValor = this.elementos.gridMoedas.querySelector(`[data-value="${coin.code}"]`);
                if (!elValor) return;

                const card = elValor.closest('.moeda-card');
                const badge = card ? card.querySelector('.badge') : null;

                if (info) {
                    elValor.textContent = info.rate;
                    if (badge) {
                        badge.textContent = 'online';
                        badge.className = 'badge bg-success rounded-pill';
                    }
                } else {
                    elValor.textContent = '--,--';
                    if (badge) {
                        badge.textContent = 'indisponível';
                        badge.className = 'badge bg-secondary rounded-pill';
                    }
                }
            });

            // Atualiza destaque principal
            this.atualizarPrecoPrincipal();

            // Variação de 24h do Bitcoin
            this.atualizarVariacao();

            this.mostrarToast('Preços atualizados com sucesso!');
        } catch (error) {
            console.error(error);
            this.mostrarToastErro('Não foi possível atualizar os preços. Tente novamente.');
        } finally {
            this.setLoading(false);
        }
    },

    /** Busca variação de 24h do Bitcoin */
    async atualizarVariacao() {
        try {
            const response = await fetch('/api/variacao', { cache: 'no-cache' });
            if (response.ok) {
                const data = await response.json();
                const variacao = data.variacao;
                if (typeof variacao === 'number') {
                    const el = this.elementos.variacao24h;
                    el.textContent = variacao >= 0 ? `+${variacao.toFixed(2)}%` : `${variacao.toFixed(2)}%`;
                    el.className = variacao >= 0 ? 'fw-bold text-success' : 'fw-bold text-danger';
                }
            }
        } catch (e) {
            // Ignora erro na variação, não bloqueia o restante
        }
    },

    setLoading(ativo) {
        const btn = this.elementos.btnAtualizar;
        if (!btn) return;
        const icone = btn.querySelector('i');
        btn.disabled = ativo;
        if (!icone) return;

        if (ativo) {
            icone.classList.remove('bi-arrow-clockwise');
            icone.classList.add('bi-arrow-repeat', 'animate-spin');
        } else {
            icone.classList.remove('bi-arrow-repeat', 'animate-spin');
            icone.classList.add('bi-arrow-clockwise');
        }
    },

    mostrarToast(mensagem) {
        const toastEl = document.getElementById('toast-sucesso');
        toastEl.querySelector('.toast-body').innerHTML = `<i class="bi bi-check-circle me-2"></i>${mensagem}`;
        const toast = new window.bootstrap.Toast(toastEl, { delay: 3000 });
        toast.show();
    },

    mostrarToastErro(mensagem) {
        const toastEl = document.getElementById('toast-sucesso');
        toastEl.className = 'toast bg-danger text-white';
        toastEl.querySelector('.toast-body').innerHTML = `<i class="bi bi-exclamation-circle me-2"></i>${mensagem}`;
        const toast = new window.bootstrap.Toast(toastEl, { delay: 4000 });
        toast.show();
        setTimeout(() => {
            toastEl.className = 'toast bg-success text-white';
        }, 4000);
    },
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Exposto para debug no console do navegador
window.cryptoApp = app;
