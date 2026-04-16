'use client';

import { useEffect, useState } from 'react';

interface SaleItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  weight?: number;
}

interface Sale {
  id: number;
  total: number;
  sellerName?: string;
  paymentMethod: string;
  createdAt: string;
  items: SaleItem[];
}

interface PaymentMethodStats {
  method: string;
  total: number;
  count: number;
  percentage: number;
}

interface SalesStats {
  totalSales: number;
  totalAmount: number;
  averageAmount: number;
  sales: Sale[];
  paymentMethods: PaymentMethodStats[];
}

export default function SalesPage() {
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:3001/sales/analytics/stats');
      if (!response.ok) throw new Error('Error fetching sales data');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Cargando datos de ventas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return <div>No hay datos disponibles</div>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">📊 Informe de Ventas</h1>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
          >
            🔄 Actualizar
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-semibold">TOTAL DE VENTAS</div>
            <div className="text-3xl font-bold text-blue-600 mt-2">{stats.totalSales}</div>
            <div className="text-gray-500 text-sm mt-1">transacciones</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-semibold">MONTO TOTAL</div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              ${stats.totalAmount.toFixed(2)}
            </div>
            <div className="text-gray-500 text-sm mt-1">acumulado</div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-gray-600 text-sm font-semibold">PROMEDIO POR VENTA</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              ${stats.averageAmount.toFixed(2)}
            </div>
            <div className="text-gray-500 text-sm mt-1">por transacción</div>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">💳 Métodos de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.paymentMethods.map((pm) => (
              <div key={pm.method} className="bg-linear-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {pm.method === 'CASH' ? '💵 Efectivo' : '🔄 Transferencia'}
                    </h3>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {pm.percentage}%
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transacciones:</span>
                    <span className="font-semibold text-gray-800">{pm.count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold text-green-600">${pm.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Promedio:</span>
                    <span className="font-semibold text-gray-800">${(pm.total / pm.count).toFixed(2)}</span>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      pm.method === 'CASH' ? 'bg-blue-600' : 'bg-purple-600'
                    }`}
                    style={{ width: `${pm.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detalle de Ventas */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Detalle de Ventas</h2>
          <div className="space-y-4">
            {stats.sales.map((sale) => (
              <div key={sale.id} className="border-2 border-gray-200 rounded-lg p-6 hover:border-blue-400 transition">
                {/* Encabezado de venta */}
                <div className="grid grid-cols-5 gap-4 mb-4 pb-4 border-b-2 border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 uppercase">ID Venta</div>
                    <div className="text-lg font-bold text-gray-800">#{sale.id}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Vendedor</div>
                    <div className="text-sm font-semibold text-gray-800">👤 {sale.sellerName || 'Sin especificar'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Método Pago</div>
                    <div className="text-lg font-bold text-gray-800">
                      {sale.paymentMethod === 'CASH' ? '💵 Efectivo' : '🔄 Transferencia'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase">Fecha y Hora</div>
                    <div className="text-sm font-semibold text-gray-800">
                      {new Date(sale.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase">Total</div>
                    <div className="text-2xl font-bold text-green-600">${sale.total.toFixed(2)}</div>
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {sale.items.map((item) => (
                      <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="grid grid-cols-6 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Producto:</span>
                            <div className="font-semibold text-gray-800">{item.productName}</div>
                          </div>
                          {item.weight && item.weight > 0 ? (
                            <>
                              <div>
                                <span className="text-gray-600">Peso:</span>
                                <div className="font-semibold text-gray-800">{item.weight.toFixed(2)}kg</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Precio/kg:</span>
                                <div className="font-semibold text-gray-800">${item.price.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Subtotal:</span>
                                <div className="font-semibold text-green-600">
                                  ${(item.weight * item.price).toFixed(2)}
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-gray-600">Qty:</span>
                                <div className="font-semibold text-gray-800">{item.quantity}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Precio Unitario:</span>
                                <div className="font-semibold text-gray-800">${item.price.toFixed(2)}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Subtotal:</span>
                                <div className="font-semibold text-green-600">
                                  ${(item.quantity * item.price).toFixed(2)}
                                </div>
                              </div>
                            </>
                          )}
                          <div>
                            <span className="text-gray-600">Tipo:</span>
                            <div className="font-semibold text-gray-800">#{item.productId}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
