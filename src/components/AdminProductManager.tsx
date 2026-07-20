"use client";

import React, { useState } from "react";
import {
  upsertCategory,
  deleteCategory,
  upsertProduct,
  deleteProduct,
  upsertVariant,
  deleteVariant,
  bulkUpdateProductStatus,
  bulkDeleteProducts,
} from "@/app/actions/product";
import { getSupplierProductsAction } from "@/app/actions/supplier";
import { useEffect } from "react";
import { Plus, Edit2, Trash2, Settings, FolderOpen, ListPlus, X, CircleAlert, EyeOff, CheckCircle, Search, ArrowUpDown } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import CustomSelect from "./CustomSelect";
import CustomCheckbox from "./CustomCheckbox";
import CustomConfirmModal from "./CustomConfirmModal";
import CustomToast, { ToastMessage } from "./CustomToast";
import EmptyState from "./EmptyState";

interface Category {
  id: number;
  name: string;
  slug: string;
  accentColor: string;
  sortOrder: number;
}

interface Product {
  id: number;
  categoryId: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  iconUrl: string | null;
  badge: "HOT" | "AUTO" | "SMART" | null;
  isActive: boolean;
  sortOrder: number;
}

interface Variant {
  id: number;
  productId: number;
  name: string;
  durationDays: number;
  price: number;
  comparePrice: number | null;
  resellerPrice: number | null;
  deliveryMode: "AUTO_STOCK" | "MANUAL_INVITE" | "PROVIDER_API";
  supplierProductId: string | null;
  warrantyDays: number;
  isActive: boolean;
}

interface AdminProductManagerProps {
  categories: Category[];
  products: Product[];
  variants: Variant[];
}

export default function AdminProductManager({
  categories,
  products,
  variants,
}: AdminProductManagerProps) {
  const [activeTab, setActiveTab] = useState<"produk" | "kategori">("produk");

  // Category State
  const [categoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catAccent, setCatAccent] = useState("emerald");
  const [catSort, setCatSort] = useState(0);

  // Product State
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodCatId, setProdCatId] = useState<number>(categories[0]?.id || 0);
  const [prodName, setProdName] = useState("");
  const [prodSlug, setProdSlug] = useState("");
  const [prodTagline, setProdTagline] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodIcon, setProdIcon] = useState("");
  const [prodBadge, setProdBadge] = useState<"HOT" | "AUTO" | "SMART" | "">("");
  const [prodActive, setProdActive] = useState(true);
  const [prodSort, setProdSort] = useState(0);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [sortBy, setSortBy] = useState<"default" | "status_active" | "status_inactive" | "name_asc" | "name_desc">("default");

  // Filtered & Sorted Products
  const filteredProducts = products
    .filter((prod) => {
      if (categoryFilter !== "all" && prod.categoryId !== categoryFilter) {
        return false;
      }
      if (statusFilter === "active" && !prod.isActive) {
        return false;
      }
      if (statusFilter === "inactive" && prod.isActive) {
        return false;
      }
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const category = categories.find((c) => c.id === prod.categoryId);
        const categoryName = category?.name.toLowerCase() || "";
        return (
          prod.name.toLowerCase().includes(q) ||
          prod.slug.toLowerCase().includes(q) ||
          prod.tagline.toLowerCase().includes(q) ||
          categoryName.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "status_active") {
        if (a.isActive === b.isActive) return a.sortOrder - b.sortOrder;
        return a.isActive ? -1 : 1;
      }
      if (sortBy === "status_inactive") {
        if (a.isActive === b.isActive) return a.sortOrder - b.sortOrder;
        return a.isActive ? 1 : -1;
      }
      if (sortBy === "name_asc") {
        return a.name.localeCompare(b.name);
      }
      if (sortBy === "name_desc") {
        return b.name.localeCompare(a.name);
      }
      return a.sortOrder - b.sortOrder;
    });

  // Bulk Selection State for Products
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  const toggleSelectAllProducts = () => {
    if (selectedProductIds.length === products.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(products.map((p) => p.id));
    }
  };

  const toggleSelectProduct = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pid) => pid !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Custom Confirm & Toast State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant?: "danger" | "warning" | "info";
    onConfirm: () => void;
  } | null>(null);

  const [toast, setToast] = useState<ToastMessage | null>(null);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    setToast({ id: Date.now().toString(), type, text });
  };

  const handleBulkStatusChange = (isActive: boolean) => {
    if (selectedProductIds.length === 0) return;
    const statusLabel = isActive ? "mengaktifkan" : "menonaktifkan";

    setConfirmModal({
      isOpen: true,
      title: `Konfirmasi ${statusLabel.toUpperCase()} Produk`,
      message: `Apakah Anda yakin ingin ${statusLabel} ${selectedProductIds.length} produk terpilih?`,
      variant: isActive ? "info" : "warning",
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        const res = await bulkUpdateProductStatus(selectedProductIds, isActive);
        setLoading(false);

        if (res.success) {
          setSelectedProductIds([]);
          showToast("success", `Berhasil ${statusLabel} ${selectedProductIds.length} produk!`);
        } else {
          showToast("error", res.error || "Gagal memproses status.");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedProductIds.length === 0) return;

    setConfirmModal({
      isOpen: true,
      title: "Hapus Massal Produk",
      message: `PERINGATAN: Apakah Anda yakin ingin MENGHAPUS ${selectedProductIds.length} produk terpilih? Seluruh paket varian produk ini juga akan terhapus secara permanen.`,
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        setLoading(true);
        const res = await bulkDeleteProducts(selectedProductIds);
        setLoading(false);

        if (res.success) {
          setSelectedProductIds([]);
          showToast("success", `Berhasil menghapus ${selectedProductIds.length} produk!`);
        } else {
          showToast("error", res.error || "Gagal menghapus produk terpilih.");
        }
      },
    });
  };

  // Variant State (Modal linked to selected product)
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [variantFormOpen, setVariantFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [varName, setVarName] = useState("");
  const [varDuration, setVarDuration] = useState(30);
  const [varPrice, setVarPrice] = useState(0);
  const [varCompare, setVarCompare] = useState("");
  const [varReseller, setVarReseller] = useState("");
  const [varMode, setVarMode] = useState<"AUTO_STOCK" | "MANUAL_INVITE" | "PROVIDER_API">("AUTO_STOCK");
  const [varSupplierProductId, setVarSupplierProductId] = useState("");
  const [varWarranty, setVarWarranty] = useState(30);
  const [varActive, setVarActive] = useState(true);

  // Supplier products local states
  const [supplierProducts, setSupplierProducts] = useState<any[]>([]);
  const [supplierProductsLoading, setSupplierProductsLoading] = useState(false);

  useEffect(() => {
    if (varMode === "PROVIDER_API" && supplierProducts.length === 0) {
      loadSupplierProducts();
    }
  }, [varMode]);

  const loadSupplierProducts = async () => {
    setSupplierProductsLoading(true);
    try {
      const res = await getSupplierProductsAction();
      if (res.success && res.products) {
        setSupplierProducts(res.products);
      }
    } catch (err) {
      console.error("Gagal mengambil produk supplier:", err);
    } finally {
      setSupplierProductsLoading(false);
    }
  };

  // General Loading & Error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helpers to prepare forms
  const openCategoryCreate = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatAccent("emerald");
    setCatSort(0);
    setError(null);
    setCategoryFormOpen(true);
  };

  const openCategoryEdit = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatAccent(cat.accentColor);
    setCatSort(cat.sortOrder);
    setError(null);
    setCategoryFormOpen(true);
  };

  const openProductCreate = () => {
    setEditingProduct(null);
    setProdCatId(categories[0]?.id || 0);
    setProdName("");
    setProdSlug("");
    setProdTagline("");
    setProdDesc("");
    setProdIcon("");
    setProdBadge("");
    setProdActive(true);
    setProdSort(0);
    setError(null);
    setProductFormOpen(true);
  };

  const openProductEdit = (prod: Product) => {
    setEditingProduct(prod);
    setProdCatId(prod.categoryId);
    setProdName(prod.name);
    setProdSlug(prod.slug);
    setProdTagline(prod.tagline);
    setProdDesc(prod.description);
    setProdIcon(prod.iconUrl || "");
    setProdBadge(prod.badge || "");
    setProdActive(prod.isActive);
    setProdSort(prod.sortOrder);
    setError(null);
    setProductFormOpen(true);
  };

  const openVariantCreate = () => {
    setEditingVariant(null);
    setVarName("");
    setVarDuration(30);
    setVarPrice(0);
    setVarCompare("");
    setVarReseller("");
    setVarMode("AUTO_STOCK");
    setVarSupplierProductId("");
    setVarWarranty(30);
    setVarActive(true);
    setError(null);
    setVariantFormOpen(true);
  };

  const openVariantEdit = (v: Variant) => {
    setEditingVariant(v);
    setVarName(v.name);
    setVarDuration(v.durationDays);
    setVarPrice(v.price);
    setVarCompare(v.comparePrice ? v.comparePrice.toString() : "");
    setVarReseller(v.resellerPrice ? v.resellerPrice.toString() : "");
    setVarMode(v.deliveryMode);
    setVarSupplierProductId(v.supplierProductId || "");
    setVarWarranty(v.warrantyDays);
    setVarActive(v.isActive);
    setError(null);
    setVariantFormOpen(true);
  };

  // Submit functions
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await upsertCategory({
      id: editingCategory?.id,
      name: catName,
      slug: catSlug,
      accentColor: catAccent,
      sortOrder: catSort,
    });

    setLoading(false);
    if (res.success) {
      setCategoryFormOpen(false);
    } else {
      setError(res.error || "Gagal memproses kategori.");
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await upsertProduct({
      id: editingProduct?.id,
      categoryId: prodCatId,
      name: prodName,
      slug: prodSlug,
      tagline: prodTagline,
      description: prodDesc,
      iconUrl: prodIcon || null,
      badge: (prodBadge || null) as any,
      isActive: prodActive,
      sortOrder: prodSort,
    });

    setLoading(false);
    if (res.success) {
      setProductFormOpen(false);
    } else {
      setError(res.error || "Gagal memproses produk.");
    }
  };

  const handleVariantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForVariants) return;
    setLoading(true);
    setError(null);

    const res = await upsertVariant({
      id: editingVariant?.id,
      productId: selectedProductForVariants.id,
      name: varName,
      durationDays: varDuration,
      price: varPrice,
      comparePrice: varCompare ? parseInt(varCompare) : null,
      resellerPrice: varReseller ? parseInt(varReseller) : null,
      deliveryMode: varMode,
      supplierProductId: varMode === "PROVIDER_API" ? varSupplierProductId : null,
      warrantyDays: varWarranty,
      isActive: varActive,
    });

    setLoading(false);
    if (res.success) {
      setVariantFormOpen(false);
      // Re-fetch or sync state: Selected product variants list updates automatically
    } else {
      setError(res.error || "Gagal memproses varian.");
    }
  };

  // Delete handlers
  const handleCategoryDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kategori",
      message: "Apakah Anda yakin ingin menghapus kategori ini? Semua produk di dalamnya akan ikut terhapus.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await deleteCategory(id);
        if (res.success) {
          showToast("success", "Kategori berhasil dihapus.");
        } else {
          showToast("error", res.error || "Gagal menghapus kategori.");
        }
      },
    });
  };

  const handleProductDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Produk",
      message: "Apakah Anda yakin ingin menghapus produk ini? Semua varian dan data terkait akan ikut terhapus.",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await deleteProduct(id);
        if (res.success) {
          showToast("success", "Produk berhasil dihapus.");
        } else {
          showToast("error", res.error || "Gagal menghapus produk.");
        }
      },
    });
  };

  const handleVariantDelete = (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Varian",
      message: "Apakah Anda yakin ingin menghapus varian produk ini?",
      variant: "danger",
      onConfirm: async () => {
        setConfirmModal(null);
        const res = await deleteVariant(id);
        if (res.success) {
          showToast("success", "Varian berhasil dihapus.");
        } else {
          showToast("error", res.error || "Gagal menghapus varian.");
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Layout Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Kelola Layanan Toko
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Tambah, ubah, dan hapus kategori, produk premium, serta varian paket harga.
          </p>
        </div>

        {/* Tab selector */}
        <div className="inline-flex rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-1">
          <button
            onClick={() => setActiveTab("produk")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "produk"
                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Daftar Produk
          </button>
          <button
            onClick={() => setActiveTab("kategori")}
            className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
              activeTab === "kategori"
                ? "bg-emerald-600 text-white dark:bg-emerald-500 dark:text-zinc-950 shadow-sm"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Daftar Kategori
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: PRODUCT LIST & VARIANTS MANAGER */}
      {/* ---------------------------------------------------- */}
      {activeTab === "produk" && !selectedProductForVariants && (
        <div className="space-y-4">
            {/* Search & Category Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Cari nama produk, slug, tagline..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Category, Status & Sort Filter Dropdowns */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                {/* Category Dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                  className="py-2 px-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="all">Semua Kategori ({products.length})</option>
                  {categories.map((cat) => {
                    const count = products.filter((p) => p.categoryId === cat.id).length;
                    return (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Status Filter Dropdown */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="py-2 px-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Hanya Aktif</option>
                  <option value="inactive">Hanya Non-Aktif</option>
                </select>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-2 px-3 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors cursor-pointer"
                >
                  <option value="default">Urutan Default</option>
                  <option value="status_active">Status: Aktif Pertama</option>
                  <option value="status_inactive">Status: Non-Aktif Pertama</option>
                  <option value="name_asc">Nama: A - Z</option>
                  <option value="name_desc">Nama: Z - A</option>
                </select>

                <button
                  onClick={openProductCreate}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm whitespace-nowrap ml-auto sm:ml-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Produk Baru</span>
                </button>
              </div>
            </div>

            {/* Bulk Selection Bar & Meta Info */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {selectedProductIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 p-2 px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 dark:bg-emerald-950/40 text-xs font-bold text-emerald-900 dark:text-emerald-200 animate-in fade-in duration-200">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-mono font-extrabold text-[11px]">
                    {selectedProductIds.length} Produk Dipilih
                  </span>

                  <button
                    onClick={() => handleBulkStatusChange(true)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Aktifkan Semua</span>
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange(false)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition-colors"
                  >
                    <EyeOff className="h-3.5 w-3.5" />
                    <span>Nonaktifkan Semua</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Terpilih</span>
                  </button>
                  <button
                    onClick={() => setSelectedProductIds([])}
                    className="px-3 py-1 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-bold"
                  >
                    Batal Pilih
                  </button>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  Menampilkan <span className="font-bold text-zinc-900 dark:text-zinc-100">{filteredProducts.length}</span> dari {products.length} produk.
                </div>
              )}
            </div>

            {/* Product list table */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                      <th className="px-3.5 py-3 w-10 text-center">
                        <div className="flex justify-center">
                          <CustomCheckbox
                            checked={filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length}
                            onChange={() => {
                              if (selectedProductIds.length === filteredProducts.length) {
                                setSelectedProductIds([]);
                              } else {
                                setSelectedProductIds(filteredProducts.map((p) => p.id));
                              }
                            }}
                            title="Pilih Semua Produk Terfilter"
                          />
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc")}
                        className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Klik untuk mengurutkan berdasarkan nama"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Produk</span>
                          <ArrowUpDown className="h-3 w-3 opacity-70" />
                        </div>
                      </th>
                      <th className="px-4 py-3 font-semibold">Kategori</th>
                      <th className="px-4 py-3 font-semibold">Badge</th>
                      <th
                        onClick={() => setSortBy(sortBy === "status_active" ? "status_inactive" : "status_active")}
                        className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Klik untuk mengurutkan berdasarkan status"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Status</span>
                          <ArrowUpDown className="h-3 w-3 opacity-70" />
                        </div>
                      </th>
                      <th
                        onClick={() => setSortBy("default")}
                        className="px-4 py-3 font-semibold cursor-pointer select-none hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                        title="Klik untuk mereset urutan ke default"
                      >
                        <div className="inline-flex items-center gap-1">
                          <span>Urutan</span>
                          <ArrowUpDown className="h-3 w-3 opacity-70" />
                        </div>
                      </th>
                      <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                          {searchQuery || categoryFilter !== "all"
                            ? `Tidak ada produk yang cocok dengan pencarian "${searchQuery}" atau filter terpilih.`
                            : `Belum ada data produk. Silakan tambahkan.`}
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((prod) => {
                      const category = categories.find((c) => c.id === prod.categoryId);
                      const prodVariants = variants.filter((v) => v.productId === prod.id);
                      const isSelected = selectedProductIds.includes(prod.id);

                      return (
                        <tr
                          key={prod.id}
                          className={`transition-colors ${
                            isSelected
                              ? "bg-emerald-50/60 dark:bg-emerald-950/20"
                              : "hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10"
                          }`}
                        >
                          <td className="px-3.5 py-3.5 text-center">
                            <div className="flex justify-center">
                              <CustomCheckbox
                                checked={isSelected}
                                onChange={() => toggleSelectProduct(prod.id)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{prod.name}</div>
                            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{prod.slug}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                              {category?.name || "Tanpa Kategori"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            {prod.badge ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                                {prod.badge}
                              </span>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-600">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                prod.isActive
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50"
                              }`}
                            >
                              {prod.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-zinc-500 font-mono">{prod.sortOrder}</td>
                          <td className="px-4 py-3.5 text-right space-x-2">
                            <button
                              onClick={() => setSelectedProductForVariants(prod)}
                              className="inline-flex h-8 items-center justify-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                              <Settings className="h-3.5 w-3.5" />
                              <span>Paket ({prodVariants.length})</span>
                            </button>
                            <button
                              onClick={() => openProductEdit(prod)}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              aria-label="Ubah produk"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleProductDelete(prod.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              aria-label="Hapus produk"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SUB-TAB: VARIANTS MANAGER FOR SELECTED PRODUCT */}
      {/* ---------------------------------------------------- */}
      {activeTab === "produk" && selectedProductForVariants && (
        <div className="space-y-4">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedProductForVariants(null)}
                className="text-xs font-bold text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-500 flex items-center gap-1.5 px-3 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                Kembali ke Produk
              </button>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
                Paket Layanan: {selectedProductForVariants.name}
              </h2>
            </div>

            <button
              onClick={openVariantCreate}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Varian Paket</span>
            </button>
          </div>

          {/* Variants List Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 font-semibold">Nama Paket</th>
                    <th className="px-4 py-3 font-semibold">Durasi</th>
                    <th className="px-4 py-3 font-semibold text-right">Harga</th>
                    <th className="px-4 py-3 font-semibold">Pengiriman</th>
                    <th className="px-4 py-3 font-semibold">Garansi</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {variants.filter((v) => v.productId === selectedProductForVariants.id).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                        Belum ada varian paket harga untuk produk ini.
                      </td>
                    </tr>
                  ) : (
                    variants
                      .filter((v) => v.productId === selectedProductForVariants.id)
                      .map((v) => (
                        <tr key={v.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10">
                          <td className="px-4 py-3.5 font-bold text-zinc-900 dark:text-zinc-100">
                            {v.name}
                          </td>
                          <td className="px-4 py-3.5 font-medium">{v.durationDays} Hari</td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            <div className="flex flex-col items-end font-mono">
                              <span>{formatRupiah(v.price)}</span>
                              {v.comparePrice && (
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 line-through font-normal">
                                  {formatRupiah(v.comparePrice)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                v.deliveryMode === "AUTO_STOCK"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                                  : v.deliveryMode === "PROVIDER_API"
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200/50"
                                  : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50"
                              }`}
                            >
                              {v.deliveryMode === "AUTO_STOCK"
                                ? "Otomatis"
                                : v.deliveryMode === "PROVIDER_API"
                                ? "API Supplier"
                                : "Manual Invite"}
                            </span>
                            {v.deliveryMode === "PROVIDER_API" && v.supplierProductId && (
                              <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                                ID: {v.supplierProductId}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">{v.warrantyDays} Hari</td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                v.isActive
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200/50"
                                  : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/50"
                              }`}
                            >
                              {v.isActive ? "Aktif" : "Non-Aktif"}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => openVariantEdit(v)}
                              className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              aria-label="Ubah varian"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleVariantDelete(v.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                              aria-label="Hapus varian"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: CATEGORIES LIST */}
      {/* ---------------------------------------------------- */}
      {activeTab === "kategori" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={openCategoryCreate}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-950 dark:hover:bg-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Kategori Baru</span>
            </button>
          </div>

          {/* Categories List Table */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-zinc-400 dark:text-zinc-500 uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3 font-semibold">Nama Kategori</th>
                    <th className="px-4 py-3 font-semibold">Aksen Warna</th>
                    <th className="px-4 py-3 font-semibold">Urutan</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-400 dark:text-zinc-500">
                        Belum ada data kategori. Silakan tambahkan.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-850/10">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">{cat.name}</div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{cat.slug}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              cat.accentColor === "emerald"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : cat.accentColor === "amber"
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : cat.accentColor === "rose"
                                ? "bg-rose-50 text-rose-600 border-rose-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                cat.accentColor === "emerald"
                                  ? "bg-emerald-500"
                                  : cat.accentColor === "amber"
                                  ? "bg-amber-500"
                                  : cat.accentColor === "rose"
                                  ? "bg-rose-500"
                                  : "bg-blue-500"
                              }`}
                            />
                            {cat.accentColor}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-500 font-mono">{cat.sortOrder}</td>
                        <td className="px-4 py-3.5 text-right space-x-2">
                          <button
                            onClick={() => openCategoryEdit(cat)}
                            className="p-1.5 text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            aria-label="Ubah kategori"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCategoryDelete(cat.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                            aria-label="Hapus kategori"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL / FORM OVERLAY FOR CATEGORY CREATE/EDIT */}
      {/* ---------------------------------------------------- */}
      {categoryFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                {editingCategory ? "Ubah Kategori" : "Tambah Kategori"}
              </h3>
              <button
                onClick={() => setCategoryFormOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {/* Category Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nama Kategori</label>
                <input
                  type="text"
                  placeholder="Contoh: Streaming & Media"
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingCategory) {
                      setCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">URL Slug</label>
                <input
                  type="text"
                  placeholder="Contoh: streaming-media"
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Accent Color */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Warna Aksen</label>
                <CustomSelect
                  options={[
                    { value: "emerald", label: "Emerald (Green)" },
                    { value: "amber", label: "Amber (Yellow)" },
                    { value: "rose", label: "Rose (Red)" },
                    { value: "blue", label: "Blue" },
                  ]}
                  value={catAccent}
                  onChange={(val) => setCatAccent(val)}
                />
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Urutan Tampil (Sort Order)</label>
                <input
                  type="number"
                  value={catSort}
                  onChange={(e) => setCatSort(parseInt(e.target.value) || 0)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <CircleAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCategoryFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL / FORM OVERLAY FOR PRODUCT CREATE/EDIT */}
      {/* ---------------------------------------------------- */}
      {productFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                {editingProduct ? "Ubah Produk" : "Tambah Produk"}
              </h3>
              <button
                onClick={() => setProductFormOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              {/* Product Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Kategori</label>
                <CustomSelect
                  options={categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  }))}
                  value={prodCatId}
                  onChange={(val) => setProdCatId(Number(val))}
                />
              </div>

              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nama Produk</label>
                <input
                  type="text"
                  placeholder="Contoh: Netflix 4K Premium"
                  value={prodName}
                  onChange={(e) => {
                    setProdName(e.target.value);
                    if (!editingProduct) {
                      setProdSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }
                  }}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Product Slug */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">URL Slug</label>
                <input
                  type="text"
                  placeholder="Contoh: netflix-4k"
                  value={prodSlug}
                  onChange={(e) => setProdSlug(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Tagline */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Tagline Singkat (Pill)</label>
                <input
                  type="text"
                  placeholder="Contoh: Stream 4K, Tanpa Iklan"
                  value={prodTagline}
                  onChange={(e) => setProdTagline(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Deskripsi Lengkap</label>
                <textarea
                  placeholder="Tulis deskripsi detail produk..."
                  value={prodDesc}
                  onChange={(e) => setProdDesc(e.target.value)}
                  required
                  rows={3}
                  className="w-full text-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Icon URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Icon Image URL (Kosongkan untuk initial icon)</label>
                <input
                  type="text"
                  placeholder="https://example.com/logo.png"
                  value={prodIcon}
                  onChange={(e) => setProdIcon(e.target.value)}
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Badge & Active & Sort Order in 3 columns */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Badge</label>
                  <CustomSelect
                    options={[
                      { value: "", label: "None" },
                      { value: "HOT", label: "HOT" },
                      { value: "AUTO", label: "AUTO" },
                      { value: "SMART", label: "SMART" },
                    ]}
                    value={prodBadge}
                    onChange={(val) => setProdBadge(val)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Urutan (Sort)</label>
                  <input
                    type="number"
                    value={prodSort}
                    onChange={(e) => setProdSort(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Status</label>
                  <CustomSelect
                    options={[
                      { value: "true", label: "Aktif" },
                      { value: "false", label: "Non-Aktif" },
                    ]}
                    value={prodActive ? "true" : "false"}
                    onChange={(val) => setProdActive(val === "true")}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <CircleAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setProductFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL / FORM OVERLAY FOR VARIANT CREATE/EDIT */}
      {/* ---------------------------------------------------- */}
      {variantFormOpen && selectedProductForVariants && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-6 space-y-4 shadow-lg overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                {editingVariant ? "Ubah Varian Paket" : "Tambah Varian Paket"}
              </h3>
              <button
                onClick={() => setVariantFormOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleVariantSubmit} className="space-y-4">
              {/* Variant Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Nama Paket Varian</label>
                <input
                  type="text"
                  placeholder="Contoh: 1 Bulan Shared atau 3 Bulan Private"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  required
                  className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Price Fields (Price, Compare Price, Reseller Price) in 3 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Harga (Rupiah)</label>
                  <input
                    type="number"
                    value={varPrice || ""}
                    onChange={(e) => setVarPrice(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Harga Coret (Compare)</label>
                  <input
                    type="number"
                    value={varCompare}
                    onChange={(e) => setVarCompare(e.target.value)}
                    placeholder="Opsional"
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Harga Reseller</label>
                  <input
                    type="number"
                    value={varReseller}
                    onChange={(e) => setVarReseller(e.target.value)}
                    placeholder="Opsional"
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Duration, Delivery Mode, Warranty, and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Durasi Aktif (Hari)</label>
                  <input
                    type="number"
                    value={varDuration}
                    onChange={(e) => setVarDuration(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Garansi (Hari)</label>
                  <input
                    type="number"
                    value={varWarranty}
                    onChange={(e) => setVarWarranty(parseInt(e.target.value) || 0)}
                    required
                    className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Metode Pengiriman</label>
                  <CustomSelect
                    options={[
                      { value: "AUTO_STOCK", label: "Kirim Otomatis (AUTO STOCK)", sublabel: "Stok akun otomatis terkirim dari DB" },
                      { value: "MANUAL_INVITE", label: "Proses Manual Admin (MANUAL INVITE)", sublabel: "Stok dikirim/di-invite manual oleh admin" },
                      { value: "PROVIDER_API", label: "Kirim Otomatis via API Supplier (PROVIDER API)", sublabel: "Order dikirim otomatis via API Reseller" },
                    ]}
                    value={varMode}
                    onChange={(val) => setVarMode(val as any)}
                  />
                </div>

                {varMode === "PROVIDER_API" && (
                  <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl sm:col-span-2">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Produk dari API Supplier</label>
                    {supplierProductsLoading ? (
                      <div className="text-xs text-zinc-400 py-2">Loading produk supplier...</div>
                    ) : supplierProducts.length > 0 ? (
                      <div className="space-y-2">
                        <CustomSelect
                          options={[
                            { value: "", label: "-- Pilih Produk Supplier --" },
                            ...supplierProducts.map((p) => ({
                              value: p.id,
                              label: `${p.name} - $${p.price.toFixed(2)}`,
                              sublabel: p.inStock ? "Stok Ready" : "Stok Habis",
                            })),
                          ]}
                          value={varSupplierProductId || ""}
                          onChange={(val) => setVarSupplierProductId(val)}
                        />
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 pl-2 leading-relaxed">
                          Pilih produk di atas untuk menghubungkan varian ini dengan supplier secara otomatis.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Masukkan ID Produk Supplier secara manual (cth: 64abc...)"
                          value={varSupplierProductId}
                          onChange={(e) => setVarSupplierProductId(e.target.value)}
                          required
                          className="w-full text-sm rounded-full border border-zinc-200 dark:border-zinc-800 bg-transparent px-4 py-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                        <p className="text-[10px] text-rose-500 font-semibold pl-2 leading-relaxed">
                          API Key belum dikonfigurasi atau produk gagal dimuat. Masukkan ID Produk Supplier secara manual di atas.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Status</label>
                  <CustomSelect
                    options={[
                      { value: "true", label: "Aktif" },
                      { value: "false", label: "Non-Aktif" },
                    ]}
                    value={varActive ? "true" : "false"}
                    onChange={(val) => setVarActive(val === "true")}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <CircleAlert className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setVariantFormOpen(false)}
                  className="px-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-full bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 dark:bg-emerald-500 dark:text-zinc-955"
                >
                  {loading ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirm Modal & Toast */}
      {confirmModal && (
        <CustomConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}
      <CustomToast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
