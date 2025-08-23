from rest_framework import viewsets, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import ChatConversation, ChatMessage, UserPreference
from .serializers import (
    ConversationSerializer, 
    MessageSerializer, 
    UserPreferenceSerializer,
    ConversationCreateSerializer
)


class UserPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = UserPreferenceSerializer
    permission_classes = [IsAuthenticated]
    queryset = UserPreference.objects.all()   # ✅ Added queryset (needed by DRF)

    def get_queryset(self):
        return UserPreference.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ConversationViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ChatConversation.objects.all()   # ✅ Added queryset (needed by DRF)

    def get_serializer_class(self):
        if self.action == 'create':
            return ConversationCreateSerializer
        return ConversationSerializer

    def get_queryset(self):
        return ChatConversation.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-updated_at')

    def perform_create(self, serializer):
        # Check chat limit
        user_prefs = getattr(self.request.user, 'preferences', None)
        max_chats = user_prefs.max_chats if user_prefs else 10

        current_count = self.get_queryset().count()

        if current_count >= max_chats:
            # Delete oldest conversation
            oldest = self.get_queryset().last()
            if oldest:
                oldest.delete()

        serializer.save(user=self.request.user)

    @action(detail=True, methods=['delete'])
    def soft_delete(self, request, pk=None):
        """Soft delete conversation"""
        conversation = self.get_object()
        conversation.is_active = False
        conversation.save()
        return Response({'message': 'Conversation deleted successfully'})

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get most recent conversations with message preview"""
        conversations = self.get_queryset()[:5]
        serializer = self.get_serializer(conversations, many=True)
        return Response(serializer.data)


class MessageListView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        # Verify user owns this conversation
        conversation = get_object_or_404(
            ChatConversation, 
            id=conversation_id, 
            user=self.request.user
        )
        return ChatMessage.objects.filter(
            conversation=conversation
        ).order_by('created_at')

    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = get_object_or_404(
            ChatConversation, 
            id=conversation_id, 
            user=self.request.user
        )
        serializer.save(conversation=conversation)
