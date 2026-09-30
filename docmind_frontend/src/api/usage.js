import client from './client'

export const getUsageStats = (orgId) => client.get(`/organizations/${orgId}/usage/`)