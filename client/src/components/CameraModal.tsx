import React, { useEffect, useRef, useState } from "react";
import { X, Camera, RefreshCw } from "lucide-react";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (photoDataUrl: string) => void;
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    async function startCamera() {
      try {
        setError("");
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
          setScanning(true);
        }
      } catch (err) {
        console.error("Kamera erişim hatası:", err);
        setError("Kameraya erişilemedi. Lütfen izinleri kontrol edin.");
        setIsStreaming(false);
      }
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsStreaming(false);
      setScanning(false);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        // Mirror the image if needed (since video is mirrored via CSS)
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Fotoğraf Çek</h2>
              <p className="text-xs text-gray-500">
                Öğrenci profili için fotoğraf
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
          {error ? (
            <div className="text-center p-8 text-white">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
                <X className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay UI */}
              {isStreaming && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Face Guide Frame */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/30 rounded-full relative backdrop-blur-[1px]">
                      {/* Scanning effect */}
                      {scanning && (
                        <div className="absolute inset-0 border-t-2 border-green-500 rounded-full animate-spin-slow opacity-70"></div>
                      )}
                      
                      {/* Crosshairs */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-full bg-white/20"></div>
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[1px] bg-white/20"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-medium text-white">Canlı Kamera</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-4">
          <div className="text-xs text-gray-500 hidden sm:block">
             Yüzü çerçevenin içine ortalayın
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
                onClick={() => setScanning(!scanning)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 text-xs font-bold text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
            >
                <RefreshCw className={`h-4 w-4 ${scanning ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Odakla</span>
            </button>
            
            <button
                onClick={handleCapture}
                disabled={!isStreaming}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-lg bg-black text-white text-xs font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <div className="w-4 h-4 rounded-full border-2 border-white/30 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <span>Fotoğraf Çek</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
