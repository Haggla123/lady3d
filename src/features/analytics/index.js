export const summarizeSales = (orders = []) => {
  const completed = orders.filter(o => o.orderStatus === 'delivered' || o.orderStatus === 'collected' || o.status === 4)
  const revenue = completed.reduce((s, o) => s + (o.total || 0), 0)
  return {
    totalRevenue: revenue,
    completedOrders: completed.length,
    activeOrders: orders.length - completed.length
  }
}
