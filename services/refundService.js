export function calculateRefund(firstSessionDate, currentDate, totalPrice) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffTime = firstSessionDate.getTime() - currentDate.getTime();
  const diffDays = diffTime / MS_PER_DAY;

  if (diffDays >= 7) {
    return {
      rate: 1,
      amount: Number(totalPrice),
    };
  }

  return {
    rate: 0,
    amount: 0,
  };
}
