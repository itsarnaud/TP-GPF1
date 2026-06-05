import { expect } from 'chai';
import { calculateRefund } from '../../services/refundService.js';

describe('Service de remboursement (refundService)', () => {
  it('doit rembourser à 100% si > 7 jours avant (J-15)', () => {
    const firstSessionDate = new Date('2026-07-15T12:00:00Z');
    const currentDate = new Date('2026-06-30T12:00:00Z');
    const totalPrice = 150.5;

    const result = calculateRefund(firstSessionDate, currentDate, totalPrice);
    expect(result.rate).to.equal(1);
    expect(result.amount).to.equal(150.5);
  });

  it('doit rembourser à 0% si < 7 jours avant (J-3)', () => {
    const firstSessionDate = new Date('2026-07-15T12:00:00Z');
    const currentDate = new Date('2026-07-12T12:00:00Z');
    const totalPrice = 150.5;

    const result = calculateRefund(firstSessionDate, currentDate, totalPrice);
    expect(result.rate).to.equal(0);
    expect(result.amount).to.equal(0);
  });

  it('doit rembourser à 100% si exactement 7 jours avant', () => {
    const firstSessionDate = new Date('2026-07-15T12:00:00Z');
    const currentDate = new Date('2026-07-08T12:00:00Z');
    const totalPrice = 100;

    const result = calculateRefund(firstSessionDate, currentDate, totalPrice);
    expect(result.rate).to.equal(1);
    expect(result.amount).to.equal(100);
  });
});
