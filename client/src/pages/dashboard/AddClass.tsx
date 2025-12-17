import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, X } from "lucide-react";
import {
  Button,
  Input,
  Select,
  Card,
  SectionTitle,
} from "../../components/UIComponents";
import {
  getClass,
  createClass,
  updateClass,
} from "../../services/classService";
import { getTeachers, type Teacher } from "../../services/teacherService";

const AddClass: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<{ value: string; label: string }[]>(
    []
  );
  const [formData, setFormData] = useState({
    className: "",
    capacity: "",
    gradeLevel: "",
    branch: "",
    supervisor: "",
  });

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const data = await getTeachers();
        setTeachers(
          data.map((t: Teacher) => ({
            value: String(t.id),
            label: `${t.first_name} ${t.last_name} (${t.branch || "-"})`,
          }))
        );
      } catch (err) {
        console.error("Error fetching teachers:", err);
      }
    };
    fetchTeachers();

    if (isEditMode && id) {
      const fetchClass = async () => {
        try {
          setLoading(true);
          const cls = await getClass(Number(id));
          setFormData({
            className: cls.name,
            capacity: String(cls.capacity || ""),
            gradeLevel: cls.grade_level ? String(cls.grade_level) : "",
            branch: cls.branch || "",
            supervisor: cls.teacher_id ? String(cls.teacher_id) : "",
          });
        } catch (err) {
          console.error("Error fetching class:", err);
          setError("Sınıf bilgileri yüklenemedi.");
        } finally {
          setLoading(false);
        }
      };
      fetchClass();
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

    // Map form data to API format
    const apiData = {
      name: formData.className,
      capacity: Number(formData.capacity),
      grade_level: formData.gradeLevel,
      branch: formData.branch,
      teacher_id: formData.supervisor ? Number(formData.supervisor) : null,
    };

    try {
      if (isEditMode && id) {
        await updateClass(Number(id), apiData);
      } else {
        await createClass(apiData);
      }
      navigate("/dashboard/classes");
    } catch (err: any) {
      console.error("Error saving class:", err);
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
            onClick={() => navigate("/dashboard/classes")}
            className="rounded-full h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditMode ? "Sınıf Düzenle" : "Yeni Sınıf Oluştur"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEditMode
                ? "Sınıf bilgilerini güncelleyin."
                : "Yeni bir sınıf ve şube tanımlayın."}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2">
          <Card className="p-5">
            <SectionTitle title="Sınıf Bilgileri" />
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Sınıf Adı"
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                  placeholder="Örn: 9-A"
                  required
                />
                <Input
                  label="Kapasite"
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="Örn: 30"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Seviye"
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  options={[
                    { value: "9", label: "9. Sınıf" },
                    { value: "10", label: "10. Sınıf" },
                    { value: "11", label: "11. Sınıf" },
                    { value: "12", label: "12. Sınıf" },
                  ]}
                  required
                />
                <Input
                  label="Şube"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="Örn: A"
                  required
                />
              </div>

              <Select
                label="Sınıf Öğretmeni"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                placeholder="Seçiniz"
                options={teachers}
              />
            </div>
          </Card>
        </div>

        {/* Right Column: Actions */}
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle title="İşlemler" />
            <p className="text-xs text-gray-500 mb-4">
              {isEditMode
                ? "Değişiklikleri kaydetmek için güncelleyin."
                : "Sınıf oluşturulduktan sonra öğrenci ekleyebilirsiniz."}
            </p>

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full"
                icon={<Save className="h-4 w-4" />}
                disabled={loading}
              >
                {loading
                  ? "Kaydediliyor..."
                  : isEditMode
                  ? "Güncelle"
                  : "Oluştur"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => navigate("/dashboard/classes")}
                icon={<X className="h-4 w-4" />}
                disabled={loading}
              >
                İptal
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default AddClass;
