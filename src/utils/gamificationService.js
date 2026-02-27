const BADGES = [
  { id: 'early_bird', title: 'Early Bird', icon: '☀️', description: 'Added 5 transactions before 9 AM', color: '#FFD700' },
  { id: 'frugal_master', title: 'Frugal Master', icon: '📉', description: 'Stayed 20% under budget', color: '#4CAF50' },
  { id: 'gold_digger', title: 'Gold Digger', icon: '📀', description: 'Tracked over 10g of Gold', color: '#FFB300' },
  { id: 'saver_streak', title: 'Saving Streak', icon: '🔥', description: '3 months of consistent saving', color: '#FF5722' },
  { id: 'wealth_builder', title: 'Wealth Builder', icon: '🏰', description: 'Net worth crossed ₹1 Lakh', color: '#9C27B0' },
  { id: 'debt_free', title: 'Debt Free', icon: '🕊️', description: 'Cleared all pending debts', color: '#03A9F4' },
];

export const getAchievements = (userData, summaryData) => {
  const earned = [];
  
  // Logic for earning badges
  if (summaryData?.balance >= 100000) earned.push('wealth_builder');
  if (summaryData?.expenseCount + summaryData?.incomeCount >= 50) earned.push('early_bird');
  
  // Frugal Master: Stayed 20% under total budget (if budgets exist)
  const totalBudget = summaryData?.categoryBreakdown?.reduce((acc, c) => acc + (c.budget || 0), 0) || 0;
  const totalSpent = summaryData?.totalExpense || 0;
  if (totalBudget > 0 && totalSpent < totalBudget * 0.8) earned.push('frugal_master');

  // Gold Digger: Check if user has metal assets (this would come from a separate wealth fetch usually)
  // For now, if they have any entries in the wealth breakdown that look like gold
  const hasGold = summaryData?.accounts?.some(a => a.name.toLowerCase().includes('gold') || a.bankName?.toLowerCase().includes('gold'));
  if (hasGold) earned.push('gold_digger');
  
  // Saving Streak: Active for more than 90 days
  if (summaryData?.firstTransactionDate) {
    const daysActive = Math.ceil((new Date() - new Date(summaryData.firstTransactionDate)) / (1000 * 60 * 60 * 24));
    if (daysActive >= 90) earned.push('saver_streak');
  }

  // Debt Free: (Simplified) If no categories contain 'debt' or 'emi' with spending this month
  const hasDebtSpending = summaryData?.categoryBreakdown?.some(c => 
    (c.category?.name?.toLowerCase().includes('debt') || c.category?.name?.toLowerCase().includes('emi')) && c.total > 0
  );
  if (!hasDebtSpending && summaryData?.totalExpense > 0) earned.push('debt_free');
  
  return BADGES.map(badge => ({
    ...badge,
    isEarned: earned.includes(badge.id)
  }));
};

export default BADGES;
