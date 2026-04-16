'use client';

import { useState, useEffect } from 'react';

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  cuit?: string;
  ivaCategory: string;
  totalSpent: number;
  purchaseCount: number;
  lastPurchaseDate?: string;
  createdAt: string;
}

interface Sale {
  id: number;
  total: number;
  createdAt: string;
  paymentMethod: string;
}

interface Payment {
  id: number;
  amount: number;
  description?: string;
  type: string;
  createdAt: string;
}

interface ClientDetail extends Client {
  sales: Sale[];
  payments: Payment[];
}

const ivaCategories = {
  'CONSUMIDOR_FINAL': { label: '👤 Consumidor Final', color: 'bg-gray-200 text-gray-800' },
  'RESPONSABLE_INSCRIPTO': { label: '🏢 Responsable Inscripto', color: 'bg-blue-200 text-blue-800' },
  'MONOTRIBUTISTA': { label: '📊 Monotributista', color: 'bg-purple-200 text-purple-800' },
  'EXENTO': { label: '🎯 Exento de IVA', color: 'bg-green-200 text-green-800' },
  'NO_RESPONSABLE': { label: '❌ No Responsable', color: 'bg-orange-200 text-orange-800' },
  'SUJETO_NO_IDENTIFICADO': { label: '❓ Sujeto No Identificado', color: 'bg-red-200 text-red-800' },
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'list' | 'detail' | 'analytics' | 'ranking'>('list');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    cuit: '',
    ivaCategory: 'CONSUMIDOR_FINAL',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    description: '',
    type: 'DEBT_PAYMENT',
  });

  const [creditAccount, setCreditAccount] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch('http://localhost:3001/clients');
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadClientDetail = async (clientId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedClient(data);
        
        // Cargar cuenta corriente
        const accountResponse = await fetch(`http://localhost:3001/clients/${clientId}/account`);
        if (accountResponse.ok) {
          setCreditAccount(await accountResponse.json());
        }

        // Cargar análisis
        const analyticsResponse = await fetch(`http://localhost:3001/clients/${clientId}/analytics`);
        if (analyticsResponse.ok) {
          setAnalytics(await analyticsResponse.json());
        }

        // Cargar recomendaciones
        const recsResponse = await fetch(`http://localhost:3001/clients/${clientId}/recommendations`);
        if (recsResponse.ok) {
          setRecommendations(await recsResponse.json());
        }
      }
    } catch (error) {
      console.error('Error loading client detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRanking = async () => {
    try {
      const response = await fetch('http://localhost:3001/clients/analytics/ranking');
      if (response.ok) {
        setRanking(await response.json());
      }
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        loadClients();
        setShowForm(false);
        setFormData({ name: '', email: '', phone: '', address: '', cuit: '', ivaCategory: 'CONSUMIDOR_FINAL' });
      }
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const response = await fetch(`http://localhost:3001/clients/${selectedClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        loadClients();
        loadClientDetail(selectedClient.id);
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const response = await fetch(`http://localhost:3001/clients/${selectedClient.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          amount: parseFloat(paymentForm.amount),
          description: paymentForm.description,
          type: paymentForm.type,
        }),
      });

      if (response.ok) {
        loadClientDetail(selectedClient.id);
        setShowPaymentForm(false);
        setPaymentForm({ amount: '', description: '', type: 'DEBT_PAYMENT' });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este cliente?')) return;

    try {
      const response = await fetch(`http://localhost:3001/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadClients();
        setSelectedClient(null);
        setActiveTab('list');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleViewClient = (client: Client) => {
    loadClientDetail(client.id);
    setActiveTab('detail');
    setFormData({
      name: client.name,
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      cuit: client.cuit || '',
      ivaCategory: client.ivaCategory,
    });
  };

  const handleViewAnalytics = (client: Client) => {
    loadClientDetail(client.id);
    setActiveTab('analytics');
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">📋 Módulo de Clientes</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            📦 Lista de Clientes
          </button>
          <button
            onClick={() => { setActiveTab('ranking'); loadRanking(); }}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'ranking'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            🏆 Ranking
          </button>
        </div>

        {/* LIST & SEARCH */}
        {activeTab === 'list' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex gap-4 mb-6">
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => { setShowForm(true); setFormData({ name: '', email: '', phone: '', address: '', cuit: '', ivaCategory: 'CONSUMIDOR_FINAL' }); }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  ✨ Agregar Cliente
                </button>
              </div>

              {/* ADD/EDIT FORM */}
              {showForm && (
                <form onSubmit={selectedClient ? handleUpdateClient : handleAddClient} className="border-t pt-6 space-y-4">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="email"
                    placeholder="Email (opcional)"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="Teléfono (opcional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="CUIT (opcional)"
                    value={formData.cuit}
                    onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Dirección (opcional)"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={formData.ivaCategory}
                    onChange={(e) => setFormData({ ...formData, ivaCategory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {Object.entries(ivaCategories).map(([key, { label }]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      {selectedClient ? 'Guardar Cambios' : 'Crear Cliente'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setSelectedClient(null); }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* CLIENTS TABLE */}
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-6 py-3 text-left font-semibold">Categoría IVA</th>
                    <th className="px-6 py-3 text-left font-semibold">CUIT</th>
                    <th className="px-6 py-3 text-left font-semibold">Email</th>
                    <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
                    <th className="px-6 py-3 text-right font-semibold">Total Gastado</th>
                    <th className="px-6 py-3 text-right font-semibold">Compras</th>
                    <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{client.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          ivaCategories[client.ivaCategory]?.color || 'bg-gray-200 text-gray-800'
                        }`}>
                          {ivaCategories[client.ivaCategory]?.label || client.ivaCategory}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{client.cuit || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{client.email || '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{client.phone || '—'}</td>
                      <td className="px-6 py-4 text-right font-semibold">${client.totalSpent.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">{client.purchaseCount}</td>
                      <td className="px-6 py-4 text-center space-x-2">
                        <button
                          onClick={() => handleViewClient(client)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleViewAnalytics(client)}
                          className="px-3 py-1 bg-violet-500 text-white rounded hover:bg-violet-600 text-sm"
                        >
                          Análisis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DETAIL VIEW */}
        {activeTab === 'detail' && selectedClient && !loading && (
          <div className="grid grid-cols-3 gap-6">
            {/* CLIENT INFO */}
            <div className="col-span-1 space-y-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">{selectedClient.name}</h2>
                <div className="space-y-3 text-gray-700">
                  <p><strong>Email:</strong> {selectedClient.email || '—'}</p>
                  <p><strong>Teléfono:</strong> {selectedClient.phone || '—'}</p>
                  <p><strong>CUIT:</strong> {selectedClient.cuit || '—'}</p>
                  <p><strong>Dirección:</strong> {selectedClient.address || '—'}</p>
                  <p><strong>Categoría IVA:</strong> <span className={`px-2 py-1 rounded text-sm font-semibold ${ivaCategories[selectedClient.ivaCategory]?.color}`}>{ivaCategories[selectedClient.ivaCategory]?.label}</span></p>
                  <p><strong>Usuario desde:</strong> {new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => { setShowForm(true); setFormData({ name: selectedClient.name, email: selectedClient.email || '', phone: selectedClient.phone || '', address: selectedClient.address || '', cuit: selectedClient.cuit || '', ivaCategory: selectedClient.ivaCategory }); }}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleDeleteClient(selectedClient.id)}
                    className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>

              {/* CREDIT ACCOUNT */}
              {creditAccount && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">💳 Cuenta Corriente</h3>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Total Compras:</strong> ${creditAccount.totalPurchases.toFixed(2)}</p>
                    <p><strong>Total Pagos:</strong> ${creditAccount.totalPayments.toFixed(2)}</p>
                    <p className={`font-bold text-lg ${creditAccount.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {creditAccount.balance > 0 ? `Debe: $${creditAccount.balance.toFixed(2)}` : `Pagado: $${creditAccount.paid.toFixed(2)}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* PURCHASES & PAYMENTS */}
            <div className="col-span-2 space-y-6">
              {showPaymentForm && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">💰 Registrar Pago</h3>
                  <form onSubmit={handleRecordPayment} className="space-y-4">
                    <input
                      type="number"
                      placeholder="Monto"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Descripción (opcional)"
                      value={paymentForm.description}
                      onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={paymentForm.type}
                      onChange={(e) => setPaymentForm({ ...paymentForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="DEBT_PAYMENT">Pago de Deuda</option>
                      <option value="CREDIT">Crédito</option>
                      <option value="DEBIT">Débito</option>
                    </select>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
                      >
                        Registrar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPaymentForm(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* PURCHASE HISTORY */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">📦 Historial de Compras ({selectedClient.sales.length})</h3>
                </div>
                {selectedClient.sales.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.sales.map((sale) => (
                      <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">${sale.total.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{new Date(sale.createdAt).toLocaleString()} - {sale.paymentMethod}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin compras registradas</p>
                )}
              </div>

              {/* PAYMENT HISTORY */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">💵 Historial de Pagos</h3>
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    ➕ Agregar Pago
                  </button>
                </div>
                {selectedClient.payments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedClient.payments.map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-semibold">${payment.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">{payment.description || payment.type} - {new Date(payment.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Sin pagos registrados</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS VIEW */}
        {activeTab === 'analytics' && selectedClient && analytics && !loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* PURCHASE ANALYTICS */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold mb-6">📊 Análisis de Compras</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600">Total de Compras</p>
                    <p className="text-3xl font-bold text-blue-600">{analytics.totalPurchases}</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-600">Total Gastado</p>
                    <p className="text-3xl font-bold text-green-600">${analytics.totalSpent.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-gray-600">Promedio por Compra</p>
                    <p className="text-3xl font-bold text-purple-600">${analytics.averagePurchase.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* ACTIVITY & RECOMMENDATIONS */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-bold mb-4">⏱️ Actividad</h3>
                  <div className="space-y-3">
                    <p><strong>Últimas Compra:</strong> {analytics.lastPurchaseDate ? new Date(analytics.lastPurchaseDate).toLocaleDateString() : 'Nunca'}</p>
                    <p><strong>Inactivo por:</strong> {analytics.daysSinceLastPurchase ? `${analytics.daysSinceLastPurchase} días` : 'Cliente nuevo'}</p>
                    <p><strong>Categoría IVA:</strong> {ivaCategories[analytics.ivaCategory]?.label}</p>
                  </div>
                </div>

                {recommendations && (
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-bold mb-4">💡 Sugerencias de Venta</h3>
                    {recommendations.recommendations.length > 0 ? (
                      <div className="space-y-2">
                        {recommendations.recommendations.map((rec, idx) => (
                          <div key={idx} className={`p-3 rounded-lg ${
                            rec.priority === 'HIGH' ? 'bg-red-50 border border-red-200' :
                            rec.priority === 'MEDIUM' ? 'bg-yellow-50 border border-yellow-200' :
                            'bg-blue-50 border border-blue-200'
                          }`}>
                            <p className="font-semibold text-sm">{rec.type}</p>
                            <p className="text-sm text-gray-700">{rec.message}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">Sin sugerencias disponibles</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('detail')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700"
            >
              ← Volver a Detalles
            </button>
          </div>
        )}

        {/* RANKING VIEW */}
        {activeTab === 'ranking' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">🏆 Ranking de Clientes Top 20</h2>
            {ranking.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-200 border-b">
                    <tr>
                      <th className="px-6 py-3 text-center font-semibold">Posición</th>
                      <th className="px-6 py-3 text-left font-semibold">Cliente</th>
                      <th className="px-6 py-3 text-right font-semibold">Total Gastado</th>
                      <th className="px-6 py-3 text-right font-semibold">Compras</th>
                      <th className="px-6 py-3 text-left font-semibold">Última Compra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((client) => (
                      <tr key={client.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-center font-bold text-lg">
                          {client.rank === 1 ? '🥇' : client.rank === 2 ? '🥈' : client.rank === 3 ? '🥉' : `#${client.rank}`}
                        </td>
                        <td className="px-6 py-4 font-medium">{client.name}</td>
                        <td className="px-6 py-4 text-right font-semibold text-green-600">${client.totalSpent.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">{client.purchaseCount}</td>
                        <td className="px-6 py-4">
                          {client.lastPurchaseDate ? new Date(client.lastPurchaseDate).toLocaleDateString() : 'Sin compras'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No hay clientes registrados</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
