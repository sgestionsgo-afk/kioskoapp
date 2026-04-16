"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  isWeighable: boolean;
  pricePerKg?: number;
  price?: number;
  stock: number;
  description?: string;
  taxId?: number;
  tax?: { id: number; name: string; percentage: number };
};

type Tax = {
  id: number;
  name: string;
  percentage: number;
  type: string;
  active: boolean;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingStock, setEditingStock] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    isWeighable: false,
    pricePerKg: 0,
    price: 0,
    stock: 0,
    description: "",
    taxId: null as number | null,
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchTaxes();
  }, []);

  const fetchTaxes = async () => {
    try {
      const res = await fetch("http://localhost:3001/settings/taxes");
      if (!res.ok) throw new Error("Error fetching taxes");
      const data = await res.json();
      setTaxes(data.filter((tax: Tax) => tax.type === 'IVA'));
    } catch (error) {
      console.error("Error loading taxes:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3001/products");
      if (!res.ok) throw new Error("Error fetching products");
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al cargar productos");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const startEditStock = (product: Product) => {
    setEditingId(product.id);
    setEditingStock(product.stock.toString());
    setShowModal(true);
  };

  const saveStock = async () => {
    if (!editingId) return;

    const stock = parseInt(editingStock);
    if (isNaN(stock) || stock < 0) {
      setMessage("❌ Ingresa un valor válido");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    try {
      const res = await fetch(`http://localhost:3001/products/${editingId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
      });

      if (!res.ok) throw new Error("Error updating stock");
      setMessage("✅ Stock actualizado");
      setTimeout(() => setMessage(""), 2000);
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al actualizar stock");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const addProduct = async () => {
    if (!newProduct.name.trim()) {
      setMessage("❌ Ingresa un nombre de producto");
      setTimeout(() => setMessage(""), 2000);
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProduct.name,
          isWeighable: newProduct.isWeighable,
          pricePerKg: newProduct.isWeighable ? newProduct.pricePerKg : undefined,
          price: !newProduct.isWeighable ? newProduct.price : undefined,
          stock: newProduct.stock,
          description: newProduct.description,
          taxId: newProduct.taxId,
        }),
      });

      if (!res.ok) throw new Error("Error adding product");
      setMessage("✅ Producto agregado");
      setTimeout(() => setMessage(""), 2000);
      setShowAddModal(false);
      setNewProduct({
        name: "",
        isWeighable: false,
        pricePerKg: 0,
        price: 0,
        stock: 0,
        description: "",
      });
      fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al agregar producto");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este producto?")) return;

    try {
      const res = await fetch(`http://localhost:3001/products/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error deleting product");
      setMessage("✅ Producto eliminado");
      setTimeout(() => setMessage(""), 2000);
      fetchProducts();
    } catch (error) {
      console.error(error);
      setMessage("❌ Error al eliminar producto");
      setTimeout(() => setMessage(""), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="text-center">Cargando inventario...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📦 Inventario</h1>
          <div className="flex gap-4">
            <Link href="/">
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition">
                ← Volver a POS
              </button>
            </Link>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
            >
              ➕ Agregar Artículo
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-center text-white ${
              message.includes("✅") ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {message}
          </div>
        )}

        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {products.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay productos. Agregá uno para comenzar.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Producto</th>
                  <th className="px-6 py-4 text-left">Tipo</th>
                  <th className="px-6 py-4 text-left">Precio</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products
                  .filter((product) =>
                    product.name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((product, idx) => (
                  <tr
                    key={product.id}
                    className={`border-b-2 border-gray-200 ${
                      idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {product.name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {product.isWeighable ? (
                        <span className="inline-block bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                          ⚖️ Pesable
                        </span>
                      ) : (
                        <span className="inline-block bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          📦 Fijo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {product.isWeighable && product.pricePerKg ? (
                        <div>
                          <div className="font-semibold">${product.pricePerKg}/kg</div>
                          {product.tax && (
                            <div className="text-xs text-gray-500">
                              IVA {product.tax.percentage}% (incluido)
                            </div>
                          )}
                        </div>
                      ) : !product.isWeighable && product.price ? (
                        <div>
                          <div className="font-semibold">${product.price}</div>
                          {product.tax && (
                            <div className="text-xs text-gray-500">
                              IVA {product.tax.percentage}% (incluido)
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-2xl font-bold text-green-600">
                          {product.stock}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => startEditStock(product)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-semibold transition"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Editar Stock */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Actualizar Stock</h2>
            <input
              type="number"
              value={editingStock}
              onChange={(e) => setEditingStock(e.target.value)}
              className="w-full border-2 border-gray-300 p-3 rounded-lg mb-4 text-lg"
              min="0"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={saveStock}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Producto */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Agregar Producto</h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 p-2 rounded-lg"
                  placeholder="Ej: Alimento Perro"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Descripción
                </label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  className="w-full border-2 border-gray-300 p-2 rounded-lg"
                  placeholder="Ej: Alimento balanceado"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newProduct.isWeighable}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, isWeighable: e.target.checked })
                  }
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-semibold text-gray-700">
                  ¿Es pesable? (se vende por kg)
                </label>
              </div>

              {newProduct.isWeighable && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Precio por kg
                  </label>
                  <input
                    type="number"
                    value={newProduct.pricePerKg}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, pricePerKg: parseFloat(e.target.value) })
                    }
                    className="w-full border-2 border-gray-300 p-2 rounded-lg"
                    placeholder="Ej: 150"
                  />
                </div>
              )}

              {!newProduct.isWeighable && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Precio unitario
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })
                    }
                    className="w-full border-2 border-gray-300 p-2 rounded-lg"
                    placeholder="Ej: 800"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  💰 IVA del Producto (opcional)
                </label>
                <select
                  value={newProduct.taxId || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      taxId: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className="w-full border-2 border-gray-300 p-2 rounded-lg"
                >
                  <option value="">-- Usar IVA de Tienda --</option>
                  {taxes.map((tax) => (
                    <option key={tax.id} value={tax.id}>
                      {tax.name} ({tax.percentage}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Stock inicial
                </label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, stock: parseInt(e.target.value) || 0 })
                  }
                  className="w-full border-2 border-gray-300 p-2 rounded-lg"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg font-semibold transition"
              >
                Cancelar
              </button>
              <button
                onClick={addProduct}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
