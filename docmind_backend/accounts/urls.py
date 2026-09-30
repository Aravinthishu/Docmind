from django.urls import path
from dj_rest_auth.registration.views import RegisterView
from dj_rest_auth.views import LoginView, LogoutView, UserDetailsView
from rest_framework_simplejwt.views import TokenRefreshView

from .views import GoogleLoginView

urlpatterns = [
    path('google/', GoogleLoginView.as_view(), name='google_login'),
    path('register/', RegisterView.as_view(), name='rest_register'),
    path('login/', LoginView.as_view(), name='rest_login'),
    path('logout/', LogoutView.as_view(), name='rest_logout'),
    path('user/', UserDetailsView.as_view(), name='rest_user_details'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]