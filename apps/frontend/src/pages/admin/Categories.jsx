import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Tags } from 'lucide-react';
import { categoriesAPI } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Gagal memuat data kategori');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setSelectedCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name });
    setModalOpen(true);
  };

  const openDeleteModal = (category) => {
    setSelectedCategory(category);
    setDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Nama kategori wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      if (selectedCategory) {
        await categoriesAPI.update(selectedCategory.id, formData);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await categoriesAPI.create(formData);
        toast.success('Kategori berhasil ditambahkan');
      }

      setModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    setSubmitting(true);

    try {
      await categoriesAPI.delete(selectedCategory.id);
      toast.success('Kategori berhasil dihapus');
      setDeleteModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-white/35 text-sm font-medium">Kelola kategori menu</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {/* Search */}
      <Card>
        <Card.Body className="py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kategori..."
              className="input pl-10"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shimmer h-[100px]" />
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card>
          <Card.Body className="py-12 text-center">
            <Tags className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30">Tidak ada kategori ditemukan</p>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <Card key={category.id}>
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-primary-500/15 rounded-xl flex items-center justify-center border border-primary-500/10">
                      <Tags className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white/85">{category.name}</h3>
                      <p className="text-xs text-white/25">
                        {formatDate(category.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(category)}
                      className="p-2 text-danger-400 hover:bg-danger-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCategory ? 'Edit Kategori' : 'Tambah Kategori'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nama Kategori"
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            placeholder="Masukkan nama kategori"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {selectedCategory ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Kategori"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-danger-500/15 rounded-full mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-danger-400" />
          </div>
          <p className="text-white/60 mb-2">
            Apakah Anda yakin ingin menghapus kategori{' '}
            <strong className="text-white/90">{selectedCategory?.name}</strong>?
          </p>
          <p className="text-sm text-danger-400 mb-6">
            Semua produk dalam kategori ini akan ikut terhapus!
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={submitting}>
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
