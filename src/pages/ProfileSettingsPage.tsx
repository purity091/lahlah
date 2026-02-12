import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/AuthProvider';
import { User, Mail, Save, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProfileSettingsPage: React.FC = () => {
  const { user, updateProfile, error, loading } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    avatar_url: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setSuccessMessage('');
    
    try {
      await updateProfile({
        full_name: formData.full_name,
        avatar_url: formData.avatar_url
      });
      setSuccessMessage('تم تحديث الملف الشخصي بنجاح!');
    } catch (err) {
      console.error('Update profile error:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black text-slate-900">الملف الشخصي</h1>
                <p className="text-slate-500 font-bold mt-1">إدارة معلومات حسابك الشخصي</p>
              </div>
              <Link 
                to="/" 
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all"
              >
                العودة إلى التطبيق
              </Link>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-red-700">خطأ</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <svg className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-emerald-700">نجاح</p>
                  <p className="text-sm text-emerald-600">{successMessage}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Picture */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-black text-slate-900 mb-4">الصورة الشخصية</h3>
                  
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center mb-4 overflow-hidden">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="text"
                      name="avatar_url"
                      value={formData.avatar_url}
                      onChange={handleChange}
                      placeholder="رابط الصورة الشخصية"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-all"
                    />
                    
                    <p className="text-xs text-slate-400 font-bold mt-2 text-center">
                      يمكنك استخدام خدمة مثل Gravatar أو أي رابط لصورة شخصية
                    </p>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <h3 className="text-lg font-black text-slate-900 mb-4">المعلومات الشخصية</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2">الاسم الكامل</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-all"
                          placeholder="أدخل اسمك الكامل"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-slate-400 mb-2">البريد الإلكتروني</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <h3 className="text-lg font-black text-slate-900 mb-4">معلومات الحساب</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">معرف المستخدم</label>
                    <input
                      type="text"
                      value={user?.id || ''}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">تاريخ الإنشاء</label>
                    <input
                      type="text"
                      value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-SA') : ''}
                      disabled
                      className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdating || loading}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;