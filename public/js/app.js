/**
 * Crypto Preço - Aplicação web
 * Consome a API local (Fastify -> CoinGecko) e exibe preços em Real (BRL).
 */

import {
    COINS,
    montarCardsHTML,
    montarResultadosHTML,
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
        formBusca: document.getElementById('form-busca'),
        inputBusca: document.getElementById('input-busca'),
        btnBusca: document.getElementById('btn-busca'),
        buscaStatus: document.getElementById('busca-status'),
        resultadosBusca: document.getElementById('resultados-busca'),
    },

    moedaSelecionada: 'BTC',
    precos: {},          // preços das coins fixas + extras
    coinsExtras: [],     // metadados das coins encontradas na busca
    resultados: [],      // últimos resultados exibidos
    ultimaAtualizacao: null,
    intervalId: null,
    debounceTimer: null,

    /** Inicializa a aplicação */
    init() {
        this.renderCardsMoedas();

        this.elementos.btnAtualizar.addEventListener('click', () => this.atualizar());

        // Busca: submit (Enter/botão) e digitação com debounce
        this.elementos.formBusca.addEventListener('submit', (event) => {
            event.preventDefault();
            this.buscar(this.elementos.inputBusca.value);
        });

        this.elementos.inputBusca.addEventListener('input', () => {
            clearTimeout(this.debounceTimer);
            const termo = this.elementos.inputBusca.value.trim();

            if (termo.length < 2) {
                this.limparResultados();
                return;
            }

            this.debounceTimer = setTimeout(() => this.buscar(termo), 500);
        });

        // Clique e teclado nos cards de resultado
        this.elementos.resultadosBusca.addEventListener('click', (event) => {
            const card = event.target.closest('.moeda-card');
            if (card) this.selecionarMoeda(card.dataset.code);
        });

        this.elementos.resultadosBusca.addEventListener('keydown', (event) => {
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

    /** Lista de todas as coins conhecidas (fixas + resultados de busca) */
    todasCoins() {
        const mapa = new Map();
        [...COINS, ...this.coinsExtras].forEach(coin => {
            if (!mapa.has(coin.code)) mapa.set(coin.code, coin);
        });
        return [...mapa.values()];
    },

    /** Renderiza os cards de cada criptomoeda (apenas uma vez) */
    renderCardsMoedas() {
        this.elementos.gridMoedas.innerHTML = montarCardsHTML(this.moedaSelecionada);

        // Delegação de eventos: um único listener para todos os cards.
        this.elementos.gridMoedas.addEventListener('click', (event) => {
            const card = event.target.closest('.moeda-card');
            if (card) {
                this.selecionarMoeda(card.dataset.code);
            }
        });

        this.elementos.gridMoedas.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                const card = event.target.closest('.moeda-card');
                if (card) {
                    event.preventDefault();
                    this.selecionarMoeda(card.dataset.code);
                }
            }
        });
    },

    /** Busca criptomoedas pelo termo informado */
    async buscar(termoBruto) {
        const termo = String(termoBruto ?? '').trim();

        if (termo.length < 2) {
            this.limparResultados();
            this.definirStatus('Digite ao menos 2 caracteres para buscar.', 'text-muted-strong');
            return;
        }

        this.setLoadingBusca(true);
        this.definirStatus('Buscando criptomoedas...', 'text-muted-strong');

        try {
            const response = await fetch(`${API_BASE}/api/busca?q=${encodeURIComponent(termo)}`, { cache: 'no-cache' });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.erro || `Erro na busca: ${response.status}`);
            }

            this.resultados = data.resultados || [];

            // Registra metadados e preços das coins encontradas
            this.coinsExtras = this.resultados.map(coin => ({
                code: coin.code,
                symbol: 'R$',
                name: coin.name,
                coingeckoId: coin.id,
            }));

            this.resultados.forEach(coin => {
                if (coin.rate) {
                    this.precos[coin.code] = {
                        code: coin.code,
                        symbol: 'R$',
                        name: coin.name,
                        rate: coin.rate,
                        value: coin.value,
                        updated_at: coin.updated_at,
                    };
                }
            });

            this.renderResultados();

            if (this.resultados.length === 0) {
                this.definirStatus(`Nenhuma criptomoeda encontrada para "${termo}".`, 'text-danger');
            } else {
                const total = this.resultados.length;
                this.definirStatus(
                    `${total} ${total === 1 ? 'resultado' : 'resultados'} para "${termo}" — clique para ver no destaque`,
                    'text-muted-strong'
                );
            }
        } catch (error) {
            console.error(error);
            this.resultados = [];
            this.renderResultados();
            this.definirStatus('Não foi possível buscar agora. Tente novamente.', 'text-danger');
        } finally {
            this.setLoadingBusca(false);
        }
    },

    /** Renderiza os resultados da busca */
    renderResultados() {
        this.elementos.resultadosBusca.innerHTML = montarResultadosHTML(this.resultados, this.moedaSelecionada);
    },

    /** Limpa busca e resultados */
    limparResultados() {
        this.resultados = [];
        this.elementos.resultadosBusca.innerHTML = '';
        this.definirStatus('', '');
    },

    /** Atualiza a mensagem de status da busca */
    definirStatus(mensagem, classe) {
        const el = this.elementos.buscaStatus;
        el.textContent = mensagem;
        el.className = `search-status ${classe || ''}`.trim();
    },

    /** Seleciona uma criptomoeda e atualiza o preço principal sem re-renderizar os cards */
    selecionarMoeda(codigo) {
        if (!this.todasCoins().some(c => c.code === codigo)) return;

        this.moedaSelecionada = codigo;

        // Atualiza destaque visual em todos os cards (fixos e resultados)
        document.querySelectorAll('.moeda-card').forEach(card => {
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

        // Rola suavemente até o destaque
        this.elementos.precoPrincipal.closest('.hero-card')
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },

    /** Atualiza o preço principal com os dados já carregados em memória */
    atualizarPrecoPrincipal() {
        const dados = montarPrecoPrincipal(this.moedaSelecionada, this.precos, this.todasCoins());
        this.elementos.precoPrincipal.textContent = dados.preco;
        this.elementos.simboloPrincipal.textContent = dados.simbolo;
        this.elementos.nomePrincipal.textContent = dados.nome;

        if (this.ultimaAtualizacao) {
            this.elementos.atualizadoEm.textContent = formatarHoraISO(this.ultimaAtualizacao);
        }
    },

    /** Atualiza todos os preços fixos */
    async atualizar() {
        this.setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/precos`, { cache: 'no-cache' });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.status}`);
            }

            const data = await response.json();
            // Atualiza os preços fixos sem perder os extras vindos da busca
            this.precos = { ...this.precos, ...(data.precos || {}) };
            this.ultimaAtualizacao = data.updated_at;

            // Atualiza valores dos cards fixos
            COINS.forEach(coin => {
                const info = data.precos?.[coin.code];
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

    setLoadingBusca(ativo) {
        const btn = this.elementos.btnBusca;
        const input = this.elementos.inputBusca;
        if (!btn) return;
        btn.disabled = ativo;
        if (input) input.disabled = ativo;
        btn.innerHTML = ativo
            ? '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Buscando'
            : '<i class="bi bi-search me-1"></i>Buscar';
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
