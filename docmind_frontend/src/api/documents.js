import client from './client'

export const listDocuments = (orgId) => client.get(`/organizations/${orgId}/documents/`)

export const uploadDocument = (orgId, file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post(`/organizations/${orgId}/documents/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}

export const deleteDocument = (orgId, docId) =>
  client.delete(`/organizations/${orgId}/documents/${docId}/`)