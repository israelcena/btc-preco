import { expect } from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import cliCore from '../src/main.js';

const { fetchBitcoinPrice, displayPrice } = cliCore;

describe('BTC-Preco CLI Tests', () => {
    let mock;

    before(() => {
        mock = new MockAdapter(axios);
    });

    afterEach(() => {
        mock.reset();
    });

    after(() => {
        mock.restore();
    });

    describe('Smoke Tests', () => {
        it('Should exist', () => {
            expect(cliCore).to.exist;
        });

        it('Should export fetchBitcoinPrice function', () => {
            expect(fetchBitcoinPrice).to.be.a('function');
        });

        it('Should export displayPrice function', () => {
            expect(displayPrice).to.be.a('function');
        });

        it('Should export run function', () => {
            expect(cliCore.run).to.be.a('function');
        });
    });

    describe('fetchBitcoinPrice', () => {
        it('Should fetch Bitcoin price in USD', async () => {
            const mockData = {
                bitcoin: {
                    usd: 50000,
                    last_updated_at: 1731888000,
                },
            };

            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .reply(200, mockData);

            const result = await fetchBitcoinPrice('USD');
            expect(result).to.have.property('bpi');
            expect(result.bpi.USD).to.have.property('code', 'USD');
            expect(result.bpi.USD).to.have.property('symbol', '$');
            expect(result.bpi.USD).to.have.property('description', 'United States Dollar');
            expect(result).to.have.property('time');
        });

        it('Should fetch Bitcoin price in BRL', async () => {
            const mockData = {
                bitcoin: {
                    brl: 250000,
                    last_updated_at: 1731888000,
                },
            };

            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .reply(200, mockData);

            const result = await fetchBitcoinPrice('BRL');
            expect(result).to.have.property('bpi');
            expect(result.bpi.BRL).to.have.property('code', 'BRL');
            expect(result.bpi.BRL).to.have.property('symbol', 'R$');
            expect(result.bpi.BRL).to.have.property('description', 'Brazilian Real');
            expect(result).to.have.property('time');
        });

        it('Should throw error for unsupported currency', async () => {
            try {
                await fetchBitcoinPrice('XYZ');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Currency XYZ not supported');
            }
        });

        it('Should throw error when API is unreachable', async () => {
            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .networkError();

            try {
                await fetchBitcoinPrice('USD');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Failed to fetch Bitcoin price');
            }
        });

        it('Should throw error when rate limited', async () => {
            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .reply(429);

            try {
                await fetchBitcoinPrice('USD');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Rate limited');
            }
        });

        it('Should throw error when price not returned by API', async () => {
            const mockData = {
                bitcoin: {
                    last_updated_at: 1731888000,
                },
            };

            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .reply(200, mockData);

            try {
                await fetchBitcoinPrice('USD');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Currency USD not returned by API');
            }
        });

        it('Should throw error on timeout', async () => {
            const timeoutError = new Error('timeout');
            timeoutError.code = 'ETIMEDOUT';
            mock.onGet('https://api.coingecko.com/api/v3/simple/price')
                .reply(() => Promise.reject(timeoutError));

            try {
                await fetchBitcoinPrice('USD');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Request timeout');
            }
        });
    });

    describe('displayPrice', () => {
        let consoleLogStub;

        beforeEach(() => {
            consoleLogStub = sinon.stub(console, 'log');
        });

        afterEach(() => {
            consoleLogStub.restore();
        });

        it('Should display formatted Bitcoin price', () => {
            const mockData = {
                time: { updated: 'Nov 18, 2025 00:00:00 UTC' },
                bpi: {
                    USD: {
                        code: 'USD',
                        symbol: '$',
                        rate: '50,000.00',
                        description: 'United States Dollar'
                    }
                }
            };

            displayPrice(mockData, 'USD');

            expect(consoleLogStub.called).to.be.true;
            const output = consoleLogStub.getCalls().map(call => call.args[0]).join('');
            expect(output).to.include('Bitcoin Price Information');
            expect(output).to.include('United States Dollar');
            expect(output).to.include('50,000.00');
        });
    });
});
