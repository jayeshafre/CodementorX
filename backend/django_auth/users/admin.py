"""
Django Admin Configuration for User Management
Professional admin interface with search, filters, and actions
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom User Admin with enhanced functionality
    """
    list_display = (
        'email',
        'username',
        'get_full_name',
        'role',
        'is_verified',
        'is_active',
        'is_staff',
        'created_at',
        'last_login',
        'colored_status',
    )
    
    list_filter = (
        'role',
        'is_verified',
        'is_active',
        'is_staff',
        'is_superuser',
        'created_at',
        'last_login',
    )
    
    search_fields = (
        'email',
        'username',
        'first_name',
        'last_name',
    )
    
    ordering = ('-created_at',)
    
    readonly_fields = (
        'created_at',
        'updated_at',
        'last_login',
        'last_login_ip',
        'age',
    )
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'email',
                'username',
                'password'
            )
        }),
        ('Personal Information', {
            'fields': (
                'first_name',
                'last_name',
                'phone',
                'date_of_birth',
                'age',
                'bio',
                'profile_picture',
            )
        }),
        ('Permissions & Role', {
            'fields': (
                'role',
                'is_active',
                'is_staff',
                'is_superuser',
                'is_verified',
                'groups',
                'user_permissions',
            ),
            'classes': ('collapse',),
        }),
        ('Login Information', {
            'fields': (
                'last_login',
                'last_login_ip',
                'created_at',
                'updated_at',
            ),
            'classes': ('collapse',),
        }),
    )
    
    add_fieldsets = (
        ('Create New User', {
            'classes': ('wide',),
            'fields': (
                'email',
                'username',
                'first_name',
                'last_name',
                'password1',
                'password2',
                'role',
                'is_active',
                'is_staff',
            ),
        }),
    )
    
    actions = [
        'make_verified',
        'make_unverified',
        'make_active',
        'make_inactive',
        'promote_to_admin',
        'demote_to_user',
    ]
    
    def colored_status(self, obj):
        """Display colored status based on user state"""
        if obj.is_active and obj.is_verified:
            color = 'green'
            status = 'Active & Verified'
        elif obj.is_active:
            color = 'orange'
            status = 'Active (Unverified)'
        else:
            color = 'red'
            status = 'Inactive'
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            status
        )
    colored_status.short_description = 'Status'
    
    def get_full_name(self, obj):
        """Display user's full name"""
        return obj.get_full_name()
    get_full_name.short_description = 'Full Name'
    
    # Admin Actions
    def make_verified(self, request, queryset):
        """Mark selected users as verified"""
        updated = queryset.update(is_verified=True)
        self.message_user(
            request,
            f'{updated} user(s) successfully marked as verified.'
        )
    make_verified.short_description = 'Mark selected users as verified'
    
    def make_unverified(self, request, queryset):
        """Mark selected users as unverified"""
        updated = queryset.update(is_verified=False)
        self.message_user(
            request,
            f'{updated} user(s) successfully marked as unverified.'
        )
    make_unverified.short_description = 'Mark selected users as unverified'
    
    def make_active(self, request, queryset):
        """Activate selected users"""
        updated = queryset.update(is_active=True)
        self.message_user(
            request,
            f'{updated} user(s) successfully activated.'
        )
    make_active.short_description = 'Activate selected users'
    
    def make_inactive(self, request, queryset):
        """Deactivate selected users"""
        updated = queryset.update(is_active=False)
        self.message_user(
            request,
            f'{updated} user(s) successfully deactivated.'
        )
    make_inactive.short_description = 'Deactivate selected users'
    
    def promote_to_admin(self, request, queryset):
        """Promote selected users to admin role"""
        updated = queryset.update(role=User.Role.ADMIN)
        self.message_user(
            request,
            f'{updated} user(s) successfully promoted to admin.'
        )
    promote_to_admin.short_description = 'Promote selected users to admin'
    
    def demote_to_user(self, request, queryset):
        """Demote selected users to regular user role"""
        updated = queryset.update(role=User.Role.USER)
        self.message_user(
            request,
            f'{updated} user(s) successfully demoted to user.'
        )
    demote_to_user.short_description = 'Demote selected users to regular user'