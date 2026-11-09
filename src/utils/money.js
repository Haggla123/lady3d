let currentCurrency = 'GH₵'

export const setCurrencySymbol = sym => {
  if (sym && typeof sym === 'string') currentCurrency = sym.trim()
}

export const getCurrencySymbol = () => currentCurrency

export const money = (n, symbol = null) => {
  const sym = symbol != null ? symbol : currentCurrency
  return sym + Number(n || 0).toFixed(2).replace(/\.00$/, '')
}
