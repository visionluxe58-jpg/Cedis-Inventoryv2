import React from 'react';
import { 
  Building2, 
  Boxes, 
  Ship, 
  FileSpreadsheet, 
  PenTool, 
  History, 
  Layers, 
  UserCheck, 
  CheckCircle2, 
  Settings,
  Share2,
  Lock,
  Upload,
  ExternalLink,
  BarChart3,
  Search
} from 'lucide-react';
import { UsuarioActivo, RolUsuario } from '../types/cedis';
import { USUARIOS_OFICIALES } from '../services/appsScriptClient';

export type ModuloActivo = 'dashboard' | 'matriz' | 'formulario' | 'kardex' | 'conciliacion' | 'auditoria' | 'cruce' | 'reporte_fabrica';

interface NavbarProps {
  moduloActivo: ModuloActivo;
  setModuloActivo: (mod: ModuloActivo) => void;
  usuarioActivo: UsuarioActivo;
  onCambiarUsuario: (usuario: UsuarioActivo) => void;
  totalPedidos: number;
  totalContenedores: number;
  onAbrirModalSheets: () => void;
  onAbrirModalCompartir: () => void;
  onAbrirModalDPL: () => void;
  onAbrirPortalSucursales?: () => void;
  onAbrirRastreador?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  moduloActivo,
  setModuloActivo,
  usuarioActivo,
  onCambiarUsuario,
  totalPedidos,
  totalContenedores,
  onAbrirModalSheets,
  onAbrirModalCompartir,
  onAbrirModalDPL,
  onAbrirPortalSucursales,
  onAbrirRastreador
}) => {
  const getBadgeRol = (rol: RolUsuario) => {
    switch (rol) {
      case 'ADMINISTRADOR_CEDIS':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'OPERADOR_CEDIS':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'SUCURSAL_ASESOR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'CONSULTA':
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-2.5 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo e Identidad */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-black px-2.5 py-1 rounded text-sm tracking-wider shadow">
              CHANGAN
            </span>
            <span className="text-white font-bold text-sm tracking-tight hidden sm:inline">
              CEDIS Panamá
            </span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 hidden sm:block"></div>

          {/* Selector de Usuario Activo y Rol */}
          <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-sky-400" />
            <select
              value={usuarioActivo.usuarioId}
              onChange={(e) => {
                const found = USUARIOS_OFICIALES.find(u => u.usuarioId === e.target.value);
                if (found) {
                  onCambiarUsuario(found);
                }
              }}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              {USUARIOS_OFICIALES.map(u => (
                <option key={u.usuarioId} value={u.usuarioId} className="bg-slate-900 text-slate-200">
                  {u.nombre} ({u.rol.replace('_', ' ')}) - {u.sucursal}
                </option>
              ))}
            </select>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeRol(usuarioActivo.rol)}`}>
              {usuarioActivo.rol === 'ADMINISTRADOR_CEDIS' && 'ADMIN'}
              {usuarioActivo.rol === 'OPERADOR_CEDIS' && 'OPERADOR'}
              {usuarioActivo.rol === 'SUCURSAL_ASESOR' && 'SUCURSAL'}
              {usuarioActivo.rol === 'CONSULTA' && 'CONSULTA'}
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación Operativa */}
        <nav className="flex items-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setModuloActivo('dashboard')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'dashboard'
                ? 'bg-sky-600 text-white shadow ring-1 ring-sky-400'
                : 'bg-slate-800 hover:bg-slate-700 text-sky-400'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>KPIs & Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('reporte_fabrica')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'reporte_fabrica'
                ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/40'
            }`}
            title="Cuadro de Pedidos Especiales y Reporte Fábrica Quincenal"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Reporte Fábrica</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('matriz')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'matriz'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Matriz ({totalPedidos})</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('formulario')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'formulario'
                ? 'bg-amber-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <PenTool className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Requisición</span>
          </button>

          {onAbrirPortalSucursales && (
            <button
              type="button"
              onClick={onAbrirPortalSucursales}
              className="text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 text-blue-300 cursor-pointer"
              title="Abrir vista exclusiva del Portal de Sucursales (?portal=sucursales)"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Portal Sucursales</span>
            </button>
          )}

          {onAbrirRastreador && (
            <button
              type="button"
              onClick={onAbrirRastreador}
              className="text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10 cursor-pointer"
              title="Rastreador Universal de Repuestos, Llegadas, Estatus, Pallet, Contenedor y Stock DPL"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rastreador Universal</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setModuloActivo('kardex')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'kardex'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock & Kardex</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('conciliacion')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'conciliacion'
                ? 'bg-purple-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Conciliación & Staging</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('auditoria')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'auditoria'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-300" />
            <span>Auditoría</span>
          </button>

          <button
            type="button"
            onClick={() => setModuloActivo('cruce')}
            className={`text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 transition ${
              moduloActivo === 'cruce'
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Ship className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Manifiestos ({totalContenedores})</span>
          </button>
        </nav>

        {/* Utilidades y Configuración Canónica */}
        <div className="flex items-center gap-2">
          {usuarioActivo.rol === 'ADMINISTRADOR_CEDIS' && (
            <button
              type="button"
              onClick={onAbrirModalDPL}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-2.5 py-2 rounded-lg flex items-center gap-1.5 transition"
              title="Subir Manifiesto DPL"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">+ DPL</span>
            </button>
          )}

          <button
            type="button"
            onClick={onAbrirModalSheets}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 text-xs font-bold px-2.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
            title="Configuración Google Apps Script API & Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">API Sheets</span>
          </button>

          <button
            type="button"
            onClick={onAbrirModalCompartir}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-2.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition"
            title="Compartir enlace con sucursales"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
