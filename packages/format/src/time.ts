export const formatDateAgo = (date: Date) => {
  const currentDate = new Date()
  const secondsAgo = Math.floor((currentDate.getTime() - date.getTime()) / 1000)

  if (secondsAgo < 60) return `${secondsAgo} Second${secondsAgo === 1 ? '' : 's'} Ago`
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)} Minute${secondsAgo / 120 >= 1 ? 's' : ''} Ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)} Hour${secondsAgo / 7200 >= 1 ? 's' : ''} Ago`
  if (secondsAgo < 2592000) return `${Math.floor(secondsAgo / 86400)} Day${secondsAgo / 172800 >= 1 ? 's' : ''} Ago`
  if (secondsAgo < 31536000)
    return `${Math.floor(secondsAgo / 2592000)} Month${secondsAgo / 5184000 >= 1 ? 's' : ''} Ago`

  return `${Math.floor(secondsAgo / 31536000)} Year${secondsAgo / 63072000 >= 1 ? 's' : ''} Ago`
}
