/**
 * Profile Page Component
 * View and edit user profile information - Fully Responsive
 */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Key,
  Menu,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth(); // from your AuthContext
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // success / error message
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        location: user.location || "",
        joined: user.joined || "N/A",
      });
    }
  }, [user]);

  // Handle form changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAvatar(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Save profile
  const handleSave = async () => {
    setLoading(true);
    setStatus(null);
    try {
      // Replace this with your backend API call
      await new Promise((res) => setTimeout(res, 1500));

      setStatus({ type: "success", message: "Profile updated successfully!" });
      setIsEditing(false);
    } catch (err) {
      setStatus({ type: "error", message: "Failed to update profile." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first responsive container */}
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <User className="w-5 h-5 sm:w-6 sm:h-6" /> My Profile
            </h1>
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-50 text-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-300 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-400 text-sm"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 text-sm"
              >
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            )}
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`p-3 sm:p-4 mb-4 rounded-xl flex items-start gap-3 ${
                status.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm font-medium">{status.message}</p>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white shadow-lg rounded-2xl overflow-hidden">
            {/* Avatar Section */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={
                      avatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt="Avatar"
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/20"
                  />
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 bg-blue-600 p-2 rounded-full cursor-pointer text-white hover:bg-blue-700 transition-colors">
                      <Camera className="w-3 h-3 sm:w-4 sm:h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-semibold">{formData.name}</h2>
                <p className="text-white/80 text-sm">Member</p>
              </div>
            </div>

            {/* Info Fields */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Name */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 min-w-20">Name</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                ) : (
                  <p className="flex-1 text-sm text-gray-900 break-words">{formData.name || "Not set"}</p>
                )}
              </div>

              {/* Email */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 min-w-20">Email</span>
                </div>
                <p className="flex-1 text-sm text-gray-900 break-all">{formData.email}</p>
              </div>

              {/* Phone */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 min-w-20">Phone</span>
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="flex-1 text-sm text-gray-900">{formData.phone || "Not added"}</p>
                )}
              </div>

              {/* Location */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 min-w-20">Location</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your location"
                  />
                ) : (
                  <p className="flex-1 text-sm text-gray-900">{formData.location || "Not added"}</p>
                )}
              </div>

              {/* Joined Date */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-700 min-w-20">Joined</span>
                </div>
                <p className="flex-1 text-sm text-gray-900">{formData.joined}</p>
              </div>

              {/* Security Section */}
              <div className="border-t pt-4 sm:pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="w-5 h-5" /> Security & Privacy
                  </h3>
                </div>
                <div className="space-y-3">
                  <button className="w-full sm:w-auto px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors text-sm">
                    <Key className="w-4 h-4" /> Change Password
                  </button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Two-Factor Auth</span>
                      <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded-full">
                        Disabled
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">Email Verified</span>
                      <span className="text-xs text-white bg-green-500 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Actions - Mobile Optimized */}
              <div className="border-t pt-4 sm:pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-2 sm:space-y-3">
                  <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Download My Data
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    Privacy Settings
                  </button>
                  <button className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile-friendly spacing */}
          <div className="h-6 sm:h-8"></div>
        </div>
      </div>
    </div>
  );
}