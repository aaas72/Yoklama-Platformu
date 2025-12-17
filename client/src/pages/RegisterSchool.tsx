import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { School, User, MapPin, Lock, Check } from "lucide-react";
import { registerSchool } from "../services/authService";

const RegisterSchool: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    school_name: "",
    manager_name: "",
    address: "",
    admin_username: "",
    admin_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await registerSchool(formData);
      navigate("/login");
    } catch (err: unknown) {
      console.error("Registration failed:", err);
      const resp = (err as { response?: { data?: { detail?: string; message?: string } } }).response?.data;
      setError(resp?.detail || resp?.message || "Kayıt işlemi başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-black bg-grid-white flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      dir="ltr"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        {/* Header Section - Aligned with Content */}
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-3">
            <Link to="/" className="group">
              <div className="bg-white text-black p-2 rounded-lg group-hover:bg-gray-200 transition">
                <School className="h-5 w-5" />
              </div>
            </Link>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Yeni Okul Kaydı
            </h2>
          </div>

          <div className="text-xs text-gray-400 hidden sm:flex items-center gap-2">
            <span>Zaten bir hesabınız var mı?</span>
            <Link
              to="/login"
              className="font-semibold text-white hover:text-gray-300 transition"
            >
              Giriş yapın
            </Link>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white py-8 px-6 border border-gray-200 rounded-xl shadow-2xl">
          {error && (
            <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-200">
              {error}
            </div>
          )}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {/* School Info Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
                  <School className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Okul Bilgileri
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Okul Adı
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <School className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="school_name"
                      value={formData.school_name}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-black focus:border-black text-xs transition placeholder-gray-400"
                      placeholder="Örn: Atatürk Anadolu Lisesi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Müdür Adı
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="manager_name"
                      value={formData.manager_name}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-black focus:border-black text-xs transition placeholder-gray-400"
                      placeholder="Örn: Ahmet Yılmaz"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Adres
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-black focus:border-black text-xs transition placeholder-gray-400"
                      placeholder="Örn: Kadıköy, İstanbul"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Info Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Yönetici Hesabı
                  </h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Kullanıcı Adı
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <User className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="admin_username"
                      value={formData.admin_username}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-black focus:border-black text-xs transition placeholder-gray-400"
                      placeholder="okul_yonetici"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Şifre
                  </label>
                  <div className="relative rounded-md">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                      <Lock className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      name="admin_password"
                      value={formData.admin_password}
                      onChange={handleChange}
                      required
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-md focus:ring-black focus:border-black text-xs transition placeholder-gray-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-[10px] text-gray-500 leading-relaxed">
                  <p>
                    Bu hesap okulun ana yönetici hesabı olacaktır. Kayıt
                    işleminden sonra bu bilgilerle giriş yapabilirsiniz.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto flex justify-center items-center gap-2 py-2 px-6 border border-transparent rounded-md text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Oluşturuluyor..."
                ) : (
                  <>
                    <span>Hesap Oluştur</span>
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Only Footer Link */}
        <div className="mt-6 text-center text-xs text-gray-400 sm:hidden">
          Zaten bir hesabınız var mı?{" "}
          <Link
            to="/login"
            className="font-medium text-white hover:text-gray-300 hover:underline transition"
          >
            Giriş yapın
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterSchool;
