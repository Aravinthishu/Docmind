export function consumePostLoginRedirect() {
  const target = sessionStorage.getItem('post_login_redirect')
  sessionStorage.removeItem('post_login_redirect')
  return target || '/dashboard'
}