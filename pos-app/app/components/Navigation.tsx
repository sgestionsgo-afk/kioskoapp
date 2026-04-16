'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-800';
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          💳 POS System
        </Link>
        <div className="flex gap-8">
          <Link 
            href="/" 
            className={`pb-2 transition ${isActive('/')}`}
          >
            Inicio
          </Link>
          <Link 
            href="/stock" 
            className={`pb-2 transition ${isActive('/stock')}`}
          >
            📦 Inventario
          </Link>
          <Link 
            href="/clients" 
            className={`pb-2 transition ${isActive('/clients')}`}
          >
            👥 Clientes
          </Link>
          <Link 
            href="/sales" 
            className={`pb-2 transition ${isActive('/sales')}`}
          >
            📊 Ventas
          </Link>
          <Link 
            href="/settings" 
            className={`pb-2 transition ${isActive('/settings')}`}
          >
            ⚙️ Configuración
          </Link>
        </div>
      </div>
    </nav>
  );
}
