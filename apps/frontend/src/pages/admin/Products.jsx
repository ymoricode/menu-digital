import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, ChefHat, X } from 'lucide-react';
import { foodsAPI, categoriesAPI, getImageUrl } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input, { Textarea, Select } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoriesId: '',
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        foodsAPI.getAll(),
        categoriesAPI.getAll(),
      ]);
      setProducts(productsRes.data.data || []);
      setCategories(categoriesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      categoriesId: '',
      image: null,
    });
    setImagePreview(null);
    setSelectedProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoriesId: product.categoriesId?.toString() || '',
      image: null,
    });
    setImagePreview(getImageUrl(product.image));
    setModalOpen(true);
  };

  const openDeleteModal = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price) {
      toast.error('Nama dan harga wajib diisi');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        categoriesId: formData.categoriesId || null,
        image: formData.image,
      };

      if (selectedProduct) {
        await foodsAPI.update(selectedProduct.id, data);
        toast.success('Produk berhasil diperbarui');
      } else {
        await foodsAPI.create(data);
        toast.success('Produk berhasil ditambahkan');
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Gagal menyimpan produk');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    setSubmitting(true);

    try {
      await foodsAPI.delete(selectedProduct.id);
      toast.success('Produk berhasil dihapus');
      setDeleteModalOpen(false);
      setSelectedProduct(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus produk');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  const categoryOptions = categories.map((cat) => ({
    value: cat.id.toString(),
    label: cat.name,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-white/35 text-sm font-medium">Kelola menu makanan dan minuman</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Produk
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
              placeholder="Cari produk..."
              className="input pl-10"
            />
          </div>
        </Card.Body>
      </Card>

      {/* Products Table */}
      <Card>
        <div className="overflow-x-auto scrollbar-dark">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Harga
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-white/40 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4" colSpan={4}>
                      <div className="shimmer h-12" />
                    </td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-white/30" colSpan={4}>
                    Tidak ada produk ditemukan
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-white/[0.06] rounded-xl flex-shrink-0 overflow-hidden border border-white/[0.06]">
                          {product.image ? (
                            <img
                              src={getImageUrl(product.image)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ChefHat className="w-5 h-5 text-white/15" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="font-semibold text-white/85">{product.name}</p>
                          <p className="text-xs text-white/30 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {product.categoryName ? (
                        <span className="px-2.5 py-1 bg-primary-500/10 text-primary-400 text-xs font-semibold rounded-lg border border-primary-500/15">
                          {product.categoryName}
                        </span>
                      ) : (
                        <span className="text-white/20">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white/80">
                      {formatPrice(product.price)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-2 text-accent-400 hover:bg-accent-400/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(product)}
                          className="p-2 text-danger-400 hover:bg-danger-400/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedProduct ? 'Edit Produk' : 'Tambah Produk'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="label">Gambar Produk</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-white/[0.06] rounded-xl overflow-hidden flex-shrink-0 border border-white/[0.08]">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ChefHat className="w-10 h-10 text-white/10" />
                  </div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="btn-outline px-4 py-2.5 text-sm rounded-xl cursor-pointer inline-block"
                >
                  Pilih Gambar
                </label>
                <p className="text-xs text-white/25 mt-1.5">PNG, JPG max 5MB</p>
              </div>
            </div>
          </div>

          <Input
            label="Nama Produk"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Masukkan nama produk"
            required
          />

          <Textarea
            label="Deskripsi"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Masukkan deskripsi produk"
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Harga"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0"
              required
            />

            <Select
              label="Kategori"
              value={formData.categoriesId}
              onChange={(e) => setFormData({ ...formData, categoriesId: e.target.value })}
              options={categoryOptions}
              placeholder="Pilih kategori"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {selectedProduct ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Hapus Produk"
        size="sm"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-danger-500/15 rounded-full mx-auto flex items-center justify-center mb-4">
            <Trash2 className="w-8 h-8 text-danger-400" />
          </div>
          <p className="text-white/60 mb-6">
            Apakah Anda yakin ingin menghapus produk{' '}
            <strong className="text-white/90">{selectedProduct?.name}</strong>?
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

export default Products;
