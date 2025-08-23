from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ChatConversation, ChatMessage, UserPreference

class UserPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserPreference
        fields = ['id', 'max_chats', 'theme', 'language', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['id', 'content', 'role', 'intent', 'metadata', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_role(self, value):
        if value not in ['user', 'assistant']:
            raise serializers.ValidationError("Role must be 'user' or 'assistant'")
        return value

class ConversationSerializer(serializers.ModelSerializer):
    message_count = serializers.ReadOnlyField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatConversation
        fields = ['id', 'title', 'is_active', 'created_at', 'updated_at', 
                 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at', 'message_count']

    def get_last_message(self, obj):
        last_message = obj.messages.order_by('-created_at').first()
        if last_message:
            return {
                'content': last_message.content[:100] + '...' if len(last_message.content) > 100 else last_message.content,
                'role': last_message.role,
                'created_at': last_message.created_at
            }
        return None

class ConversationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatConversation
        fields = ['title']

    def validate_title(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters long")
        return value.strip()