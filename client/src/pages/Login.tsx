import React, { useState } from "react";
import { useAuth } from "../context/auth";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, LogIn } from "lucide-react";
import { Input, Button } from "../components/UIComponents";
import Logo from "../components/Logo";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError("Giriş başarısız. Lütfen bilgilerinizi kontrol edin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-black bg-grid-white flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      dir="ltr"
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 px-1">
          <Link to="/" className="group">
            <Logo className="text-white" iconClassName="h-6 w-6 text-black" />
          </Link>

          <div className="text-xs text-gray-400 hidden sm:flex items-center gap-2">
            <span>Hesabınız yok mu?</span>
            <Link
              to="/register-school"
              className="font-semibold text-white hover:text-gray-300 transition"
            >
              Okul Kaydı
            </Link>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="bg-white py-8 px-6 border border-gray-200 rounded-xl shadow-2xl">
          <div className="mb-6">
             <h2 className="text-xl font-bold text-gray-900 tracking-tight text-center">
              Sisteme Giriş
            </h2>
          </div>
         
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-xs mb-4 flex items-center gap-2">
              <div className="w-1 h-1 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Kullanıcı Adı"
              icon={<User />}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Kullanıcı adınızı girin"
            />

            <Input
              label="Şifre"
              icon={<Lock />}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />

            <div>
              <Button
                type="submit"
                isLoading={loading}
                className="w-full bg-black text-white hover:bg-gray-800 border-transparent"
                icon={!loading && <LogIn className="h-4 w-4" />}
              >
                Giriş Yap
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
