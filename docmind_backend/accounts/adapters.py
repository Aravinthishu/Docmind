from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from allauth.account.utils import user_email
from django.contrib.auth import get_user_model

User = get_user_model()


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def is_auto_signup_allowed(self, request, sociallogin):
        return True

    def pre_social_login(self, request, sociallogin):
        """
        If a user already exists with this email (e.g. registered via
        email/password), link this Google login to that same account
        instead of erroring or creating a duplicate. Safe because Google
        has already verified the email address.
        """
        if sociallogin.is_existing:
            return  # already linked, nothing to do

        email = user_email(sociallogin.user)
        if not email:
            return

        try:
            existing_user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return

        sociallogin.connect(request, existing_user)