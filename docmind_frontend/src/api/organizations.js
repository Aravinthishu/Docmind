import client from './client'

export const listOrganizations = () => client.get('/organizations/')
export const createOrganization = (name) => client.post('/organizations/', { name })
export const getOrganization = (id) => client.get(`/organizations/${id}/`)
export const updateOrganization = (id, data) => client.patch(`/organizations/${id}/`, data)
export const deleteOrganization = (id) => client.delete(`/organizations/${id}/`)

export const getWidgetConfig = (id) => client.get(`/organizations/${id}/widget-config/`)
export const updateWidgetConfig = (id, data) => client.patch(`/organizations/${id}/widget-config/`, data)

export const getApiKeys = (id) => client.get(`/organizations/${id}/api-keys/`)
export const createApiKey = (id) => client.post(`/organizations/${id}/api-keys/`)
export const updateApiKey = (orgId, keyId, data) =>
  client.patch(`/organizations/${orgId}/api-keys/${keyId}/`, data)