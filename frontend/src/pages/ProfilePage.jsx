import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../firebase/auth';
import { updateUserPassword, deleteUserAccount } from '../firebase/auth';
import allDistricts from '../data/allDistricts';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Lock, 
  Trash2, 
  Camera, 
  ArrowLeft, 
  Save, 
  X, 
  Loader,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Users,
  MapPin,
  Globe,
  Linkedin,
  FileText,
  Map
} from 'lucide-react';

function ProfilePage({ onBackToDashboard }) {
  const { currentUser } = useAuth();
  
  // Tab states: 'info' | 'password' | 'account'
  const [activeTab, setActiveTab] = useState('info');
  
  // Profile meta states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('');
  const [avatar, setAvatar] = useState('');
  
  // New user credentials fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [stateName, setStateName] = useState('');
  const [country, setCountry] = useState('India');
  const [altEmail, setAltEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [bio, setBio] = useState('');
  
  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Delete account states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  
  // Layout utilities
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '' }
  const fileInputRef = useRef(null);
  
  const userKey = `profile_meta_${currentUser?.email || currentUser?.uid}`;

  // Load custom profile metadata on mount
  useEffect(() => {
    const loadProfileData = async () => {
      // 1. Try Realtime Database if real Firebase
      try {
        const { isPlaceholder } = await import('../firebase/config');
        if (!isPlaceholder && currentUser?.uid) {
          const { database } = await import('../firebase/config');
          const { ref, get, child } = await import('firebase/database');
          const snapshot = await get(child(ref(database), `users/${currentUser.uid}`));
          if (snapshot.exists()) {
            const data = snapshot.val();
            setPhone(data.phone || '');
            setOrganization(data.organization || '');
            setRole(data.role || '');
            setAvatar(data.avatar || '');
            
            // Load new fields
            setAge(data.age || '');
            setGender(data.gender || 'Male');
            setDob(data.dob || '');
            setAddress(data.address || '');
            setStateName(data.stateName || '');
            setCountry(data.country || 'India');
            setAltEmail(data.altEmail || '');
            setPortfolioUrl(data.portfolioUrl || '');
            setBio(data.bio || '');
            return;
          }
        }
      } catch (dbErr) {
        console.error("Realtime Database read failed (falling back to localStorage):", dbErr);
      }

      // 2. LocalStorage Fallback
      try {
        const stored = localStorage.getItem(userKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          setPhone(parsed.phone || '');
          setOrganization(parsed.organization || '');
          setRole(parsed.role || '');
          setAvatar(parsed.avatar || '');
          
          // Load new fields
          setAge(parsed.age || '');
          setGender(parsed.gender || 'Male');
          setDob(parsed.dob || '');
          setAddress(parsed.address || '');
          setStateName(parsed.stateName || '');
          setCountry(parsed.country || 'India');
          setAltEmail(parsed.altEmail || '');
          setPortfolioUrl(parsed.portfolioUrl || '');
          setBio(parsed.bio || '');
        }
      } catch (e) {
        console.error("Failed to load local metadata", e);
      }
    };

    loadProfileData();
  }, [userKey, currentUser]);

  // Show auto-dismissing toast notifications
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleDobChange = (value) => {
    setDob(value);
    if (value) {
      const birthDate = new Date(value);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 13 && calculatedAge <= 100) {
        setAge(calculatedAge.toString());
      }
    }
  };

  // Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Validations
    if (fullName.trim().length < 2) {
      showToast('error', 'Full Name must be at least 2 characters long.');
      return;
    }
    
    if (phone && !/^\d{10}$/.test(phone)) {
      showToast('error', 'Phone Number must be exactly 10 digits.');
      return;
    }

    // New validations
    if (!age) {
      showToast('error', 'Age is required.');
      return;
    }
    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
      showToast('error', 'Age must be a number between 13 and 100.');
      return;
    }

    if (!gender) {
      showToast('error', 'Gender is required.');
      return;
    }

    if (portfolioUrl && !/^https?:\/\//i.test(portfolioUrl)) {
      showToast('error', 'Portfolio URL must start with http:// or https://');
      return;
    }

    if (altEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(altEmail)) {
      showToast('error', 'Please enter a valid alternate email address.');
      return;
    }

    if (bio && bio.length > 150) {
      showToast('error', 'Bio must be under 150 characters.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Update display name inside firebase auth profile (cloud or mock)
      await updateProfile(currentUser, { displayName: fullName });
      
      // Save extra fields locally (always cache locally as backup)
      const meta = { 
        phone, organization, role, avatar,
        age, gender, dob, address, stateName, country, altEmail, portfolioUrl, bio
      };
      localStorage.setItem(userKey, JSON.stringify(meta));

      // 3. Write to Realtime Database if real Firebase
      try {
        const { isPlaceholder } = await import('../firebase/config');
        if (!isPlaceholder && currentUser?.uid) {
          const { database } = await import('../firebase/config');
          const { ref, update } = await import('firebase/database');
          await update(ref(database, `users/${currentUser.uid}`), {
            uid: currentUser.uid,
            fullName: fullName,
            email: currentUser.email,
            phone,
            organization,
            role,
            avatar,
            age,
            gender,
            dob,
            address,
            stateName,
            country,
            altEmail,
            portfolioUrl,
            bio,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (dbErr) {
        console.error("Realtime Database write failed:", dbErr);
      }
      
      // Sync display name in current session
      if (currentUser) {
        currentUser.displayName = fullName;
      }
      
      showToast('success', 'Profile updated successfully.');
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      showToast('error', err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel edits
  const handleCancelEdits = () => {
    setFullName(currentUser?.displayName || '');
    try {
      const stored = localStorage.getItem(userKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPhone(parsed.phone || '');
        setOrganization(parsed.organization || '');
        setRole(parsed.role || '');
        setAvatar(parsed.avatar || '');
        
        // Revert new fields
        setAge(parsed.age || '');
        setGender(parsed.gender || 'Male');
        setDob(parsed.dob || '');
        setAddress(parsed.address || '');
        setStateName(parsed.stateName || '');
        setCountry(parsed.country || 'India');
        setAltEmail(parsed.altEmail || '');
        setPortfolioUrl(parsed.portfolioUrl || '');
        setBio(parsed.bio || '');
      } else {
        setPhone('');
        setOrganization('');
        setRole('');
        setAvatar('');
        
        // Revert to defaults
        setAge('');
        setGender('Male');
        setDob('');
        setAddress('');
        setStateName('');
        setCountry('India');
        setAltEmail('');
        setPortfolioUrl('');
        setBio('');
      }
    } catch (e) {}
    setIsEditing(false);
  };

  // Avatar Image Selection
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Image size must be smaller than 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Change Password Form
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validations
    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters long.');
      return;
    }
    
    if (!/\d/.test(newPassword)) {
      showToast('error', 'New password must contain at least 1 number.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showToast('error', 'New passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await updateUserPassword(currentUser, currentPassword, newPassword);
      showToast('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        showToast('error', 'Current password is incorrect.');
      } else {
        showToast('error', err.message || 'Failed to change password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!deleteConfirmPassword) {
      showToast('error', 'Please enter your current password to confirm.');
      return;
    }

    setIsLoading(true);

    try {
      await deleteUserAccount(currentUser, deleteConfirmPassword);
      showToast('success', 'Account deleted successfully.');
      setIsDeleteModalOpen(false);
      // Let authentication listener handle redirection
      window.location.reload();
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        showToast('error', 'Incorrect password. Account deletion denied.');
      } else {
        showToast('error', err.message || 'Failed to delete account.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Render current date metadata helper
  const getCreatedDate = () => {
    if (currentUser?.metadata?.creationTime) {
      return new Date(currentUser.metadata.creationTime).toLocaleDateString([], { dateStyle: 'long' });
    }
    return new Date().toLocaleDateString([], { dateStyle: 'long' }); // Fallback
  };

  const getLastLoginDate = () => {
    if (currentUser?.metadata?.lastSignInTime) {
      return new Date(currentUser.metadata.lastSignInTime).toLocaleString();
    }
    return new Date().toLocaleString(); // Fallback
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 relative">
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className={`fixed top-6 right-6 flex items-center space-x-3 px-4 py-3.5 rounded-xl shadow-2xl z-[100] border transform transition-all duration-300 animate-slideIn ${
          toast.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-accentRed/10 border-accentRed/25 text-accentRed'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-850">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToDashboard}
            className="p-2 bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400 hover:text-white transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Operator Profile</h2>
            <p className="text-slate-500 text-xs mt-0.5">Manage your credential parameters and SEMS info</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Side: Avatar Card */}
        <div className="md:col-span-1 flex flex-col items-center bg-[#0B0F19] border border-darkBorder/40 p-6 rounded-2xl">
          <div className="relative group">
            <div 
              onClick={handleAvatarClick}
              className={`h-24 w-24 rounded-full overflow-hidden border-2 border-slate-800 bg-slate-900/60 flex items-center justify-center relative ${
                isEditing ? 'cursor-pointer hover:border-accentBlue' : ''
              }`}
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-slate-400">
                  {fullName ? fullName.charAt(0).toUpperCase() : 'O'}
                </span>
              )}

              {/* Camera Hover Overlay */}
              {isEditing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-full">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden" 
            />
          </div>

          <h3 className="font-extrabold text-sm text-white mt-4 text-center truncate w-full">
            {fullName || 'Operator'}
          </h3>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1 text-center truncate w-full">
            {role || 'SEMS Operator'}
          </span>
        </div>

        {/* Right Side: Tab Forms panel */}
        <div className="md:col-span-3 flex flex-col">
          
          {/* Section Navigation Tabs */}
          <div className="flex bg-[#0B0F19] p-1 border border-darkBorder/30 rounded-xl mb-6 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'info' ? 'bg-accentBlue text-white shadow' : 'hover:text-slate-200'
              }`}
            >
              Profile Info
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'password' ? 'bg-accentBlue text-white shadow' : 'hover:text-slate-200'
              }`}
            >
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex-1 py-2 rounded-lg text-center transition-all ${
                activeTab === 'account' ? 'bg-accentBlue text-white shadow' : 'hover:text-slate-200'
              }`}
            >
              Account settings
            </button>
          </div>

          {/* Form Containers */}
          <div className="bg-[#0B0F19] border border-darkBorder/40 p-6 rounded-2xl flex-1">
            
            {activeTab === 'info' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Credentials Details</span>
                  {!isEditing ? (
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                      className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button 
                        type="button" 
                        onClick={handleCancelEdits}
                        className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-accentBlue hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1.5 shadow disabled:opacity-50"
                      >
                        {isLoading ? <Loader className="h-3 w-3 animate-spin text-white" /> : <Save className="h-3 w-3" />}
                        <span>Save Changes</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Full Name
                    </label>
                    <input 
                      type="text" 
                      required
                      disabled={!isEditing}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Email address field (read only) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Email Address
                    </label>
                    <input 
                      type="email" 
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-500 outline-none opacity-50"
                    />
                  </div>

                  {/* Phone number field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Phone className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Phone Number
                    </label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Organization field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Building className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Organization / College
                    </label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      placeholder="e.g. IIT Bombay"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Role field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Briefcase className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Designation Role
                    </label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      placeholder="e.g. Operator, Student"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Age Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <User className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Age (13-100) <span className="text-accentRed ml-0.5">*</span>
                    </label>
                    <input 
                      type="number" 
                      required
                      disabled={!isEditing}
                      placeholder="e.g. 25"
                      min="13"
                      max="100"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Gender Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Gender <span className="text-accentRed ml-0.5">*</span>
                    </label>
                    <select
                      required
                      disabled={!isEditing}
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-[#090d16] border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* Date of Birth Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Date of Birth
                    </label>
                    <input 
                      type="date" 
                      disabled={!isEditing}
                      value={dob}
                      onChange={(e) => handleDobChange(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all [color-scheme:dark]"
                    />
                  </div>

                  {/* Address / City Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Address / City
                    </label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      placeholder="e.g. Mumbai"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* State Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Map className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> State
                    </label>
                    <select
                      disabled={!isEditing}
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-[#090d16] border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {Object.keys(allDistricts).sort().map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  {/* Country Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Globe className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Country
                    </label>
                    <select
                      disabled={!isEditing}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#090d16] border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all cursor-pointer"
                    >
                      <option value="India">India</option>
                      <option value="United States">United States</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Canada">Canada</option>
                      <option value="Australia">Australia</option>
                      <option value="Germany">Germany</option>
                      <option value="France">France</option>
                      <option value="Japan">Japan</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Alternate Email Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Mail className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Alternate Email
                    </label>
                    <input 
                      type="email" 
                      disabled={!isEditing}
                      placeholder="alternate@domain.com"
                      value={altEmail}
                      onChange={(e) => setAltEmail(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* LinkedIn / Portfolio URL Field */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Linkedin className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> LinkedIn / Portfolio
                    </label>
                    <input 
                      type="url" 
                      disabled={!isEditing}
                      placeholder="https://linkedin.com/in/username"
                      value={portfolioUrl}
                      onChange={(e) => setPortfolioUrl(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all"
                    />
                  </div>

                  {/* Bio / About Field (full width) */}
                  <div className="space-y-1.5 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                        <FileText className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Bio / About
                      </label>
                      <span className="text-[10px] text-slate-550 font-bold">{bio.length}/150</span>
                    </div>
                    <textarea 
                      disabled={!isEditing}
                      placeholder="Write a brief bio about yourself..."
                      maxLength={150}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows="3"
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue disabled:opacity-50 disabled:bg-slate-900/10 transition-all resize-none"
                    />
                  </div>

                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">Change Password Setup</span>

                <div className="space-y-4 max-w-md">
                  
                  {/* Current Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Current Password
                    </label>
                    <input 
                      type="password" 
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue transition-all"
                      placeholder="Enter current password"
                    />
                  </div>

                  {/* New Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> New Password (min. 8 chars, 1 number)
                    </label>
                    <input 
                      type="password" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue transition-all"
                      placeholder="Enter new password"
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                      <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-500" /> Confirm New Password
                    </label>
                    <input 
                      type="password" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentBlue transition-all"
                      placeholder="Re-enter new password"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-accentBlue hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow disabled:opacity-50"
                  >
                    {isLoading ? <Loader className="h-4 w-4 animate-spin text-white" /> : <Lock className="h-4 w-4" />}
                    <span>Update Password</span>
                  </button>

                </div>
              </form>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-3">System Meta Log</span>
                  
                  <div className="space-y-3 max-w-md text-xs">
                    <div className="flex justify-between items-center p-3 rounded-xl border border-darkBorder/40 bg-slate-900/10">
                      <span className="text-slate-450 font-semibold">Account Created:</span>
                      <span className="font-extrabold text-slate-205">{getCreatedDate()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl border border-darkBorder/40 bg-slate-900/10">
                      <span className="text-slate-450 font-semibold">Last Sign In:</span>
                      <span className="font-extrabold text-slate-205">{getLastLoginDate()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-5">
                  <span className="text-[10px] uppercase font-bold text-accentRed tracking-wider block mb-1.5">Danger Zone</span>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4 max-w-lg">
                    Once you delete your account, all credentials metadata, saved presets, and local preferences will be permanently wiped out. This action is irreversible.
                  </p>
                  
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="bg-accentRed/10 border border-accentRed/35 text-accentRed hover:bg-accentRed hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Delete User Account</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 bg-[#0B0F19] border border-accentRed/25 rounded-2xl shadow-2xl space-y-4 animate-scaleUp">
            
            <div className="flex items-center space-x-2 text-accentRed">
              <Trash2 className="h-6 w-6" />
              <h3 className="text-base font-black uppercase tracking-wide">Delete Account?</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This action will permanently wipe your login credentials and profile metadata. Enter your current password to authorize this action:
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider block">Verify Password</label>
                <input 
                  type="password" 
                  required
                  value={deleteConfirmPassword}
                  onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                  className="w-full bg-[#07090e]/60 border border-darkBorder/40 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-accentRed transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div className="flex justify-end items-center space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmPassword('');
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-accentRed hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow disabled:opacity-50"
                >
                  {isLoading ? <Loader className="h-4 w-4 animate-spin text-white" /> : <Trash2 className="h-4 w-4" />}
                  <span>Wipe Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProfilePage;
