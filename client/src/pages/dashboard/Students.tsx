import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions,
} from "../../components/UIComponents";
import {
  getStudents,
  deleteStudent,
  type Student,
} from "../../services/studentService";

const Students: React.FC = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // State for filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await getStudents();
      setStudents(data);
    } catch (error) {
      console.error("Failed to load students", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bu öğrenciyi silmek istediğinizden emin misiniz?")) {
      try {
        await deleteStudent(id);
        setStudents((prev) => prev.filter((s) => s.id !== id));
      } catch (error: any) {
        console.error("Failed to delete student", error);
        alert(error.response?.data?.message || "Silme işlemi başarısız oldu.");
      }
    }
  };

  // Derived options for selects
  const classOptions = useMemo(() => {
    const uniqueClasses = Array.from(
      new Set(students.map((s) => s.class_name).filter(Boolean))
    );
    return uniqueClasses.map((c) => ({
      value: c as string,
      label: c as string,
    }));
  }, [students]);

  // Filtering logic
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.includes(searchTerm);
      const matchesClass = classFilter
        ? student.class_name === classFilter
        : true;

      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, classFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setClassFilter("");
  };

  // Pagination logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, classFilter]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStudents, currentPage]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-sm font-bold text-gray-900">Öğrenci Yönetimi</h2>
        <Button
          onClick={() => navigate("add")}
          size="xs"
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Yeni Öğrenci Ekle
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-gray-200 space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="İsim veya Öğrenci No ile ara..."
                icon={<Search />}
                className="w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              variant={showFilters ? "primary" : "secondary"}
              size="xs"
              icon={<Filter className="h-3.5 w-3.5" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtrele
            </Button>
            {(searchTerm || classFilter) && (
              <Button
                variant="ghost"
                size="xs"
                icon={<X className="h-3.5 w-3.5" />}
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Temizle
              </Button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="p-4 bg-gray-50 rounded-md grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <Select
                label="Sınıfa Göre Filtrele"
                options={classOptions}
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                placeholder="Tüm Sınıflar"
              />
            </div>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>Ad Soyad</TableHead>
              <TableHead>Sınıf</TableHead>
              <TableHead>TC No</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : paginatedStudents.length > 0 ? (
              paginatedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.student_id}
                  </TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.class_name || "-"}</TableCell>
                  <TableCell>{student.tc_no || "-"}</TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      actions={[
                        {
                          label: "Düzenle",
                          icon: <Edit2 className="h-3.5 w-3.5" />,
                          onClick: () => navigate(`edit/${student.id}`),
                        },
                        {
                          label: "Sil",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          className: "text-red-600 hover:text-red-700",
                          onClick: () => handleDelete(student.id!),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  Kayıtlı öğrenci bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && filteredStudents.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Toplam{" "}
                  <span className="font-medium">{filteredStudents.length}</span>{" "}
                  kayıttan{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  ile{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredStudents.length
                    )}
                  </span>{" "}
                  arası gösteriliyor
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Önceki</span>
                    <span className="h-5 w-5" aria-hidden="true">
                      ‹
                    </span>
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, i) => {
                      // Simple logic to show first 5 pages or sliding window could be implemented
                      // For now, let's just show pages around current page if many, or just all if few.
                      // To keep it safe and simple as requested:
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                        }
                        if (pageNum > totalPages) return null;
                      }

                      // Better simple logic: just show 1..totalPages if <= 7, else show subset?
                      // Let's stick to a simple mapping of all pages if < 10, else just Previous/Next?
                      // User asked for "next page below".
                      // I will render all page numbers for now assuming < 20 pages (400 students).
                      // If more, it might overflow.
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                            currentPage === pageNum
                              ? "z-10 bg-black text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                              : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                  )}
                  {totalPages > 5 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      ...
                    </span>
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Sonraki</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
