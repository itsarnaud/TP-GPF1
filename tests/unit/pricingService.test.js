import { expect } from 'chai';
import {
  calculateAge,
  computeSubTotal,
  applyWeekendPassDiscount,
  applyLoyaltyDiscount,
  applyYouthDiscount,
  computeQuote,
} from '../../services/pricingService.js';

describe('calculateAge', () => {
  it('returns correct age on birthday', () => {
    const birth = new Date('2000-06-03');
    const ref = new Date('2026-06-03');
    expect(calculateAge(birth, ref)).to.equal(26);
  });

  it('returns age - 1 when birthday has not passed yet this year', () => {
    const birth = new Date('2000-12-31');
    const ref = new Date('2026-06-03');
    expect(calculateAge(birth, ref)).to.equal(25);
  });

  it('handles leap year birthday (Feb 29) correctly', () => {
    const birth = new Date('2000-02-29');
    const refBefore = new Date('2026-02-28');
    const refAfter = new Date('2026-03-01');
    expect(calculateAge(birth, refBefore)).to.equal(25);
    expect(calculateAge(birth, refAfter)).to.equal(26);
  });
});

describe('computeSubTotal', () => {
  it('computeSubTotal_singleSession', () => {
    const grandstand = { basePrice: 100 };
    const sessions = [{ priceMultiplier: 1.5 }];
    expect(computeSubTotal(grandstand, sessions, 2)).to.be.closeTo(300, 0.01);
  });

  it('computeSubTotal_multipleSessions', () => {
    const grandstand = { basePrice: 50 };
    const sessions = [{ priceMultiplier: 1 }, { priceMultiplier: 2 }];
    expect(computeSubTotal(grandstand, sessions, 3)).to.be.closeTo(450, 0.01);
  });
});

describe('applyWeekendPassDiscount', () => {
  it('applyWeekendPassDiscount_when3DaysSameGrandstand', () => {
    const sessions = [{ day: 'FRIDAY' }, { day: 'SATURDAY' }, { day: 'SUNDAY' }];
    const { amount, applied } = applyWeekendPassDiscount(1000, sessions);
    expect(applied).to.be.true;
    expect(amount).to.be.closeTo(800, 0.01);
  });

  it('applyWeekendPassDiscount_notApplied_when2DaysOnly', () => {
    const sessions = [{ day: 'FRIDAY' }, { day: 'SATURDAY' }];
    const { amount, applied } = applyWeekendPassDiscount(1000, sessions);
    expect(applied).to.be.false;
    expect(amount).to.be.closeTo(1000, 0.01);
  });

  it('applyWeekendPassDiscount_notApplied_singleDay', () => {
    const sessions = [{ day: 'SUNDAY' }];
    const { applied } = applyWeekendPassDiscount(500, sessions);
    expect(applied).to.be.false;
  });
});

describe('applyLoyaltyDiscount', () => {
  it('applyLoyaltyDiscount_silverApplies5Percent', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'SILVER');
    expect(rate).to.equal(0.05);
    expect(amount).to.be.closeTo(950, 0.01);
  });

  it('applyLoyaltyDiscount_goldApplies10Percent', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'GOLD');
    expect(rate).to.equal(0.1);
    expect(amount).to.be.closeTo(900, 0.01);
  });

  it('applyLoyaltyDiscount_noneAppliesZero', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'NONE');
    expect(rate).to.equal(0);
    expect(amount).to.be.closeTo(1000, 0.01);
  });
});

describe('applyYouthDiscount', () => {
  it('applyYouthDiscount_appliedWhenUnder16', () => {
    const birthDate = new Date('2015-01-01');
    const { amount, applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).to.be.true;
    expect(amount).to.be.closeTo(500, 0.01);
  });

  it('applyYouthDiscount_notAppliedWhenExactly16', () => {
    const birthDate = new Date('2010-06-03');
    const { applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).to.be.false;
  });

  it('applyYouthDiscount_notAppliedWhenOver16', () => {
    const birthDate = new Date('2000-01-01');
    const { applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).to.be.false;
  });
});

describe('computeQuote — combinatorials', () => {
  const grandstand = { basePrice: '100' };

  const sessions = [
    { day: 'FRIDAY', priceMultiplier: '1.00' },
    { day: 'SATURDAY', priceMultiplier: '1.00' },
    { day: 'SUNDAY', priceMultiplier: '1.00' },
  ];

  it('weekendPass_and_GOLD_loyalty_combinatorial', () => {
    const spectator = {
      birthDate: new Date('1990-01-01'),
      loyaltyProgram: 'GOLD',
    };
    const result = computeQuote(grandstand, sessions, 1, spectator);
    expect(result.subTotal).to.be.closeTo(300, 0.01);
    expect(result.weekendPassDiscount).to.be.closeTo(60, 0.01);
    expect(result.loyaltyDiscount).to.be.closeTo(24, 0.01);
    expect(result.youthDiscount).to.equal(0);
    expect(result.total).to.be.closeTo(216, 0.01);
    expect(result.discountsApplied).to.include('WEEKEND_PASS');
    expect(result.discountsApplied).to.include('LOYALTY_GOLD');
  });

  it('youth_and_SILVER_loyalty_combinatorial', () => {
    const singleSession = [{ day: 'FRIDAY', priceMultiplier: '1.00' }];
    const spectator = {
      birthDate: new Date('2015-01-01'),
      loyaltyProgram: 'SILVER',
    };
    const result = computeQuote(grandstand, singleSession, 2, spectator);
    expect(result.subTotal).to.be.closeTo(200, 0.01);
    expect(result.weekendPassDiscount).to.equal(0);
    expect(result.loyaltyDiscount).to.be.closeTo(10, 0.01);
    expect(result.youthDiscount).to.be.closeTo(95, 0.01);
    expect(result.total).to.be.closeTo(95, 0.01);
    expect(result.discountsApplied).to.include('LOYALTY_SILVER');
    expect(result.discountsApplied).to.include('YOUTH');
    expect(result.discountsApplied).to.not.include('WEEKEND_PASS');
  });
});

describe('calculateAge', () => {
  it('returns correct age on birthday', () => {
    const birth = new Date('2000-06-03');
    const ref = new Date('2026-06-03');
    expect(calculateAge(birth, ref)).toBe(26);
  });

  it('returns age - 1 when birthday has not passed yet this year', () => {
    const birth = new Date('2000-12-31');
    const ref = new Date('2026-06-03');
    expect(calculateAge(birth, ref)).toBe(25);
  });

  it('handles leap year birthday (Feb 29) correctly', () => {
    const birth = new Date('2000-02-29');
    const refBefore = new Date('2026-02-28');
    const refAfter = new Date('2026-03-01');
    expect(calculateAge(birth, refBefore)).toBe(25);
    expect(calculateAge(birth, refAfter)).toBe(26);
  });
});

describe('computeSubTotal', () => {
  it('computeSubTotal_singleSession', () => {
    const grandstand = { basePrice: 100 };
    const sessions = [{ priceMultiplier: 1.5 }];
    expect(computeSubTotal(grandstand, sessions, 2)).toBeCloseTo(300);
  });

  it('computeSubTotal_multipleSessions', () => {
    const grandstand = { basePrice: 50 };
    const sessions = [{ priceMultiplier: 1 }, { priceMultiplier: 2 }];
    expect(computeSubTotal(grandstand, sessions, 3)).toBeCloseTo(450);
  });
});

describe('applyWeekendPassDiscount', () => {
  it('applyWeekendPassDiscount_when3DaysSameGrandstand', () => {
    const sessions = [{ day: 'FRIDAY' }, { day: 'SATURDAY' }, { day: 'SUNDAY' }];
    const { amount, applied } = applyWeekendPassDiscount(1000, sessions);
    expect(applied).toBe(true);
    expect(amount).toBeCloseTo(800);
  });

  it('applyWeekendPassDiscount_notApplied_when2DaysOnly', () => {
    const sessions = [{ day: 'FRIDAY' }, { day: 'SATURDAY' }];
    const { amount, applied } = applyWeekendPassDiscount(1000, sessions);
    expect(applied).toBe(false);
    expect(amount).toBeCloseTo(1000);
  });

  it('applyWeekendPassDiscount_notApplied_singleDay', () => {
    const sessions = [{ day: 'SUNDAY' }];
    const { applied } = applyWeekendPassDiscount(500, sessions);
    expect(applied).toBe(false);
  });
});

describe('applyLoyaltyDiscount', () => {
  it('applyLoyaltyDiscount_silverApplies5Percent', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'SILVER');
    expect(rate).toBe(0.05);
    expect(amount).toBeCloseTo(950);
  });

  it('applyLoyaltyDiscount_goldApplies10Percent', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'GOLD');
    expect(rate).toBe(0.1);
    expect(amount).toBeCloseTo(900);
  });

  it('applyLoyaltyDiscount_noneAppliesZero', () => {
    const { amount, rate } = applyLoyaltyDiscount(1000, 'NONE');
    expect(rate).toBe(0);
    expect(amount).toBeCloseTo(1000);
  });
});

describe('applyYouthDiscount', () => {
  it('applyYouthDiscount_appliedWhenUnder16', () => {
    const birthDate = new Date('2015-01-01');
    const { amount, applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).toBe(true);
    expect(amount).toBeCloseTo(500);
  });

  it('applyYouthDiscount_notAppliedWhenExactly16', () => {
    const birthDate = new Date('2010-06-03');
    const { applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).toBe(false);
  });

  it('applyYouthDiscount_notAppliedWhenOver16', () => {
    const birthDate = new Date('2000-01-01');
    const { applied } = applyYouthDiscount(1000, birthDate, new Date('2026-06-03'));
    expect(applied).toBe(false);
  });
});

describe('computeQuote — combinatorials', () => {
  const grandstand = { basePrice: '100' };

  const sessions = [
    { day: 'FRIDAY', priceMultiplier: '1.00' },
    { day: 'SATURDAY', priceMultiplier: '1.00' },
    { day: 'SUNDAY', priceMultiplier: '1.00' },
  ];

  it('weekendPass_and_GOLD_loyalty_combinatorial', () => {
    const spectator = {
      birthDate: new Date('1990-01-01'),
      loyaltyProgram: 'GOLD',
    };
    const result = computeQuote(grandstand, sessions, 1, spectator);
    expect(result.subTotal).toBeCloseTo(300);
    expect(result.weekendPassDiscount).toBeCloseTo(60);
    expect(result.loyaltyDiscount).toBeCloseTo(24);
    expect(result.youthDiscount).toBe(0);
    expect(result.total).toBeCloseTo(216);
    expect(result.discountsApplied).toContain('WEEKEND_PASS');
    expect(result.discountsApplied).toContain('LOYALTY_GOLD');
  });

  it('youth_and_SILVER_loyalty_combinatorial', () => {
    const singleSession = [{ day: 'FRIDAY', priceMultiplier: '1.00' }];
    const spectator = {
      birthDate: new Date('2015-01-01'),
      loyaltyProgram: 'SILVER',
    };
    const result = computeQuote(grandstand, singleSession, 2, spectator);
    expect(result.subTotal).toBeCloseTo(200);
    expect(result.weekendPassDiscount).toBe(0);
    expect(result.loyaltyDiscount).toBeCloseTo(10);
    expect(result.youthDiscount).toBeCloseTo(95);
    expect(result.total).toBeCloseTo(95);
    expect(result.discountsApplied).toContain('LOYALTY_SILVER');
    expect(result.discountsApplied).toContain('YOUTH');
    expect(result.discountsApplied).not.toContain('WEEKEND_PASS');
  });
});
