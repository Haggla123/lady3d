export const money = n => 'GH₵' + Number(n || 0).toFixed(2).replace(/\.00$/, '')
