from django.db import models
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,  # ✅ Use swappable user model
        on_delete=models.CASCADE,
        related_name='preferences'
    )
    max_chats = models.IntegerField(
        default=10,
        validators=[MinValueValidator(1), MaxValueValidator(50)]
    )
    theme = models.CharField(
        max_length=20,
        default='light',
        choices=[('light', 'Light'), ('dark', 'Dark')]
    )
    language = models.CharField(max_length=10, default='en')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Preferences"


class ChatConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # ✅ Use swappable user model
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    title = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['user', 'is_active', '-updated_at']),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    @property
    def message_count(self):
        return self.messages.count()


class ChatMessage(models.Model):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    
    INTENT_CHOICES = [
        ('general', 'General'),
        ('coding', 'Coding'),
        ('translation', 'Translation'),
    ]

    conversation = models.ForeignKey(
        ChatConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    content = models.TextField()
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    intent = models.CharField(max_length=20, choices=INTENT_CHOICES, default='general')
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
        ]

    def __str__(self):
        return f"{self.conversation.title} - {self.role}: {self.content[:50]}"


# Signal to create UserPreference when a new user is created
@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_preference(sender, instance, created, **kwargs):
    if created:
        UserPreference.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_preference(sender, instance, **kwargs):
    if hasattr(instance, 'preferences'):
        instance.preferences.save()
