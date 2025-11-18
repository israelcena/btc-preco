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

            mock.onGet('https://api.coindesk.com/v1/bpi/currentprice/USD.json')
                .reply(200, mockData);

            const result = await fetchBitcoinPrice('USD');
            expect(result).to.deep.equal(mockData);
        });

        it('Should fetch Bitcoin price in BRL', async () => {
            const mockData = {
                time: { updated: 'Nov 18, 2025 00:00:00 UTC' },
                bpi: {
                    BRL: {
                        code: 'BRL',
                        symbol: 'R$',
                        rate: '250,000.00',
                        description: 'Brazilian Real'
                    }
                }
            };

            mock.onGet('https://api.coindesk.com/v1/bpi/currentprice/BRL.json')
                .reply(200, mockData);

            const result = await fetchBitcoinPrice('BRL');
            expect(result).to.deep.equal(mockData);
        });

        it('Should throw error for unsupported currency', async () => {
            mock.onGet('https://api.coindesk.com/v1/bpi/currentprice/XYZ.json')
                .reply(404);

            try {
                await fetchBitcoinPrice('XYZ');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Currency XYZ not supported');
            }
        });

        it('Should throw error when API is unreachable', async () => {
            mock.onGet('https://api.coindesk.com/v1/bpi/currentprice/USD.json')
                .networkError();

            try {
                await fetchBitcoinPrice('USD');
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error.message).to.include('Failed to fetch Bitcoin price');
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
