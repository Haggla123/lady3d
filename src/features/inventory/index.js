export { default as KitchenDashboard } from '../../pages/kitchen/KitchenDashboard.jsx'

export function isMealAvailable(meal, branch, dailyStock = []) {
  if (!meal) return false
  if (meal.avail && meal.avail[branch] === false) return false
  const stock = dailyStock.find(s => s.branchId === branch && s.mealId === meal.id)
  if (stock) {
    if (stock.status !== 'available') return false
    const remaining = stock.quantityPrepared - stock.quantityReserved - stock.quantitySold
    if (remaining <= 0) return false
  }
  return true
}
