export const refreshAccounts = () => {
  document.dispatchEvent(new Event('refresh-accounts'))
} 