export function calculateAge(birthDate, referenceDate = new Date()) {
  const birth = new Date(birthDate);
  let age = referenceDate.getFullYear() - birth.getFullYear();
  const hasBirthdayPassed =
    referenceDate.getMonth() > birth.getMonth() ||
    (referenceDate.getMonth() === birth.getMonth() &&
      referenceDate.getDate() >= birth.getDate());
  if (!hasBirthdayPassed) age -= 1;
  return age;
}

export function computeSubTotal(grandstand, sessions, seatCount) {
  const basePrice = Number(grandstand.basePrice);
  return sessions.reduce((sum, session) => {
    return sum + basePrice * Number(session.priceMultiplier) * seatCount;
  }, 0);
}

export function applyWeekendPassDiscount(amount, sessions) {
  const days = new Set(sessions.map((s) => s.day));
  const applied =
    days.has('FRIDAY') && days.has('SATURDAY') && days.has('SUNDAY');
  return { amount: applied ? amount * 0.8 : amount, applied };
}

export function applyLoyaltyDiscount(amount, loyaltyProgram) {
  const rate =
    loyaltyProgram === 'GOLD' ? 0.1 : loyaltyProgram === 'SILVER' ? 0.05 : 0;
  return { amount: amount * (1 - rate), rate };
}

export function applyYouthDiscount(
  amount,
  birthDate,
  referenceDate = new Date()
) {
  const applied = calculateAge(birthDate, referenceDate) < 16;
  return { amount: applied ? amount * 0.5 : amount, applied };
}

export function computeQuote(grandstand, sessions, seatCount, spectator) {
  const subTotal = computeSubTotal(grandstand, sessions, seatCount);

  const discountsApplied = [];

  const afterWeekend = applyWeekendPassDiscount(subTotal, sessions);
  if (afterWeekend.applied) discountsApplied.push('WEEKEND_PASS');
  const weekendPassDiscount = subTotal - afterWeekend.amount;

  const afterLoyalty = applyLoyaltyDiscount(
    afterWeekend.amount,
    spectator.loyaltyProgram
  );
  if (afterLoyalty.rate > 0)
    discountsApplied.push(`LOYALTY_${spectator.loyaltyProgram}`);
  const loyaltyDiscount = afterWeekend.amount - afterLoyalty.amount;

  const afterYouth = applyYouthDiscount(
    afterLoyalty.amount,
    spectator.birthDate
  );
  if (afterYouth.applied) discountsApplied.push('YOUTH');
  const youthDiscount = afterLoyalty.amount - afterYouth.amount;

  const total = Math.round(afterYouth.amount * 100) / 100;

  return {
    subTotal: Math.round(subTotal * 100) / 100,
    weekendPassDiscount: Math.round(weekendPassDiscount * 100) / 100,
    loyaltyDiscount: Math.round(loyaltyDiscount * 100) / 100,
    youthDiscount: Math.round(youthDiscount * 100) / 100,
    total,
    discountsApplied,
  };
}
