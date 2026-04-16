"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  isWeighable: boolean;
  price?: number;
  pricePerKg?: number;
  description?: string;
  taxId?: number;
  tax?: { id: number; name: string; percentage: number };
};

type CartItem = {
  id: string;
  productId: number;
  productName: string;
  isWeighable: boolean;
  quantity: number;
  weight?: number;
  price: number;
  pricePerKg?: number;
  taxId?: number;
  taxPercentage?: number;
};

type Payment = {
  method: 'CASH' | 'TRANSFER';
  amount: number;
};

type Tax = {
  id: number;
  name: string;
  percentage: number;
  type: string;
  active: boolean;
};

type Seller = {
  id: number;
  name: string;
  active: boolean;
};

export default function POS() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showMessage, setShowMessage] = useState(false);
  const [messagetext, setMessageText] = useState("");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<number | null>(null);
  const [ivaTaxes, setIvaTaxes] = useState<Tax[]>([]);
  const [defaultIvaTaxId, setDefaultIvaTaxId] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<'simple' | 'multiple' | null>('simple');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [paymentAmount, setPaymentAmount] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expandPayment, setExpandPayment] = useState(false);
  const [selectedWeightId, setSelectedWeightId] = useState<string | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
    fetchSellers();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:3001/products");
      if (!res.ok) throw new Error("Error fetching products");
      const data = await res.json();
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setMessageText("❌ Error al cargar productos");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      setLoading(false);
    }
  };

  const fetchSellers = async () => {
    try {
      const [sellersRes, storeRes, taxesRes] = await Promise.all([
        fetch("http://localhost:3001/settings/sellers"),
        fetch("http://localhost:3001/settings/store"),
        fetch("http://localhost:3001/settings/taxes"),
      ]);

      if (sellersRes.ok) {
        const sellersData = await sellersRes.json();
        setSellers(sellersData);

        if (storeRes.ok) {
          const storeData = await storeRes.json();
          if (storeData.defaultSellerId) {
            setSelectedSellerId(storeData.defaultSellerId);
          } else if (sellersData.length > 0) {
            setSelectedSellerId(sellersData[0].id);
          }
          if (storeData.defaultIvaTaxId) {
            setDefaultIvaTaxId(storeData.defaultIvaTaxId);
          }
        }

        if (taxesRes.ok) {
          const taxesData = await taxesRes.json();
          setIvaTaxes(taxesData.filter((tax: Tax) => tax.type === 'IVA'));
        }
      }
    } catch (error) {
      console.error("Error loading sellers and taxes:", error);
    }
  };

  const addToCart = (product: Product) => {
    // Determinar el IVA del producto: si tiene taxId usa ese, sino usa el default de la tienda
    let taxId = product.taxId;
    let taxPercentage = 0;

    if (taxId) {
      const tax = ivaTaxes.find((t) => t.id === taxId);
      if (tax) {
        taxPercentage = tax.percentage;
      }
    } else {
      // Usar IVA predeterminado de la tienda
      taxId = defaultIvaTaxId || undefined;
      const tax = ivaTaxes.find((t) => t.id === defaultIvaTaxId);
      if (tax) {
        taxPercentage = tax.percentage;
      }
    }

    if (product.isWeighable) {
      // Para productos pesables, abrir modal de peso
      setSelectedWeightId(product.id.toString());
      setWeightInput("");
    } else {
      // Para productos no pesables, agregar con cantidad = 1
      const cartItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        isWeighable: false,
        quantity: 1,
        price: product.price || 0,
        taxId,
        taxPercentage,
      };
      setCart([...cart, cartItem]);
    }
  };

  const confirmWeight = (productId: string) => {
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0) {
      setMessageText("Ingresa un peso válido");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
      return;
    }

    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.isWeighable && product.pricePerKg) {
      // Determinar el IVA del producto
      let taxId = product.taxId;
      let taxPercentage = 0;

      if (taxId) {
        const tax = ivaTaxes.find((t) => t.id === taxId);
        if (tax) {
          taxPercentage = tax.percentage;
        }
      } else {
        // Usar IVA predeterminado de la tienda
        taxId = defaultIvaTaxId || undefined;
        const tax = ivaTaxes.find((t) => t.id === defaultIvaTaxId);
        if (tax) {
          taxPercentage = tax.percentage;
        }
      }

      const price = weight * product.pricePerKg;
      const cartItem: CartItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        isWeighable: true,
        quantity: 1,
        weight,
        price,
        pricePerKg: product.pricePerKg,
        taxId,
        taxPercentage,
      };
      setCart([...cart, cartItem]);
      setSelectedWeightId(null);
      setWeightInput("");
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateWeight = (id: string, newWeight: number) => {
    const updatedCart = cart.map(item => {
      if (item.id === id && item.isWeighable && item.pricePerKg) {
        return {
          ...item,
          weight: newWeight,
          price: newWeight * item.pricePerKg,
        };
      }
      return item;
    });
    setCart(updatedCart);
  };

  const agregarPago = () => {
    const amount = parseFloat(paymentAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setMessageText("⚠️ Ingresa un monto válido");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
      return;
    }

    const totalActual = payments.reduce((sum, p) => sum + p.amount, 0);
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    if (totalActual + amount > total) {
      setMessageText("⚠️ La suma de pagos excede el total");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
      return;
    }

    setPayments([...payments, { method: paymentMethod, amount }]);
    setPaymentAmount("");
  };

  const eliminarPago = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const calcularTotalPagos = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  };

  const cobrar = async () => {
    try {
      const total = cart.reduce((sum, item) => sum + item.price, 0);
      
      // Validar que haya un vendedor seleccionado
      if (!selectedSellerId) {
        setMessageText("⚠️ Selecciona un vendedor");
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
        return;
      }

      // Para pago simple, validar que se haya seleccionado método
      if (paymentType === 'simple') {
        // Crear pago simple
        const paymentData = [{ method: paymentMethod, amount: totalWithIva }];
        
        const items = cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight || 0,
        }));

        const res = await fetch("http://localhost:3001/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            total: totalWithIva,
            tenantId: 1,
            sellerId: selectedSellerId,
            ivaTaxId: cart.length > 0 ? cart[0].taxId : defaultIvaTaxId,
            taxAmount: ivaAmount,
            payments: paymentData,
            items,
          }),
        });

        if (!res.ok) throw new Error("Error en la respuesta");
        const data = await res.json();
        console.log(data);

        setMessageText(`✅ Venta guardada exitosamente (ID: ${data.id})`);
        setShowMessage(true);
        setCart([]);
        setPayments([]);
        setPaymentType(null);
        setPaymentAmount("");
        setTimeout(() => setShowMessage(false), 3000);
        return;
      }

      // Para pago múltiple, validar que los pagos sean exactos
      if (paymentType === 'multiple') {
        const totalPagos = calcularTotalPagos();

        if (Math.abs(totalPagos - totalWithIva) > 0.01) {
          setMessageText(`⚠️ Los pagos deben ser exactos: $${totalWithIva.toFixed(2)} (pagados: $${totalPagos.toFixed(2)})`);
          setShowMessage(true);
          setTimeout(() => setShowMessage(false), 3000);
          return;
        }

        const items = cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          weight: item.weight || 0,
        }));

        const res = await fetch("http://localhost:3001/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            total: totalWithIva,
            tenantId: 1,
            sellerId: selectedSellerId,
            ivaTaxId: cart.length > 0 ? cart[0].taxId : defaultIvaTaxId,
            taxAmount: ivaAmount,
            payments,
            items,
          }),
        });

        if (!res.ok) throw new Error("Error en la respuesta");
        const data = await res.json();
        console.log(data);

        setMessageText(`✅ Venta guardada exitosamente (ID: ${data.id})`);
        setShowMessage(true);
        setCart([]);
        setPayments([]);
        setPaymentType(null);
        setPaymentAmount("");
        setTimeout(() => setShowMessage(false), 3000);
        return;
      }

      setMessageText("⚠️ Selecciona tipo de pago");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
    } catch (error) {
      console.error(error);
      setMessageText("❌ Error al cobrar");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const cancelarVenta = () => {
    if (cart.length === 0) {
      setMessageText("⚠️ No hay venta para cancelar");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
      return;
    }
    setCart([]);
    setPayments([]);
    setPaymentType(null);
    setPaymentAmount("");
    setMessageText("❌ Venta cancelada");
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  };

  const imprimirComprobante = () => {
    if (cart.length === 0) {
      setMessageText("⚠️ No hay artículos para imprimir");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 2000);
      return;
    }

    const comprobante = `
================================
        COMPROBANTE DE VENTA
================================
Fecha: ${new Date().toLocaleString('es-ES')}
Método de pago: ${paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}

ARTÍCULOS:
--------------------------------
${cart.map(item => `${item.productName}${item.isWeighable ? ` (${item.weight}kg)` : ''} - $${item.price.toFixed(2)}`).join('\n')}
--------------------------------
TOTAL: $${total.toFixed(2)}
Artículos: ${cart.length}
================================
  `.trim();

    // Imprimir en consola (para pruebas)
    console.log(comprobante);
    
    // Abrir ventana de impresión
    const printWindow = window.open('', '', 'height=400,width=600');
    if (printWindow) {
      printWindow.document.write('<pre>' + comprobante + '</pre>');
      printWindow.document.close();
      printWindow.print();
    }

    setMessageText("🖨️ Enviado a imprimir");
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 2000);
  };

  const totalWithIva = cart.reduce((sum, item) => sum + item.price, 0);
  // Calcular subtotal sin IVA mediante desglose inverso
  const subtotal = parseFloat(
    cart.reduce((sum, item) => {
      const taxPercentage = item.taxPercentage || 0;
      const factor = (100 + taxPercentage) / 100;
      const itemSubtotal = item.price / factor;
      return sum + itemSubtotal;
    }, 0).toFixed(2)
  );
  const ivaAmount = parseFloat((totalWithIva - subtotal).toFixed(2));
  // total es alias para compatibilidad con el resto del código
  const total = totalWithIva;

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <div className="h-screen flex bg-gray-200">
      {/* Productos */}
      <div className="w-2/3 p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Productos</h1>
          <div className="flex gap-2">
            <Link href="/stock">
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm">
                📦 Inventario
              </button>
            </Link>
            <Link href="/sales">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
                📊 Ver Dashboard
              </button>
            </Link>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {products
            .filter((product) =>
              product.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className={`${
                product.isWeighable ? 'bg-purple-200' : 'bg-blue-200'
              } rounded-2xl p-6 shadow hover:scale-105 transition`}
            >
              <div className="text-lg font-semibold">
                {product.name}
                {product.isWeighable && <span className="text-xs"> ⚖️</span>}
              </div>
              <div className="text-sm mt-2">
                {product.isWeighable 
                  ? `$${product.pricePerKg}/kg` 
                  : product.price ? `$${product.price}` : 'Sin precio'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Peso */}
      {selectedWeightId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">Ingresa el peso</h3>
            <input
              type="number"
              placeholder="Ej: 2.5 (kg)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded-lg mb-4"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedWeightId(null)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmWeight(selectedWeightId)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrito */}
      <div className="w-1/3 bg-white p-4 border-l flex flex-col">
        <h2 className="text-xl font-bold mb-4">Venta actual</h2>

        {/* Selección de Vendedor */}
        <div className="mb-4 pb-4 border-b">
          <label className="block text-sm font-semibold mb-2">👤 Vendedor</label>
          <select
            value={selectedSellerId || ''}
            onChange={(e) => setSelectedSellerId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
          >
            <option value="">-- Selecciona un vendedor --</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>
          {sellers.length === 0 && (
            <p className="text-xs text-red-600 mt-1">⚠️ Agrega vendedores en Configuración</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-gray-100 p-3 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">{item.productName}</span>
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
              {item.isWeighable && item.weight !== undefined ? (
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Peso:</span>
                    <input
                      type="number"
                      value={item.weight}
                      onChange={(e) => updateWeight(item.id, parseFloat(e.target.value))}
                      className="w-20 border border-gray-300 p-1 rounded text-right"
                      step="0.1"
                    />
                    <span>kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio/kg:</span>
                    <span>${item.pricePerKg}</span>
                  </div>
                </div>
              ) : null}
              <div className="flex justify-between font-semibold mt-2">
                <span>Total:</span>
                <span>${item.price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t pt-4 space-y-3">
          <div className="text-2xl font-bold">
            Total: ${totalWithIva.toFixed(2)}
          </div>
          {ivaAmount > 0 && (
            <div className="text-sm text-gray-600 space-y-1">
              <div>IVA (desglosado): ${ivaAmount.toFixed(2)}</div>
              <div>Subtotal (sin IVA): ${subtotal.toFixed(2)}</div>
            </div>
          )}
          <div className="text-sm text-gray-600">
            Artículos: {cart.length}
          </div>

          {/* PANEL DE PAGOS DESPLEGABLE */}
          <div className="border rounded-lg overflow-hidden">
            {/* Header del panel desplegable */}
            <button
              onClick={() => setExpandPayment(!expandPayment)}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 font-semibold flex justify-between items-center transition"
            >
              <span>
                {paymentType === null 
                  ? "💳 Forma de Pago" 
                  : paymentType === 'simple'
                  ? `💵 Pago Simple: ${paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}`
                  : `💳 Pagos Múltiples: $${calcularTotalPagos().toFixed(2)} / $${total.toFixed(2)}`}
              </span>
              <span className="text-xl">{expandPayment ? '▼' : '▶'}</span>
            </button>

            {/* Contenido desplegable */}
            {expandPayment && (
              <div className="bg-white p-4 space-y-3 border-t">
                {/* Seleccionar tipo de pago */}
                {paymentType === null && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      ¿Cómo deseas pagar?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentType('simple')}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-semibold transition text-sm"
                      >
                        💵 Simple
                      </button>
                      <button
                        onClick={() => setPaymentType('multiple')}
                        className="bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg font-semibold transition text-sm"
                      >
                        💳 Múltiple
                      </button>
                    </div>
                  </div>
                )}

                {/* PAGO SIMPLE */}
                {paymentType === 'simple' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase">
                      Método: ${total.toFixed(2)}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('CASH')}
                        className={`py-2 px-3 rounded-lg font-semibold transition text-sm ${
                          paymentMethod === 'CASH'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        💵 Efectivo
                      </button>
                      <button
                        onClick={() => setPaymentMethod('TRANSFER')}
                        className={`py-2 px-3 rounded-lg font-semibold transition text-sm ${
                          paymentMethod === 'TRANSFER'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        🔄 Transferencia
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        setPaymentType(null);
                        setPaymentMethod('CASH');
                      }}
                      className="w-full bg-gray-200 text-gray-700 py-1 rounded text-xs hover:bg-gray-300 font-semibold"
                    >
                      ← Cambiar tipo
                    </button>
                  </div>
                )}

                {/* PAGOS MÚLTIPLES */}
                {paymentType === 'multiple' && (
                  <div className="space-y-2">
                    {/* Resumen */}
                    <div className={`p-2 rounded text-xs font-semibold text-center ${
                      payments.length > 0 && Math.abs(calcularTotalPagos() - total) < 0.01
                        ? 'bg-green-100 text-green-700'
                        : payments.length > 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      Total: ${total.toFixed(2)} | Pagado: ${calcularTotalPagos().toFixed(2)}
                      {Math.abs(calcularTotalPagos() - total) < 0.01 && ' ✅'}
                      {Math.abs(calcularTotalPagos() - total) >= 0.01 && ` ⚠️`}
                    </div>

                    {/* Listado de pagos */}
                    {payments.length > 0 && (
                      <div className="bg-gray-50 rounded p-2 space-y-1 max-h-20 overflow-y-auto border">
                        {payments.map((payment, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white p-1.5 rounded text-xs">
                            <span>
                              {payment.method === 'CASH' ? '💵' : '🔄'} ${payment.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => eliminarPago(idx)}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario agregar pago */}
                    {payments.length === 0 || (Math.abs(calcularTotalPagos() - total) >= 0.01) ? (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex gap-1 text-xs">
                          <button
                            onClick={() => setPaymentMethod('CASH')}
                            className={`flex-1 py-1.5 px-2 rounded font-semibold transition ${
                              paymentMethod === 'CASH'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            💵
                          </button>
                          <button
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className={`flex-1 py-1.5 px-2 rounded font-semibold transition ${
                              paymentMethod === 'TRANSFER'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            🔄
                          </button>
                        </div>

                        <div className="flex gap-1">
                          <input
                            type="number"
                            placeholder="$monto"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && agregarPago()}
                            className="flex-1 border border-gray-300 p-1.5 rounded text-xs"
                            step="0.01"
                            max={total - calcularTotalPagos()}
                          />
                          <button
                            onClick={agregarPago}
                            className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded font-semibold text-xs"
                          >
                            ➕
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <button
                      onClick={() => {
                        setPaymentType(null);
                        setPayments([]);
                        setPaymentAmount("");
                      }}
                      className="w-full bg-gray-200 text-gray-700 py-1 rounded text-xs hover:bg-gray-300 font-semibold"
                    >
                      ← Cambiar tipo
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={cobrar}
            disabled={cart.length === 0 || paymentType === null || (paymentType === 'multiple' && Math.abs(calcularTotalPagos() - total) >= 0.01)}
            className="w-full bg-green-500 text-white py-4 rounded-xl text-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cart.length === 0 
              ? "Selecciona items" 
              : paymentType === null
              ? "Selecciona tipo de pago"
              : paymentType === 'multiple' && Math.abs(calcularTotalPagos() - total) >= 0.01
              ? `Pagos incompletos ($${(total - calcularTotalPagos()).toFixed(2)})`
              : "Cobrar"}
          </button>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={imprimirComprobante}
              disabled={cart.length === 0}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🖨️ Imprimir
            </button>
            <button
              onClick={cancelarVenta}
              disabled={cart.length === 0}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ❌ Cancelar
            </button>
          </div>
        </div>

        {showMessage && (
          <div className={`mt-4 p-3 rounded-lg text-white text-center ${messagetext.includes("✅") ? "bg-green-500" : "bg-red-500"}`}>
            {messagetext}
          </div>
        )}
      </div>
    </div>
  );
}