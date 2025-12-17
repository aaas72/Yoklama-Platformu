import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "../components/Logo";

const Landing: React.FC = () => {
  return (
    <div
      className="min-h-screen bg-black bg-grid-white text-white font-['Inter'] relative"
      dir="ltr"
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo className="text-white" />
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-gray-300 hover:text-white font-medium transition text-sm hidden sm:block"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 overflow-hidden z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Akıllı Yoklama Platformu
            </h1>
            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Yüz tanıma teknolojisi ile saniyeler içinde yoklama alın. Karmaşık
              okul yönetim sistemlerine ihtiyaç duymadan, sadece devamsızlık
              takibine odaklanan modern çözüm.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Link
                to="/register-school"
                className="flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-xl text-md font-semibold hover:bg-gray-200 transition shadow-lg hover:shadow-white/20 hover:-translate-y-1 duration-200"
              >
                <span>Okul Hesabı Oluştur</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Background Decor - Glow */}
        <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-blue-900/20 rounded-full blur-3xl opacity-50" />
        </div>
      </header>
    </div>
  );
};

export default Landing;
