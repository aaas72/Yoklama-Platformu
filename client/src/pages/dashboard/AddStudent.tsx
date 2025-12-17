import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X, Camera } from "lucide-react";
import {
  Button,
  Input,
  Select,
  SectionTitle,
  Card,
} from "../../components/UIComponents";
import CameraModal from "../../components/CameraModal";
import {
  getStudent,
  createStudent,
  updateStudent,
} from "../../services/studentService";
import { getClasses, type Class } from "../../services/classService";

const AddStudent: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  interface QualityDetail {
    index: number;
    status: "accepted" | "rejected";
    reason?: string;
  }
  interface QualitySummary {
    accepted_count: number;
    rejected_count: number;
    details: QualityDetail[];
  }
  type CreateOrUpdateResponse = { quality_summary?: QualitySummary } & Record<
    string,
    unknown
  >;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    tcNo: "",
    birthDate: "",
    schoolNo: "",
    class: "",
  });

  const [classes, setClasses] = useState<{ value: string; label: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [faceCount, setFaceCount] = useState<number>(0);
  const [primaryPhotoIndex, setPrimaryPhotoIndex] = useState<number>(0);
  const [qualitySummary, setQualitySummary] = useState<QualitySummary | null>(
    null
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Fetch classes
    const fetchClasses = async () => {
      try {
        const data = await getClasses();
        setClasses(
          data.map((c: Class) => ({ value: String(c.id), label: c.name }))
        );
      } catch (err) {
        console.error("Error fetching classes:", err);
      }
    };
    fetchClasses();

    if (isEditMode && id) {
      const fetchStudent = async () => {
        try {
          setLoading(true);
          const student = await getStudent(Number(id));

          // Split full name
          const nameParts = student.full_name.split(" ");
          const lastName = nameParts.length > 1 ? nameParts.pop() || "" : "";
          const firstName = nameParts.join(" ");

          setFormData({
            firstName: firstName,
            lastName: lastName,
            tcNo: student.tc_no || "",
            birthDate: student.birth_date || "",
            schoolNo: student.student_id,
            class: String(student.class_id || ""),
          });

          setFaceCount((student as any).face_count || 0);

          if (student.photo_url) {
            setPhotos([student.photo_url]);
          }
        } catch (err) {
          console.error("Error fetching student:", err);
          setError("Öğrenci bilgileri yüklenemedi.");
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [isEditMode, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoCapture = (photoDataUrl: string) => {
    setPhotos((prev) => [...prev, photoDataUrl]);
    // Keep camera open for multiple shots? Or close it?
    // User flow: capture -> review -> capture more.
    // For now, let's close it to allow review, or maybe keep it open if we modify CameraModal.
    // Since CameraModal closes on capture in its internal logic (usually), let's assume it closes or we close it.
    setIsCameraOpen(false);
  };

  const handleFiles = (files: FileList | File[]) => {
    const remaining = 10 - photos.length;
    const selected = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, remaining));
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string | null;
        if (result) {
          setPhotos((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    if (index === primaryPhotoIndex) {
      setPrimaryPhotoIndex(0);
    } else if (index < primaryPhotoIndex) {
      setPrimaryPhotoIndex(primaryPhotoIndex - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        student_id: String(formData.schoolNo),
        class_id: formData.class ? Number(formData.class) : null,
        tc_no: formData.tcNo,
        birth_date: formData.birthDate,
        photo_url: photos.length > 0 ? photos[primaryPhotoIndex] : null,
        photos: photos, // Send all photos
      };

      if (isEditMode && id) {
        const res: CreateOrUpdateResponse = await updateStudent(
          Number(id),
          payload
        );
        if (res.quality_summary) {
          setQualitySummary(res.quality_summary);
        } else {
          navigate("/dashboard/students");
        }
      } else {
        const res: CreateOrUpdateResponse = await createStudent(payload);
        if (res.quality_summary) {
          setQualitySummary(res.quality_summary);
        } else {
          navigate("/dashboard/students");
        }
      }
    } catch (err: any) {
      console.error("Error saving student:", err);
      const resp = err.response?.data;
      
      // Handle validation details array
      let errorMsg = resp?.message || resp?.detail || "Bir hata oluştu.";
      if (resp?.details && Array.isArray(resp.details)) {
        errorMsg += ": " + resp.details.join(", ");
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => navigate("/dashboard/students")}
            className="rounded-full h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditMode ? "Öğrenci Düzenle" : "Yeni Öğrenci Ekle"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEditMode
                ? "Öğrenci bilgilerini güncelleyiniz."
                : "Öğrenci bilgilerini eksiksiz doldurunuz."}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <CameraModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={handlePhotoCapture}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Photo & Basic Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex justify-between items-center mb-4">
                <SectionTitle title="Kişisel Bilgiler" />
                {isEditMode && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded border border-indigo-400">
                    Kayıtlı Yüz Sayısı: {faceCount}
                  </span>
                )}
              </div>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Öğrenci Fotoğrafları{" "}
                    <span className="text-xs text-gray-500">
                      (En az 5 adet önerilir)
                    </span>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCameraOpen(true)}
                    disabled={photos.length >= 10}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {photos.length === 0 ? "Fotoğraf Çek" : "Fotoğraf Ekle"}
                  </Button>
                </div>

                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`rounded-lg ${
                    isDragging ? "border-2 border-blue-400 bg-blue-50 p-2" : ""
                  }`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {photos.map((photo, index) => (
                      <div
                        key={index}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 group ${
                          index === primaryPhotoIndex
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-200"
                        }`}
                      >
                        <img
                          src={photo}
                          alt={`Student ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrimaryPhotoIndex(index)}
                          className={`absolute bottom-0 inset-x-0 text-[10px] py-1 text-center font-medium transition-colors ${
                            index === primaryPhotoIndex
                              ? "bg-blue-500 text-white"
                              : "bg-gray-900/60 text-white hover:bg-gray-900/80"
                          }`}
                        >
                          {index === primaryPhotoIndex
                            ? "Profil Fotoğrafı"
                            : "Profil Yap"}
                        </button>
                      </div>
                    ))}

                    {photos.length < 10 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500"
                      >
                        <Camera className="h-8 w-8" />
                        <span className="text-xs font-medium">Ekle</span>
                      </button>
                    )}
                  </div>
                </div>
                {photos.length > 0 && photos.length < 5 && (
                  <p className="mt-2 text-xs text-amber-600">
                    * Daha iyi tanıma performansı için farklı açılardan en az 5
                    fotoğraf eklemeniz önerilir.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Ad"
                    name="firstName"
                    placeholder="Örn: Ahmet"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Soyad"
                    name="lastName"
                    placeholder="Örn: Yılmaz"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="TC Kimlik No"
                    name="tcNo"
                    placeholder="11 Haneli TC No"
                    value={formData.tcNo}
                    onChange={handleChange}
                  />
                  <Input
                    label="Doğum Tarihi"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Okul No"
                  name="schoolNo"
                  placeholder="Örn: 1234"
                  required
                  value={formData.schoolNo}
                  onChange={handleChange}
                />
                <Select
                  label="Sınıf"
                  name="class"
                  options={classes}
                  required
                  value={formData.class}
                  onChange={handleChange}
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Additional Info / Summary / Actions */}
          <div className="space-y-6">
            <Card className="p-5">
              <SectionTitle title="Kayıt İşlemi" />
              <p className="text-xs text-gray-500 mb-4">
                Girdiğiniz bilgilerin doğruluğunu kontrol ettikten sonra kaydet
                butonuna basınız.
              </p>

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  icon={<Save className="h-4 w-4" />}
                  disabled={loading}
                >
                  {loading
                    ? "İşleniyor..."
                    : isEditMode
                    ? "Güncelle"
                    : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/dashboard/students")}
                  icon={<X className="h-4 w-4" />}
                >
                  İptal
                </Button>
              </div>
            </Card>
            {qualitySummary && (
              <Card className="p-5">
                <SectionTitle title="Yüz Kalite Sonucu" />
                <div className="mt-2 text-sm text-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-1 rounded bg-green-100 text-green-700">
                      Kabul: {qualitySummary.accepted_count}
                    </div>
                    <div className="px-3 py-1 rounded bg-red-100 text-red-700">
                      Reddedilen: {qualitySummary.rejected_count}
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1">
                    {qualitySummary.details.map((d, i) => (
                      <li key={i} className="text-xs">
                        Fotoğraf #{d.index + 1}:{" "}
                        {d.status === "accepted"
                          ? "Kabul"
                          : `Red (${d.reason})`}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => navigate("/dashboard/students")}
                    >
                      Tamam
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddStudent;
