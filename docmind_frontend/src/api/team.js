import client from './client'

export const listMembers = (orgId) => client.get(`/organizations/${orgId}/members/`)
export const updateMemberRole = (orgId, memberId, role) =>
  client.patch(`/organizations/${orgId}/members/${memberId}/`, { role })
export const removeMember = (orgId, memberId) =>
  client.delete(`/organizations/${orgId}/members/${memberId}/`)

export const listInvitations = (orgId) => client.get(`/organizations/${orgId}/invitations/`)
export const createInvitation = (orgId, email, role) =>
  client.post(`/organizations/${orgId}/invitations/`, { email, role })
export const revokeInvitation = (orgId, inviteId) =>
  client.delete(`/organizations/${orgId}/invitations/${inviteId}/`)

export const getInvitationPreview = (token) => client.get(`/invitations/${token}/`)
export const acceptInvitation = (token) => client.post(`/invitations/${token}/accept/`)