import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button, Input, SectionTitle, Card } from "../../components/UIComponents";
import {
  getTeacher,
  createTeacher,
  updateTeacher,
} from "../../services/teacherService";

const AddTeacher: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    tcNo: "",
    birthDate: "",
    phone: "",
    email: "",
    branch: "",
  });

  useEffect(() => {
    if (isEditMode && id) {
      const fetchTeacher = async () => {
        try {
          setLoading(true);
          const teacher = await getTeacher(Number(id));
          setFormData({
            firstName: teacher.first_name,
            lastName: teacher.last_name,
            tcNo: teacher.tc_no || "",
            birthDate: teacher.birth_date || "",
            phone: teacher.phone || "",
            email: teacher.email || "",
            branch: teacher.branch || "",
          });
        } catch (err) {
          console.error("Error fetching teacher:", err);
          setError("Öğretmen bilgileri yüklenemedi.");
        } finally {
          setLoading(false);
        }
      };
      fetchTeacher();
    }
  }, [isEditMode, id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        tcNo: formData.tcNo || undefined,
        birthDate: formData.birthDate || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        branch: formData.branch || undefined,
      };
      if (isEditMode && id) {
        await updateTeacher(Number(id), payload);
      } else {
        await createTeacher(payload);
      }
      navigate("/dashboard/teachers");
    } catch (err: any) {
      console.error("Error saving teacher:", err);
      const resp = err.response?.data;
      setError(resp?.message || resp?.detail || "Bir hata oluştu.");
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
            onClick={() => navigate("/dashboard/teachers")}
            className="rounded-full h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditMode ? "Personel Düzenle" : "Yeni Personel Ekle"}
            </h2>
            <p className="text-xs text-gray-500">
              Öğretmen veya idari personel bilgilerini giriniz.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <SectionTitle title="Kimlik Bilgileri" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ad"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Örn: Ayşe"
                  required
                />
                <Input
                  label="Soyad"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Örn: Demir"
                  required
                />
                <Input
                  label="TC Kimlik No"
                  name="tcNo"
                  value={formData.tcNo}
                  onChange={handleChange}
                  placeholder="11 Haneli TC No"
                />
                <Input
                  label="Doğum Tarihi"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  type="date"
                />
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle title="İletişim ve Görev Bilgileri" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Telefon"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0555 555 55 55"
                />
                <Input
                  label="E-posta"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="ornek@okul.com"
                />
                <Input
                  label="Branş"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="Örn: Matematik"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Actions */}
          <div className="space-y-6">
            <Card className="p-5">
              <SectionTitle title="Kayıt İşlemi" />
              <p className="text-xs text-gray-500 mb-4">
                Personel kaydını tamamlamak için bilgileri kontrol edip kaydedin.
              </p>
              
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  icon={<Save className="h-4 w-4" />}
                  disabled={loading}
                >
                  {loading ? "Kaydediliyor..." : "Kaydet"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => navigate("/dashboard/teachers")}
                  icon={<X className="h-4 w-4" />}
                  disabled={loading}
                >
                  İptal
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddTeacher;
