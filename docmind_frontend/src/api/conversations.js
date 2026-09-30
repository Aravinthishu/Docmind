import client from './client'

export const listConversations = (orgId) => client.get(`/organizations/${orgId}/conversations/`)

export const getConversation = (orgId, sessionId) =>
  client.get(`/organizations/${orgId}/conversations/${encodeURIComponent(sessionId)}/`)