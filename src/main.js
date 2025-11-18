#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';

const API_URL = 'https://api.coindesk.com/v1/bpi/currentprice';

/**
 * Fetch Bitcoin price from CoinDesk API
 * @param {string} currency - Currency code (USD, BRL, EUR, etc.)
 * @returns {Promise<Object>} Bitcoin price data
 */
async function fetchBitcoinPrice(currency = 'USD') {
    try {
        const response = await axios.get(`${API_URL}/${currency}.json`);
        return response.data;
    } catch (error) {
        if (error.response && error.response.status === 404) {
            throw new Error(`Currency ${currency} not supported`);
        }
        throw new Error('Failed to fetch Bitcoin price. Please check your internet connection.');
    }
}

/**
 * Format and display Bitcoin price
 * @param {Object} data - Bitcoin price data
 * @param {string} currency - Currency code
 */
function displayPrice(data, currency) {
    const bpi = data.bpi[currency];
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
        .version('1.0.0')
        .option('-c, --currency <type>', 'Currency code (USD, BRL, EUR, GBP)', 'USD')
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
