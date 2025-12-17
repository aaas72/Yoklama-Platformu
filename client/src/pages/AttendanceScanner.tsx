import React, { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

interface ScanResult {
  name: string;
  status: "success" | "exists" | "error" | "new";
  message: string;
  time: string;
  className?: string;
  attendanceStatus?: string;
  recognitionMethod?: string;
}

const AttendanceScanner: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [faceBox, setFaceBox] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const navigate = useNavigate();

  async function captureAndScan() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (context) {
      const MAX_WIDTH = 500;
      const scale = MAX_WIDTH / video.videoWidth;
      const width = MAX_WIDTH;
      const height = video.videoHeight * scale;

      canvas.width = width;
      canvas.height = height;

      // Draw mirrored for processing to match display
      context.translate(width, 0);
      context.scale(-1, 1);
      context.drawImage(video, 0, 0, width, height);
      // Reset transform
      context.setTransform(1, 0, 0, 1, 0, 0);

      const imageBase64 = canvas.toDataURL("image/jpeg", 0.7);

      try {
        const response = await api.post("/attendance/scan", {
          image: imageBase64,
        });

        // Update Face Box if detected
        if (response.data.box) {
          const [top, right, bottom, left] = response.data.box;
          // Calculate percentages
          setFaceBox({
            top: (top / height) * 100,
            left: (left / width) * 100,
            width: ((right - left) / width) * 100,
            height: ((bottom - top) / height) * 100,
          });
        } else {
          setFaceBox(null);
        }

        if (
          response.data.status === "success" ||
          response.data.status === "exists"
        ) {
          setLastScanResult({
            name: response.data.student_name,
            status: response.data.status,
            message: response.data.message,
            time: new Date().toLocaleTimeString(),
            className: response.data.class_name,
            attendanceStatus: response.data.attendance_status,
            recognitionMethod: response.data.method,
          });

          setTimeout(() => {
            setLastScanResult(null);
          }, 3000);
        } else if (
          response.data.status === "no_match" ||
          response.data.status === "not_exist"
        ) {
          setLastScanResult({
            name:
              response.data.status === "not_exist"
                ? "Kayıtlı Değil"
                : "Bilinmiyor",
            status: "error",
            message:
              response.data.status === "not_exist"
                ? "Kayıtlı kişi bulunamadı"
                : "Yüz tanınamadı",
            time: new Date().toLocaleTimeString(),
          });
          setTimeout(() => setLastScanResult(null), 1000);
        } else if (response.data.status === "no_data") {
          setLastScanResult({
            name: "Veri Yok",
            status: "error",
            message: "Kayıtlı yüz verisi yok",
            time: new Date().toLocaleTimeString(),
          });
          setTimeout(() => setLastScanResult(null), 2000);
        } else if (response.data.status === "error") {
          setLastScanResult({
            name: "Hata",
            status: "error",
            message: response.data.message || "Bir hata oluştu",
            time: new Date().toLocaleTimeString(),
          });
          setTimeout(() => setLastScanResult(null), 3000);
        }
      } catch (error) {
        console.error("Scan error", error);
      }
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null;

    startCamera();

    async function startCamera() {
      try {
        setError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          setScanning(true); // Start scanning automatically
        }
      } catch (err) {
        console.error("Kamera erişim hatası:", err);
        setError("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
        setIsStreaming(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let timeoutId: number;
    let mounted = true;

    const scanLoop = async () => {
      if (!mounted || !isStreaming || !scanning) return;

      await captureAndScan();

      if (mounted && isStreaming && scanning) {
        timeoutId = setTimeout(scanLoop, 500);
      }
    };

    if (isStreaming && scanning) {
      scanLoop();
    }

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [isStreaming, scanning]);

  const handleClose = () => {
    // If opened in a new window/tab, try to close it
    if (window.opener) {
      window.close();
    } else {
      // Otherwise navigate back
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 py-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black rounded-lg">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Yoklama Modu</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <p className="text-xs text-gray-500 font-medium">
                Sistem Aktif • Yüz Tanıma Çalışıyor
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right mr-2">
            <p className="text-xs font-bold text-gray-900">Bekleniyor...</p>
            <p className="text-[10px] text-gray-500">Lütfen kameraya bakın</p>
          </div>

          <button
            onClick={() => setScanning(!scanning)}
            className="px-4 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">
              {scanning ? "Durdur" : "Başlat"}
            </span>
          </button>

          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-black/20"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tamamla</span>
          </button>

          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition text-gray-500 hover:text-black"
            title="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Camera Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black p-4">
        {error ? (
          <div className="text-center p-8 text-white bg-gray-800 rounded-2xl max-w-md mx-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
              <X className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold mb-2">Kamera Hatası</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-4xl aspect-video border-[2px] border-white rounded-xl overflow-hidden shadow-2xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform scale-x-[-1]"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Smart Face Tracking Overlay */}
            {faceBox && (
              <div
                className="absolute border-2 border-green-500/80 rounded-lg transition-all duration-300 ease-out shadow-[0_0_20px_rgba(34,197,94,0.4)] z-10"
                style={{
                  top: `${faceBox.top}%`,
                  left: `${faceBox.left}%`,
                  width: `${faceBox.width}%`,
                  height: `${faceBox.height}%`,
                }}
              >
                {/* Simulated Landmarks (Holographic Effect) */}
                {/* Eyes */}
                <div className="absolute top-[35%] left-[25%] w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80] animate-pulse"></div>
                <div className="absolute top-[35%] right-[25%] w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_8px_#4ade80] animate-pulse"></div>

                {/* Nose */}
                <div className="absolute top-[55%] left-[50%] -translate-x-1/2 w-1 h-1 bg-green-400/80 rounded-full"></div>

                {/* Mouth Area */}
                <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-1/3 h-[1px] bg-green-400/40"></div>
                <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2 w-1/4 h-[1px] bg-green-400/40 translate-y-1"></div>

                {/* Tech Corners */}
                <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400"></div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400"></div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400"></div>

                {/* ID Tag */}
                <div className="absolute -top-6 left-0 bg-green-500/20 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-green-300 font-mono border border-green-500/30">
                  TARGET LOCKED
                </div>
              </div>
            )}

            {/* Scanning Grid Animation (Always Visible for Tech Feel) */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(0,255,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

            {/* Scanning Overlay Effects */}
            {isStreaming && scanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Central Focus Frame */}
                  <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative backdrop-blur-[2px]">
                    <div className="absolute inset-0 border-t-2 border-green-500 rounded-3xl animate-spin-slow opacity-50"></div>

                    {/* Corner Markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-xl"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-xl"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-xl"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-xl"></div>

                    {/* Scanning Line */}
                    <div className="absolute inset-x-0 h-1 bg-green-500/80 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-scan-vertical"></div>
                  </div>
                </div>

                {/* Detected Faces Simulator (Floating Badges) */}
                {lastScanResult ? (
                  <div
                    className={`absolute top-6 left-6 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-white animate-fade-in shadow-xl ${
                      lastScanResult.status === "error"
                        ? "bg-red-500/90"
                        : "bg-green-500/90"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-1 bg-white/20 rounded-full">
                        {lastScanResult.status === "error" ? (
                          <X className="w-5 h-5" />
                        ) : (
                          <CheckCircle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-white/80">
                          {lastScanResult.status === "error"
                            ? "Durum"
                            : "Tespit Edilen"}
                        </p>
                        <p className="text-lg font-bold leading-none">
                          {lastScanResult.name}
                        </p>
                        {lastScanResult.className && (
                          <p className="text-sm font-medium text-white/90 mt-0.5">
                            {lastScanResult.className}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-start">
                      <div className="text-xs text-white/80 bg-black/20 px-2 py-1 rounded inline-block">
                        {lastScanResult.message}
                      </div>
                      {lastScanResult.attendanceStatus && (
                        <div className="text-xs text-white/80 bg-black/20 px-2 py-1 rounded inline-block">
                          {lastScanResult.attendanceStatus === "present"
                            ? "Mevcut"
                            : lastScanResult.attendanceStatus === "late"
                            ? "Geç Kaldı"
                            : lastScanResult.attendanceStatus}
                        </div>
                      )}
                      {lastScanResult.recognitionMethod && (
                        <div className="mt-1 text-[10px] text-white/70 bg-blue-500/30 px-2 py-0.5 rounded border border-blue-400/30">
                          {lastScanResult.recognitionMethod === "Hybrid"
                            ? "🔀 Hibrit"
                            : lastScanResult.recognitionMethod === "Distance"
                            ? "📏 Yüz Mesafesi"
                            : "🤖 SVM Modeli"}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 text-white animate-fade-in">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                      Durum
                    </p>
                    <p className="text-sm font-mono">Taranıyor...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceScanner;
