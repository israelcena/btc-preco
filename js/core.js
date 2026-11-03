/**
 * Crypto Preço - Lógica pura (testável em Node e no browser)
 */

export const COINS = [
    { code: 'BTC', symbol: '₿', name: 'Bitcoin', coingeckoId: 'bitcoin', flag: '🟠' },
    { code: 'ETH', symbol: 'Ξ', name: 'Ethereum', coingeckoId: 'ethereum', flag: '🔷' },
    { code: 'ADA', symbol: 'ₐ', name: 'Cardano', coingeckoId: 'cardano', flag: '🔵' },
    { code: 'SOL', symbol: '◎', name: 'Solana', coingeckoId: 'solana', flag: '🟣' },
    { code: 'DOGE', symbol: 'Ð', name: 'Dogecoin', coingeckoId: 'dogecoin', flag: '🐕' },
    { code: 'XRP', symbol: '✕', name: 'XRP', coingeckoId: 'ripple', flag: '⚡' },
    { code: 'DOT', symbol: '●', name: 'Polkadot', coingeckoId: 'polkadot', flag: '🔴' },
    { code: 'LTC', symbol: 'Ł', name: 'Litecoin', coingeckoId: 'litecoin', flag: '🥈' },
    { code: 'LINK', symbol: '⌘', name: 'Chainlink', coingeckoId: 'chainlink', flag: '🔗' },
    { code: 'MATIC', symbol: '▲', name: 'Polygon', coingeckoId: 'matic-network', flag: '🟣' },
];

/** Formata número no padrão brasileiro (1.234,56) */
export function formatarNumero(valor) {
    return valor.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/** Formata data ISO para dd/mm/aaaa hh:mm */
export function formatarHoraISO(iso) {
    const data = new Date(iso);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Encontra uma coin pelo código */
export function encontrarCoin(codigo) {
    return COINS.find(c => c.code === codigo) || null;
}

/**
 * Monta os dados do preço principal a partir dos preços em memória.
 * Nunca quebra: retorna placeholders quando não há dados.
 */
export function montarPrecoPrincipal(codigo, precos = {}) {
    const coin = encontrarCoin(codigo);
    const info = precos?.[codigo];

    const simbolo = coin ? coin.symbol : '';
    const nome = coin ? coin.name : codigo;

    if (!info) {
        return { preco: 'R$ --,--', simbolo, nome };
    }

    return { preco: `R$ ${info.rate}`, simbolo, nome };
}

/**
 * Gera o HTML dos cards de criptomoedas.
 * @param {string} selecionada - código da coin selecionada
 */
export function montarCardsHTML(selecionada) {
    return COINS.map(coin => {
        const isSelected = coin.code === selecionada;
        return `
            <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
                <div class="card h-100 moeda-card ${isSelected ? 'selecionada' : ''}" data-code="${coin.code}" role="button" tabindex="0" aria-pressed="${isSelected}">
                    <div class="card-body d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="coin-code ${isSelected ? 'text-warning' : 'text-muted'} small fw-bold">
                                ${coin.flag} ${coin.code}
                            </span>
                            <span class="badge bg-secondary rounded-pill">indisponível</span>
                        </div>
                        <div class="d-flex align-items-baseline mb-3 flex-grow-1">
                            <span class="moeda-simbolo me-1">${coin.symbol}</span>
                            <span class="moeda-valor" data-value="${coin.code}">--,--</span>
                        </div>
                        <span class="moeda-nome">${coin.name}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}
