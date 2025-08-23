from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'conversations', views.ConversationViewSet)
router.register(r'preferences', views.UserPreferenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('conversations/<int:conversation_id>/messages/', 
         views.MessageListView.as_view(), 
         name='conversation-messages'),
]