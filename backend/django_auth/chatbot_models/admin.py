from django.contrib import admin
from .models import UserPreference, ChatConversation, ChatMessage

@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'max_chats', 'theme', 'language', 'created_at']
    list_filter = ['theme', 'language', 'created_at']
    search_fields = ['user__username', 'user__email']

class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    readonly_fields = ['created_at']
    fields = ['role', 'content', 'intent', 'created_at']

@admin.register(ChatConversation)
class ChatConversationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'message_count', 'is_active', 'updated_at']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['title', 'user__username']
    inlines = [ChatMessageInline]
    readonly_fields = ['created_at', 'updated_at']

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'intent', 'content_preview', 'created_at']
    list_filter = ['role', 'intent', 'created_at']
    search_fields = ['conversation__title', 'content']
    readonly_fields = ['created_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'