"""
Custom User Model with additional fields for JWT Authentication
Extends AbstractUser for maximum flexibility
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom User model with additional fields
    """
    email = models.EmailField(
        unique=True,
        help_text="User's email address (used for login)"
    )
    first_name = models.CharField(
        max_length=30,
        help_text="User's first name"
    )
    last_name = models.CharField(
        max_length=30,
        help_text="User's last name"
    )
    phone = models.CharField(
        max_length=15,
        blank=True,
        null=True,
        help_text="User's phone number"
    )
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text="User's date of birth"
    )
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        help_text="User's profile picture"
    )
    bio = models.TextField(
        blank=True,
        max_length=500,
        help_text="Brief bio about the user"
    )
    
    # Authentication fields
    is_verified = models.BooleanField(
        default=False,
        help_text="Whether the user's email is verified"
    )
    last_login_ip = models.GenericIPAddressField(
        blank=True,
        null=True,
        help_text="IP address of last login"
    )
    
    # Role-based access
    class Role(models.TextChoices):
        USER = 'user', 'User'
        ADMIN = 'admin', 'Admin'
        MODERATOR = 'moderator', 'Moderator'
    
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.USER,
        help_text="User's role in the system"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as the unique identifier for authentication
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.email} ({self.get_full_name()})"
    
    def get_full_name(self):
        """Return the full name of the user"""
        return f"{self.first_name} {self.last_name}".strip()
    
    def get_short_name(self):
        """Return the short name for the user"""
        return self.first_name
    
    @property
    def is_admin(self):
        """Check if user has admin role"""
        return self.role == self.Role.ADMIN
    
    @property
    def is_moderator(self):
        """Check if user has moderator role"""
        return self.role == self.Role.MODERATOR
    
    @property
    def age(self):
        """Calculate user's age from date of birth"""
        if self.date_of_birth:
            today = timezone.now().date()
            return today.year - self.date_of_birth.year - (
                (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
            )
        return None
    
    def update_last_login_ip(self, ip_address):
        """Update the last login IP address"""
        self.last_login_ip = ip_address
        self.save(update_fields=['last_login_ip'])
    
    def save(self, *args, **kwargs):
        """Override save to ensure email is lowercase"""
        self.email = self.email.lower().strip()
        super().save(*args, **kwargs)