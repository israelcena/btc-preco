#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';

const CURRENCY_MAP = {
    USD: { symbol: '$', name: 'United States Dollar', code: 'usd' },
    BRL: { symbol: 'R$', name: 'Brazilian Real', code: 'brl' },
    EUR: { symbol: '€', name: 'Euro', code: 'eur' },
    GBP: { symbol: '£', name: 'British Pound', code: 'gbp' },
    JPY: { symbol: '¥', name: 'Japanese Yen', code: 'jpy' },
    ARS: { symbol: '$', name: 'Argentine Peso', code: 'ars' },
    CNY: { symbol: '¥', name: 'Chinese Yuan', code: 'cny' },
    INR: { symbol: '₹', name: 'Indian Rupee', code: 'inr' },
    KRW: { symbol: '₩', name: 'South Korean Won', code: 'krw' },
    MXN: { symbol: '$', name: 'Mexican Peso', code: 'mxn' },
};

/**
 * Fetch Bitcoin price from CoinGecko API
 * @param {string} currency - Currency code (USD, BRL, EUR, etc.)
 * @returns {Promise<Object>} Bitcoin price data
 */
async function fetchBitcoinPrice(currency = 'USD') {
    const currencyUpper = currency.toUpperCase();
    const currencyInfo = CURRENCY_MAP[currencyUpper];

    if (!currencyInfo) {
        throw new Error(`Currency ${currency} not supported. Supported: ${Object.keys(CURRENCY_MAP).join(', ')}`);
    }

    try {
        const response = await axios.get(COINGECKO_API, {
            params: {
                ids: 'bitcoin',
                vs_currencies: currencyInfo.code,
                include_last_updated_at: 'true',
            },
            timeout: 10000,
        });

        const price = response.data.bitcoin[currencyInfo.code];
        const lastUpdated = response.data.bitcoin.last_updated_at;

        if (price === undefined) {
            throw new Error(`Currency ${currency} not returned by API`);
        }

        return {
            bpi: {
                [currencyUpper]: {
                    code: currencyUpper,
                    symbol: currencyInfo.symbol,
                    rate: price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    description: currencyInfo.name,
                },
            },
            time: {
                updated: new Date(lastUpdated * 1000).toUTCString(),
            },
        };
    } catch (error) {
        if (error.response && error.response.status === 429) {
            throw new Error('Rate limited. Please wait a moment and try again.');
        }
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            throw new Error('Request timeout. Please check your internet connection.');
        }
        throw new Error(`Failed to fetch Bitcoin price: ${error.message}`);
    }
}

/**
 * Format and display Bitcoin price
 * @param {Object} data - Bitcoin price data
 * @param {string} currency - Currency code
 */
function displayPrice(data, currency) {
    const bpi = data.bpi[currency.toUpperCase()];
    const time = data.time.updated;

    console.log('\n' + chalk.bold.cyan('='.repeat(60)));
    console.log(chalk.bold.yellow('  💰 Bitcoin Price Information'));
    console.log(chalk.bold.cyan('='.repeat(60)));
    console.log('');
    console.log(chalk.white('  Currency: ') + chalk.green.bold(bpi.description));
    console.log(chalk.white('  Rate:     ') + chalk.green.bold(bpi.rate));
    console.log(chalk.white('  Symbol:   ') + chalk.green.bold(bpi.symbol));
    console.log(chalk.white('  Updated:  ') + chalk.gray(time));
    console.log('');
    console.log(chalk.bold.cyan('='.repeat(60)) + '\n');
}

/**
 * Main CLI function
 */
async function run() {
    const program = new Command();

    program
        .name('btc-preco')
        .description('Check Bitcoin price in real-time')
        .version('1.1.0')
        .option('-c, --currency <type>', 'Currency code (USD, BRL, EUR, GBP, JPY, ARS, CNY, INR, KRW, MXN)', 'USD')
        .action(async (options) => {
            try {
                const currency = options.currency.toUpperCase();
                console.log(chalk.blue(`\nFetching Bitcoin price in ${currency}...`));

                const data = await fetchBitcoinPrice(currency);
                displayPrice(data, currency);
            } catch (error) {
                console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
                process.exit(1);
            }
        });

    program.parse(process.argv);
}

// Export for testing
export const cliCore = {
    fetchBitcoinPrice,
    displayPrice,
    run
};

export default cliCore;

// Run CLI if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    run();
}
