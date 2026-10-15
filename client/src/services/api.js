import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000,
})

export function getErrorMessage(err) {
  const serverMessage = err?.response?.data?.error?.message
  if (serverMessage) return serverMessage
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
  if (err?.message === 'Network Error') return 'Cannot reach the server. Make sure the backend is running.'
  if (err?.response?.status === 404) return 'Not found.'
  return err?.message || 'Something went wrong. Please try again.'
}

export const scanWebsite = (url) => api.post('/scan', { url }).then((r) => r.data.data)

export const getReport = (id) => api.get(`/report/${id}`).then((r) => r.data.data)

export const getHistory = (params) => api.get('/history', { params }).then((r) => r.data.data)

export const deleteHistory = (id) => api.delete(`/history/${id}`).then((r) => r.data)

export const getHealth = () => api.get('/health').then((r) => r.data.data)

export async function downloadReportPdf(id) {
  const response = await api.get(`/download/${id}`, { responseType: 'blob' })
  const disposition = response.headers['content-disposition'] || ''
  const match = disposition.match(/filename="?([^"]+)"?/)
  const filename = match ? match[1] : `WVS-Report-${id}.pdf`

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
