import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions,
} from "../../components/UIComponents";
import {
  getClasses,
  deleteClass,
  type Class,
} from "../../services/classService";

const Classes: React.FC = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await getClasses();
      setClasses(data);
    } catch (error) {
      console.error("Failed to load classes", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bu sınıfı silmek istediğinizden emin misiniz?")) {
      try {
        await deleteClass(id);
        setClasses((prev) => prev.filter((c) => c.id !== id));
      } catch (error: any) {
        console.error("Failed to delete class", error);
        alert(error.response?.data?.message || "Silme işlemi başarısız oldu.");
      }
    }
  };

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        cls.name.toLowerCase().includes(searchLower) ||
        (cls.grade_level && cls.grade_level.toString().includes(searchLower)) ||
        (cls.branch && cls.branch.toLowerCase().includes(searchLower)) ||
        (cls.first_name &&
          cls.first_name.toLowerCase().includes(searchLower)) ||
        (cls.last_name && cls.last_name.toLowerCase().includes(searchLower))
      );
    });
  }, [classes, searchTerm]);

  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClasses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClasses, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-sm font-bold text-gray-900">Sınıflar ve Şubeler</h2>
        <Button
          onClick={() => navigate("add")}
          size="xs"
          icon={<Plus className="h-3.5 w-3.5" />}
        >
          Yeni Sınıf Oluştur
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-gray-200 flex gap-3">
          <div className="relative flex-1 max-w-xs">
            <Input
              placeholder="Sınıf ara..."
              icon={<Search />}
              className="w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="xs"
              icon={<X className="h-3.5 w-3.5" />}
              onClick={() => setSearchTerm("")}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Temizle
            </Button>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sınıf Adı</TableHead>
              <TableHead>Seviye</TableHead>
              <TableHead>Alan</TableHead>
              <TableHead>Kapasite</TableHead>
              <TableHead>Sınıf Öğretmeni</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : paginatedClasses.length > 0 ? (
              paginatedClasses.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {cls.name.substring(0, 2)}
                      </div>
                      {cls.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {cls.grade_level ? `${cls.grade_level}. Sınıf` : "-"}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {cls.branch || "-"}
                    </span>
                  </TableCell>
                  <TableCell>{cls.capacity}</TableCell>
                  <TableCell>
                    {cls.first_name && cls.last_name
                      ? `${cls.first_name} ${cls.last_name}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <TableActions
                      actions={[
                        {
                          label: "Düzenle",
                          icon: <Edit2 className="h-3.5 w-3.5" />,
                          onClick: () => navigate(`edit/${cls.id}`),
                        },
                        {
                          label: "Sil",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          className: "text-red-600 hover:text-red-700",
                          onClick: () => handleDelete(cls.id!),
                        },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Kayıtlı sınıf bulunamadı.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {!loading && filteredClasses.length > 0 && (
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
                  <span className="font-medium">{filteredClasses.length}</span>{" "}
                  kayıttan{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  ile{" "}
                  <span className="font-medium">
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredClasses.length
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
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }).map(
                    (_, i) => {
                      let pageNum = i + 1;
                      if (totalPages > 5) {
                        if (currentPage > 3) {
                          pageNum = currentPage - 2 + i;
                        }
                        if (pageNum > totalPages) return null;
                      }

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

export default Classes;
