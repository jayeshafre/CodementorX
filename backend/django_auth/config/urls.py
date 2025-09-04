"""
Main URL Configuration for JWT Auth Project
Production-ready with API documentation and proper routing
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from rest_framework import permissions
from django.http import JsonResponse


def api_root(request):
    """
    API Root endpoint with available endpoints
    """
    return JsonResponse({
        'message': 'Welcome to JWT Authentication API',
        'version': '1.0.0',
        'endpoints': {
            'auth': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'refresh': '/api/auth/refresh/',
                'profile': '/api/auth/profile/',
                'change-password': '/api/auth/change-password/',
                'forgot-password': '/api/auth/forgot-password/',
                'reset-password': '/api/auth/reset-password/',
                'health': '/api/auth/health/',
            },
            'documentation': {
                'swagger': '/api/docs/',
                'redoc': '/api/redoc/',
                'schema': '/api/schema/',
            },
            'admin': '/admin/',
        },
        'status': 'active'
    })


urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API root
    path('api/', api_root, name='api_root'),
    
    # Authentication endpoints
    path('api/auth/', include('users.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    path("api/auth/", include("djoser.urls")),
    path("api/auth/", include("djoser.urls.jwt")),

    path('api/chat-models/', include('chatbot_models.urls')), 
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Custom admin titles
admin.site.site_header = "JWT Auth Administration"
admin.site.site_title = "JWT Auth Admin"
admin.site.index_title = "Welcome to JWT Auth Administration"