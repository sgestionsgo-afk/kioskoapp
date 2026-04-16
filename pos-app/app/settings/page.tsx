'use client';

import { useState, useEffect } from 'react';

interface StoreSettings {
  id: number;
  storeName: string;
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
  storeCity?: string;
  storeProvince?: string;
  storePostalCode?: string;
  storeCountry: string;
  cuit?: string;
  invoicePrefix: string;
  currency: string;
  timezone: string;
  theme: string;
  defaultIvaTaxId?: number;
  defaultSellerId?: number;
}

interface Tax {
  id: number;
  name: string;
  percentage: number;
  type: string;
  active: boolean;
}

interface Branch {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  manager?: string;
  isMainBranch: boolean;
  active: boolean;
}

interface Promotion {
  id: number;
  name: string;
  type: string;
  discountValue: number;
  conditions?: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface Seller {
  id: number;
  name: string;
  active: boolean;
}

const assistantTips = [
  '💡 Mantén actualizada la información de tu tienda para facturas correctas',
  '📊 El IVA es el impuesto más importante a configurar correctamente',
  '🏢 Puedes gestionar múltiples sucursales desde aquí',
  '🎁 Las promociones activan automáticamente dentro de su período',
  '⚙️ El timezone afecta la hora de las transacciones',
  '💰 Configura múltiples tipos de impuestos según tus necesidades',
  '👤 Los vendedores que crees aquí aparecerán en el POS',
  '⭐ Marca un vendedor como predefinido para que aparezca automáticamente',
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'store' | 'taxes' | 'branches' | 'promotions' | 'sellers'>('store');
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);

  // Form states
  const [storeForm, setStoreForm] = useState<Partial<StoreSettings>>({});
  const [showTaxForm, setShowTaxForm] = useState(false);
  const [taxForm, setTaxForm] = useState({ name: '', percentage: '', type: 'IVA', active: true });
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', email: '', phone: '', city: '', province: '', manager: '', isMainBranch: false, active: true });
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [promotionForm, setPromotionForm] = useState({
    name: '',
    type: 'PERCENTAGE',
    discountValue: '',
    startDate: '',
    endDate: '',
    active: true,
  });
  const [showSellerForm, setShowSellerForm] = useState(false);
  const [sellerForm, setSellerForm] = useState({ name: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const [storeRes, taxesRes, branchesRes, promotionsRes, sellersRes] = await Promise.all([
        fetch('http://localhost:3001/settings/store'),
        fetch('http://localhost:3001/settings/taxes'),
        fetch('http://localhost:3001/settings/branches'),
        fetch('http://localhost:3001/settings/promotions'),
        fetch('http://localhost:3001/settings/sellers'),
      ]);

      if (storeRes.ok) {
        const store = await storeRes.json();
        setStoreSettings(store);
        setStoreForm(store);
      }
      if (taxesRes.ok) {
        setTaxes(await taxesRes.json());
      }
      if (branchesRes.ok) {
        setBranches(await branchesRes.json());
      }
      if (promotionsRes.ok) {
        setPromotions(await promotionsRes.json());
      }
      if (sellersRes.ok) {
        setSellers(await sellersRes.json());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/settings/store', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(storeForm),
      });

      if (response.ok) {
        const updated = await response.json();
        setStoreSettings(updated);
        alert('✅ Configuración de tienda actualizada');
      }
    } catch (error) {
      console.error('Error updating store:', error);
    }
  };

  const handleAddTax = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/settings/taxes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taxForm,
          percentage: parseFloat(taxForm.percentage),
        }),
      });

      if (response.ok) {
        loadSettings();
        setShowTaxForm(false);
        setTaxForm({ name: '', percentage: '', type: 'IVA', active: true });
        alert('✅ Impuesto agregado');
      }
    } catch (error) {
      console.error('Error adding tax:', error);
    }
  };

  const handleDeleteTax = async (id: number) => {
    if (!confirm('¿Está seguro?')) return;
    try {
      await fetch(`http://localhost:3001/settings/taxes/${id}`, { method: 'DELETE' });
      loadSettings();
    } catch (error) {
      console.error('Error deleting tax:', error);
    }
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/settings/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branchForm),
      });

      if (response.ok) {
        loadSettings();
        setShowBranchForm(false);
        setBranchForm({ name: '', address: '', email: '', phone: '', city: '', province: '', manager: '', isMainBranch: false, active: true });
        alert('✅ Sucursal agregada');
      }
    } catch (error) {
      console.error('Error adding branch:', error);
    }
  };

  const handleDeleteBranch = async (id: number) => {
    if (!confirm('¿Está seguro?')) return;
    try {
      await fetch(`http://localhost:3001/settings/branches/${id}`, { method: 'DELETE' });
      loadSettings();
    } catch (error) {
      console.error('Error deleting branch:', error);
    }
  };

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3001/settings/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...promotionForm,
          discountValue: parseFloat(promotionForm.discountValue),
        }),
      });

      if (response.ok) {
        loadSettings();
        setShowPromotionForm(false);
        setPromotionForm({
          name: '',
          type: 'PERCENTAGE',
          discountValue: '',
          startDate: '',
          endDate: '',
          active: true,
        });
        alert('✅ Promoción agregada');
      }
    } catch (error) {
      console.error('Error adding promotion:', error);
    }
  };

  const handleDeletePromotion = async (id: number) => {
    if (!confirm('¿Está seguro?')) return;
    try {
      await fetch(`http://localhost:3001/settings/promotions/${id}`, { method: 'DELETE' });
      loadSettings();
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const handleAddSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.name.trim()) {
      alert('El nombre del vendedor es requerido');
      return;
    }
    try {
      const response = await fetch('http://localhost:3001/settings/sellers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sellerForm.name }),
      });

      if (response.ok) {
        loadSettings();
        setShowSellerForm(false);
        setSellerForm({ name: '' });
        alert('✅ Vendedor agregado');
      }
    } catch (error) {
      console.error('Error adding seller:', error);
    }
  };

  const handleSetDefaultSeller = async (sellerId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/settings/sellers/${sellerId}/set-default`, {
        method: 'PUT',
      });

      if (response.ok) {
        loadSettings();
        alert('✅ Vendedor predefinido actualizado');
      }
    } catch (error) {
      console.error('Error setting default seller:', error);
    }
  };

  const handleDeleteSeller = async (id: number) => {
    if (!confirm('¿Está seguro? Este vendedor se eliminará del sistema')) return;
    try {
      await fetch(`http://localhost:3001/settings/sellers/${id}`, { method: 'DELETE' });
      loadSettings();
      alert('✅ Vendedor eliminado');
    } catch (error) {
      console.error('Error deleting seller:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">⚙️ Configuraciones</h1>
          <button
            onClick={() => setShowAssistant(!showAssistant)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            🤖 Asistente {showAssistant ? '✕' : '?'}
          </button>
        </div>

        {/* ASSISTANT PANEL */}
        {showAssistant && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-600 p-6 rounded-lg shadow-md">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🤖</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">¡Hola! Soy tu Asistente</h3>
                <p className="text-gray-700 mb-4">{assistantTips[currentTip]}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentTip((prev) => (prev - 1 + assistantTips.length) % assistantTips.length)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() => setCurrentTip((prev) => (prev + 1) % assistantTips.length)}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex gap-4 mb-6 border-b overflow-x-auto">
          {[
            { id: 'store', label: '🏪 Parámetros Tienda' },
            { id: 'taxes', label: '💰 Impuestos' },
            { id: 'branches', label: '🏢 Sucursales' },
            { id: 'promotions', label: '🎁 Promociones' },
            { id: 'sellers', label: '👤 Vendedores' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* STORE SETTINGS */}
        {activeTab === 'store' && storeSettings && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleUpdateStore} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nombre de Tienda</label>
                  <input
                    type="text"
                    value={storeForm.storeName || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={storeForm.storeEmail || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storeEmail: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Teléfono</label>
                  <input
                    type="tel"
                    value={storeForm.storePhone || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storePhone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">CUIT</label>
                  <input
                    type="text"
                    value={storeForm.cuit || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, cuit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Dirección</label>
                  <input
                    type="text"
                    value={storeForm.storeAddress || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storeAddress: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Ciudad</label>
                  <input
                    type="text"
                    value={storeForm.storeCity || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storeCity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Provincia</label>
                  <input
                    type="text"
                    value={storeForm.storeProvince || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storeProvince: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Código Postal</label>
                  <input
                    type="text"
                    value={storeForm.storePostalCode || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, storePostalCode: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Prefijo Factura</label>
                  <input
                    type="text"
                    value={storeForm.invoicePrefix || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, invoicePrefix: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Moneda</label>
                  <select
                    value={storeForm.currency || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, currency: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">IVA Predeterminado</label>
                  <select
                    value={storeForm.defaultIvaTaxId || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, defaultIvaTaxId: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">-- Selecciona IVA --</option>
                    {taxes.filter((tax) => tax.type === 'IVA').map((tax) => (
                      <option key={tax.id} value={tax.id}>
                        {tax.name} ({tax.percentage}%)
                      </option>
                    ))}
                  </select>
                  {taxes.filter((tax) => tax.type === 'IVA').length === 0 && (
                    <p className="text-xs text-red-600 mt-2">Agrega impuestos IVA en la pestaña Impuestos primero</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Timezone</label>
                  <select
                    value={storeForm.timezone || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, timezone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="America/Argentina/Buenos_Aires">Argentina - Buenos Aires</option>
                    <option value="America/Argentina/Cordoba">Argentina - Córdoba</option>
                    <option value="America/Argentina/Rosario">Argentina - Rosario</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Tema</label>
                  <select
                    value={storeForm.theme || ''}
                    onChange={(e) => setStoreForm({ ...storeForm, theme: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="light">🌞 Claro</option>
                    <option value="dark">🌙 Oscuro</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                💾 Guardar Configuración
              </button>
            </form>
          </div>
        )}

        {/* TAXES */}
        {activeTab === 'taxes' && (
          <div className="space-y-6">
            {!showTaxForm && (
              <button
                onClick={() => setShowTaxForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                ➕ Agregar Impuesto
              </button>
            )}

            {showTaxForm && (
              <form onSubmit={handleAddTax} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: IVA NOR"
                      value={taxForm.name}
                      onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Porcentaje</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="21"
                      value={taxForm.percentage}
                      onChange={(e) => setTaxForm({ ...taxForm, percentage: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
                  >
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaxForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                    <th className="px-6 py-3 text-right font-semibold">Porcentaje</th>
                    <th className="px-6 py-3 text-center font-semibold">Estado</th>
                    <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {taxes.map((tax) => (
                    <tr key={tax.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">{tax.name}</td>
                      <td className="px-6 py-4 text-right font-semibold">{tax.percentage}%</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-sm ${tax.active ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                          {tax.active ? '✓ Activo' : '✕ Inactivo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteTax(tax.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BRANCHES */}
        {activeTab === 'branches' && (
          <div className="space-y-6">
            {!showBranchForm && (
              <button
                onClick={() => setShowBranchForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                ➕ Agregar Sucursal
              </button>
            )}

            {showBranchForm && (
              <form onSubmit={handleAddBranch} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: Sucursal Centro"
                      value={branchForm.name}
                      onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Dirección</label>
                    <input
                      type="text"
                      value={branchForm.address}
                      onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={branchForm.email}
                      onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Teléfono</label>
                    <input
                      type="tel"
                      value={branchForm.phone}
                      onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={branchForm.isMainBranch}
                    onChange={(e) => setBranchForm({ ...branchForm, isMainBranch: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-semibold">Es sucursal principal</span>
                </label>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBranchForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 gap-6">
              {branches.map((branch) => (
                <div key={branch.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{branch.name} {branch.isMainBranch && '⭐'}</h3>
                    <button
                      onClick={() => handleDeleteBranch(branch.id)}
                      className="px-2 py-1 text-red-600 hover:bg-red-100 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong>Dirección:</strong> {branch.address}</p>
                    <p><strong>Ciudad:</strong> {branch.city || '—'}</p>
                    <p><strong>Email:</strong> {branch.email || '—'}</p>
                    <p><strong>Estado:</strong> {branch.active ? '✓ Activa' : '✕ Inactiva'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROMOTIONS */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            {!showPromotionForm && (
              <button
                onClick={() => setShowPromotionForm(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                ➕ Agregar Promoción
              </button>
            )}

            {showPromotionForm && (
              <form onSubmit={handleAddPromotion} className="bg-white rounded-lg shadow-md p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej: Black Friday"
                      value={promotionForm.name}
                      onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Tipo</label>
                    <select
                      value={promotionForm.type}
                      onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="PERCENTAGE">Porcentaje</option>
                      <option value="FIXED_AMOUNT">Monto Fijo</option>
                      <option value="BUY_X_GET_Y">Compra X Lleva Y</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Valor Descuento</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="10"
                      value={promotionForm.discountValue}
                      onChange={(e) => setPromotionForm({ ...promotionForm, discountValue: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Fecha Inicio</label>
                    <input
                      type="date"
                      value={promotionForm.startDate}
                      onChange={(e) => setPromotionForm({ ...promotionForm, startDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Fecha Fin</label>
                    <input
                      type="date"
                      value={promotionForm.endDate}
                      onChange={(e) => setPromotionForm({ ...promotionForm, endDate: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
                    Agregar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPromotionForm(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {promotions.map((promo) => (
                <div key={promo.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{promo.name}</h3>
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <p><strong>Tipo:</strong> {promo.type === 'PERCENTAGE' ? '%' : promo.type === 'FIXED_AMOUNT' ? '$' : 'Compra X'}</p>
                        <p><strong>Descuento:</strong> {promo.discountValue}</p>
                        <p><strong>Estado:</strong> {promo.active ? '✓ Activa' : '✕ Inactiva'}</p>
                        <p><strong>Inicio:</strong> {new Date(promo.startDate).toLocaleDateString()}</p>
                        <p><strong>Fin:</strong> {new Date(promo.endDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePromotion(promo.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-100 rounded"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SELLERS MANAGEMENT */}
        {activeTab === 'sellers' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">👤 Gestión de Vendedores</h2>
              <button
                onClick={() => setShowSellerForm(!showSellerForm)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {showSellerForm ? '✕ Cancelar' : '➕ Agregar Vendedor'}
              </button>
            </div>

            {/* ADD SELLER FORM */}
            {showSellerForm && (
              <form onSubmit={handleAddSeller} className="mb-8 p-6 bg-gray-50 rounded-lg border-2 border-green-300">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Nombre del Vendedor</label>
                    <input
                      type="text"
                      value={sellerForm.name}
                      onChange={(e) => setSellerForm({ name: e.target.value })}
                      placeholder="Ingresa el nombre del vendedor"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                  >
                    ✅ Guardar Vendedor
                  </button>
                </div>
              </form>
            )}

            {/* SELLERS LIST */}
            <div className="space-y-4">
              {sellers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg">📭 No hay vendedores creados</p>
                  <p className="text-sm">Crea tu primer vendedor para empezar a usar el POS</p>
                </div>
              ) : (
                sellers.map((seller) => (
                  <div key={seller.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">👤 {seller.name}</div>
                      <div className="text-xs text-gray-500">ID: {seller.id}</div>
                      {storeSettings?.defaultSellerId === seller.id && (
                        <div className="mt-2">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                            ⭐ Vendedor Predefinido
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {storeSettings?.defaultSellerId !== seller.id && (
                        <button
                          onClick={() => handleSetDefaultSeller(seller.id)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm font-semibold"
                        >
                          ⭐ Hacer Predefinido
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteSeller(seller.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* INFO PANEL */}
            {storeSettings?.defaultSellerId && (
              <div className="mt-8 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Vendedor Predefinido:</strong> {sellers.find(s => s.id === storeSettings.defaultSellerId)?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Este vendedor aparecerá automáticamente seleccionado en el POS
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
