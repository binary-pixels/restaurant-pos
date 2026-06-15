"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Edit2, Trash2, Package, AlertTriangle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createProduct, updateProduct, deleteProduct,
  createCategory, deleteCategory,
  addSpec, addSpecOption, deleteSpec, deleteSpecOption,
} from "@/actions/product-actions";
import { formatCurrency } from "@pos/shared";

type Category = { id: string; name: string; _count: { products: number } };
type Product = { id: string; categoryId: string; category: { name: string }; name: string; price: number; costPrice: number | null; unit: string; stock: number; lowStockAt: number; isActive: boolean; barcode: string | null; specs: { id: string; name: string; type: string; isRequired: boolean; options: { id: string; label: string; priceAdj: number }[] }[] };

type Props = { categories: Category[]; products: Product[]; storeId: string };

export function MenuManager({ categories: initCats, products: initProds, storeId }: Props) {
  const t = useTranslations("products");
  const c = useTranslations("common");
  const router = useRouter();

  const [categories, setCategories] = useState(initCats);
  const [products, setProducts] = useState(initProds);
  const [activeCat, setActiveCat] = useState<string>("all");
  const [search, setSearch] = useState("");

  // Modals
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    categoryId: "", name: "", price: 0, costPrice: 0, unit: "份", stock: 0, lowStockAt: 10, barcode: "", image: "", discountPrice: 0, discountEnd: "",
  });

  // Specs modal
  const [specProduct, setSpecProduct] = useState<Product | null>(null);
  const [newSpec, setNewSpec] = useState({ name: "", type: "SELECT", isRequired: false });
  const [newOption, setNewOption] = useState<Record<string, { label: string; priceAdj: number }>>({});

  const filtered = products.filter((p) => {
    if (activeCat !== "all" && p.categoryId !== activeCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  async function handleCreateProduct() {
    await createProduct({ storeId, ...productForm });
    setShowProductForm(false);
    setProductForm({ categoryId: "", name: "", price: 0, costPrice: 0, unit: "份", stock: 0, lowStockAt: 10, barcode: "", image: "", discountPrice: 0, discountEnd: "" });
    router.refresh();
  }

  async function handleUpdateProduct() {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, productForm);
    setShowProductForm(false);
    setEditingProduct(null);
    router.refresh();
  }

  async function handleDeleteProduct(id: string) {
    await deleteProduct(id);
    setProducts(products.filter((p) => p.id !== id));
    router.refresh();
  }

  async function handleCreateCategory() {
    if (!catName.trim()) return;
    await createCategory({ storeId, name: catName.trim() });
    setCatName("");
    setShowCatForm(false);
    router.refresh();
  }

  async function handleAddSpec() {
    if (!specProduct || !newSpec.name.trim()) return;
    const spec = await addSpec(specProduct.id, newSpec);
    setNewSpec({ name: "", type: "SELECT", isRequired: false });
    router.refresh();
  }

  async function handleAddOption(specId: string) {
    const opt = newOption[specId];
    if (!opt?.label?.trim()) return;
    await addSpecOption(specId, { label: opt.label.trim(), priceAdj: opt.priceAdj || 0 });
    setNewOption({ ...newOption, [specId]: { label: "", priceAdj: 0 } });
    router.refresh();
  }

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setActiveCat("all")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium", activeCat === "all" ? "bg-blue-600 text-white" : "bg-white border")}
        >
          {t("all")} ({products.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium", activeCat === cat.id ? "bg-blue-600 text-white" : "bg-white border")}
          >
            {cat.name} ({cat._count.products})
          </button>
        ))}
        <button onClick={() => setShowCatForm(true)} className="px-3 py-2 rounded-lg text-sm border border-dashed border-gray-300 text-gray-500 hover:border-blue-400">
          <Plus className="w-4 h-4 inline mr-1" />{t("categories")}
        </button>
      </div>

      {/* Search + Add */}
      <div className="flex items-center justify-between mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索菜品..."
          className="w-64 px-3 py-2 border rounded-lg text-sm"
        />
        <button
          onClick={() => { setEditingProduct(null); setProductForm({ categoryId: activeCat !== "all" ? activeCat : categories[0]?.id || "", name: "", price: 0, costPrice: 0, unit: "份", stock: 0, lowStockAt: 10, barcode: "", image: "", discountPrice: 0, discountEnd: "" }); setShowProductForm(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 inline mr-1" />{t("addProduct")}
        </button>
        <label className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 cursor-pointer">
          📄 批量导入
          <input type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch("/api/products/import", { method: "POST", body: fd });
            const data = await res.json();
            alert("导入完成: " + data.success + " 成功, " + data.errors + " 失败");
            router.refresh();
          }} />
        </label>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-gray-500">{t("name")}</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">{t("categories")}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">{t("price")}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">{t("costPrice")}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">{t("stock")}</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">{c("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{product.name}</span>
                    {product.stock <= product.lowStockAt && (
                      <AlertTriangle className="w-4 h-4 text-amber-500"  />
                    )}
                    {!product.isActive && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded cursor-pointer hover:bg-green-100 hover:text-green-600" onClick={async (e) => { e.stopPropagation(); await updateProduct(product.id, { isActive: true }); router.refresh(); }} title="点击重新上架">已下架</span>
                    )}
                  </div>
                  {product.specs.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {product.specs.map((s) => s.name).join(" / ")}
                    </p>
                  )}
                </td>
                <td className="py-3 px-4 text-gray-500">{product.category.name}</td>
                <td className="py-3 px-4 text-right font-medium">{formatCurrency(product.price)}</td>
                <td className="py-3 px-4 text-right text-gray-500">{product.costPrice ? formatCurrency(product.costPrice) : "--"}</td>
                <td className="py-3 px-4 text-right">
                  <span className={cn(product.stock <= product.lowStockAt && "text-red-600 font-medium")}>
                    {product.stock}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => { setEditingProduct(product); setProductForm({ categoryId: product.categoryId, name: product.name, price: product.price, costPrice: product.costPrice || 0, unit: product.unit, stock: product.stock, lowStockAt: product.lowStockAt, barcode: product.barcode || "", image: (product as any).image || "", discountPrice: (product as any).discountPrice || 0, discountEnd: (product as any).discountEnd ? new Date((product as any).discountEnd).toISOString().slice(0, 16) : "" }); setShowProductForm(true); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setSpecProduct(product); }}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                    >
                      <Package className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">暂无菜品</div>
        )}
      </div>

      {/* Category Form Modal */}
      {showCatForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCatForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-sm z-10">
            <h3 className="text-lg font-semibold mb-4">添加分类</h3>
            <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="分类名称" className="w-full px-3 py-2 border rounded-lg mb-4" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCatForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">{c("cancel")}</button>
              <button onClick={handleCreateCategory} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">{c("save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowProductForm(false)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-lg z-10 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">{editingProduct ? "编辑菜品" : "添加菜品"}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("name")}</label>
                <input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("categories")}</label>
                <select value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="">选择分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("image")}</label>
                <input type="file" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  const data = await res.json();
                  if (data.url) setProductForm({ ...productForm, image: data.url });
                }} className="w-full text-sm" />
                {productForm.image && (
                  <img src={productForm.image} className="mt-2 w-20 h-20 object-cover rounded-lg" alt="preview" />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("price")}</label>
                  <input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("costPrice")}</label>
                  <input type="number" step="0.01" value={productForm.costPrice} onChange={(e) => setProductForm({ ...productForm, costPrice: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("unit")}</label>
                  <input value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("stock")}</label>
                  <input type="number" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">特价</label>
                  <input type="number" step="0.01" value={productForm.discountPrice || ""} onChange={(e) => setProductForm({ ...productForm, discountPrice: Number(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg" placeholder="0=无折扣" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">特价截止</label>
                  <input type="datetime-local" value={productForm.discountEnd} onChange={(e) => setProductForm({ ...productForm, discountEnd: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowProductForm(false)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">{c("cancel")}</button>
              <button onClick={editingProduct ? handleUpdateProduct : handleCreateProduct} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">{c("save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Specs Modal */}
      {specProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSpecProduct(null)} />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md z-10 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">规格管理 - {specProduct.name}</h3>

            {specProduct.specs.map((spec) => (
              <div key={spec.id} className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{spec.name}</span>
                  <button onClick={async () => { await deleteSpec(spec.id); router.refresh(); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1">
                  {spec.options.map((opt) => (
                    <div key={opt.id} className="flex items-center justify-between text-sm text-gray-600">
                      <span>{opt.label}{opt.priceAdj > 0 && <span className="text-blue-600 ml-1">+¥{opt.priceAdj}</span>}</span>
                      <button onClick={async () => { await deleteSpecOption(opt.id); router.refresh(); }} className="text-red-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
                {/* Add option */}
                <div className="flex items-center gap-2 mt-2">
                  <input
                    value={newOption[spec.id]?.label || ""}
                    onChange={(e) => setNewOption({ ...newOption, [spec.id]: { ...newOption[spec.id], label: e.target.value } })}
                    placeholder="选项名"
                    className="flex-1 px-2 py-1 text-xs border rounded"
                  />
                  <input
                    type="number" step="0.1"
                    value={newOption[spec.id]?.priceAdj || 0}
                    onChange={(e) => setNewOption({ ...newOption, [spec.id]: { ...newOption[spec.id], priceAdj: Number(e.target.value) } })}
                    placeholder="加价"
                    className="w-16 px-2 py-1 text-xs border rounded"
                  />
                  <button onClick={() => handleAddOption(spec.id)} className="px-2 py-1 text-xs bg-blue-600 text-white rounded">添加</button>
                </div>
              </div>
            ))}

            {/* Add new spec */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-2">添加新规格</h4>
              <div className="flex items-center gap-2">
                <input value={newSpec.name} onChange={(e) => setNewSpec({ ...newSpec, name: e.target.value })} placeholder="规格名（如：辣度、份量）" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                <button onClick={handleAddSpec} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">添加</button>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={() => setSpecProduct(null)} className="px-4 py-2 text-sm bg-gray-100 rounded-lg">{c("close")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
