from django.contrib import admin
from .models import Organization, Membership, WidgetConfig, APIKey

admin.site.register(Organization)
admin.site.register(Membership)
admin.site.register(WidgetConfig)
admin.site.register(APIKey)