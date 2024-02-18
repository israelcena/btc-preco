import { expect } from 'chai';
import cliCore from '../src/main.js';

describe('Smoke Tests', () => {
    it('Should exist', () => {
        expect(cliCore).to.exist;
    })
});
