import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  PenTool, 
  PackageSearch, 
  Search, 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  Truck, 
  AlertCircle, 
  ExternalLink, 
  Share2, 
  ArrowLeft, 
  Filter, 
  Car,
  Tag,
  ShieldCheck,
  ChevronRight,
  Boxes,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { UsuarioActivo, FilaMatrizCentral, DPLDetalle, ManifiestoDPL } from '../types/cedis';
import { FormularioRequisicion } from './FormularioRequisicion';
import { ModalComprobantePDF, ComprobantePedidoData } from './ModalComprobantePDF';
import { ModalRastreadorUniversal } from './ModalRastreadorUniversal';
import { USUARIOS_OFICIALES } from '../services/appsScriptClient';
import { CATALOGO_MODELOS_CHANGAN, MODELOS_VEHICULOS_CHANGAN, SUCURSALES_PORTAL, ConfiguracionSucursal } from '../data/sucursalesData';

interface PortalSucursalesProps {
  usuario: UsuarioActivo;
  onCambiarUsuario: (usuario: UsuarioActivo) => void;
  filas: FilaMatrizCentral[];
  inventario: DPLDetalle[];
  manifiestos?: ManifiestoDPL[];
  onPedidoCreado: (pedidoId: string) => void;
  onAbrirMatrizCentral?: () => void;
  onAbrirModalCompartir?: () => void;
}

export const PortalSucursales: React.FC<PortalSucursalesProps> = ({
  usuario,
  onCambiarUsuario,
  filas,
  inventario,
  manifiestos = [],
  onPedidoCreado,
  onAbrirMatrizCentral,
  onAbrirModalCompartir
}) => {
  // Primera página obligatoria: Selección de Sucursal antes de comenzar el proceso
  const [pantallaActual, setPantallaActual] = useState<'seleccion_sucursal' | 'portal'>(() => {
    const yaIniciado = localStorage.getItem('changan_portal_sucursal_iniciada');
    return yaIniciado === 'true' ? 'portal' : 'seleccion_sucursal';
  });

  const [tabActiva, setTabActiva] = useState<'nueva' | 'mis-pedidos'>('nueva');
  const [modalPdfAbierto, setModalPdfAbierto] = useState<boolean>(false);
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState<boolean>(false);
  const [codigoInicialRastreo, setCodigoInicialRastreo] = useState<string>('');
  const [comprobantePdfData, setComprobantePdfData] = useState<ComprobantePedidoData | null>(null);
  const [copiadoEnlace, setCopiadoEnlace] = useState<boolean>(false);

  const [filtroSucursal, setFiltroSucursal] = useState<string>(
    usuario.sucursal.includes('Central') ? 'TODAS' : usuario.sucursal
  );
  const [filtroModelo, setFiltroModelo] = useState<string>('TODOS');
  const [busquedaPedidos, setBusquedaPedidos] = useState<string>('');
  const [busquedaStock, setBusquedaStock] = useState<string>('');

  const copiarEnlacePortal = () => {
    const url = window.location.origin + window.location.pathname + '?portal=sucursales';
    navigator.clipboard.writeText(url);
    setCopiadoEnlace(true);
    setTimeout(() => setCopiadoEnlace(false), 2500);
  };

  const handleConfirmarSucursalYAsesor = (
    sucursalConfig: ConfiguracionSucursal,
    nombreAsesor: string,
    areaAsesor: string
  ) => {
    const usrExistente: UsuarioActivo = USUARIOS_OFICIALES.find(u => 
      u.sucursal.toLowerCase().includes(sucursalConfig.nombre.toLowerCase()) &&
      u.nombre.toLowerCase().includes(nombreAsesor.toLowerCase())
    ) || {
      usuarioId: `usr_${sucursalConfig.prefijo.toLowerCase()}_${Date.now()}`,
      nombre: nombreAsesor,
      correo: `${nombreAsesor.toLowerCase().replace(/\s+/g, '.')}@changanpanama.com`,
      rol: 'SUCURSAL_ASESOR' as const,
      sucursal: sucursalConfig.nombre,
      canal: areaAsesor || sucursalConfig.canalDefecto,
      activo: true,
      movilHabilitado: true
    };

    onCambiarUsuario(usrExistente);
    setFiltroSucursal(sucursalConfig.nombre);
    localStorage.setItem('changan_portal_sucursal_iniciada', 'true');
    localStorage.setItem('changan_sucursal_activa_id', sucursalConfig.id);
    setPantallaActual('portal');
    setTabActiva('nueva');
  };

  const handleTransmisionExitosa = (datos: ComprobantePedidoData) => {
    setComprobantePdfData(datos);
    setModalPdfAbierto(true);
    onPedidoCreado(datos.pedidoId);
  };

  // Agrupar filas de matriz por pedidoId para la vista de "Mis Pedidos"
  const pedidosAgrupados = useMemo(() => {
    const mapa = new Map<string, FilaMatrizCentral[]>();
    filas.forEach(f => {
      if (!mapa.has(f.pedidoId)) {
        mapa.set(f.pedidoId, []);
      }
      mapa.get(f.pedidoId)!.push(f);
    });

    const lista = Array.from(mapa.entries()).map(([pedidoId, items]) => {
      const primero = items[0];
      const totalSolicitada = items.reduce((acc, i) => acc + (i.cantidadSolicitada || 0), 0);
      const totalAsignada = items.reduce((acc, i) => acc + (i.cantidadAsignada || 0), 0);
      const totalDespachada = items.reduce((acc, i) => acc + (i.cantidadDespachada || 0), 0);
      
      let estadoGlobal: 'Pendiente' | 'Asignado' | 'Despachado' | 'Sin Stock' = 'Pendiente';
      if (totalDespachada >= totalSolicitada && totalSolicitada > 0) {
        estadoGlobal = 'Despachado';
      } else if (totalAsignada > 0 || totalDespachada > 0) {
        estadoGlobal = 'Asignado';
      } else if (items.some(i => i.estatusLinea === 'Sin Stock')) {
        estadoGlobal = 'Sin Stock';
      }

      return {
        pedidoId,
        cabecera: primero,
        items,
        totalLineas: items.length,
        totalSolicitada,
        totalAsignada,
        totalDespachada,
        estadoGlobal
      };
    });

    // Ordenar más recientes primero
    lista.sort((a, b) => b.cabecera.fechaCreacion.localeCompare(a.cabecera.fechaCreacion));

    return lista.filter(p => {
      // Filtro de sucursal
      if (filtroSucursal !== 'TODAS' && !p.cabecera.sucursal.toLowerCase().includes(filtroSucursal.toLowerCase())) {
        return false;
      }
      // Filtro por modelo de vehículo
      if (filtroModelo !== 'TODOS' && !p.cabecera.modeloChangan.toLowerCase().includes(filtroModelo.toLowerCase())) {
        return false;
      }
      // Filtro de búsqueda
      if (!busquedaPedidos.trim()) return true;
      const q = busquedaPedidos.toLowerCase();
      return (
        p.pedidoId.toLowerCase().includes(q) ||
        p.cabecera.cliente.toLowerCase().includes(q) ||
        p.cabecera.modeloChangan.toLowerCase().includes(q) ||
        p.cabecera.vin.toLowerCase().includes(q) ||
        p.cabecera.numeroOR.toLowerCase().includes(q) ||
        p.cabecera.placa.toLowerCase().includes(q) ||
        p.cabecera.colaborador.toLowerCase().includes(q) ||
        p.items.some(it => it.codigoRepuesto.toLowerCase().includes(q) || it.descripcionOficial.toLowerCase().includes(q))
      );
    });
  }, [filas, filtroSucursal, filtroModelo, busquedaPedidos]);

  // Inventario filtrado para la pestaña de consulta de stock
  const stockFiltrado = useMemo(() => {
    if (!busquedaStock.trim()) {
      return inventario.slice(0, 50); // Primeros 50
    }
    const q = busquedaStock.toLowerCase();
    return inventario.filter(i => 
      i.codigoRepuesto.toLowerCase().includes(q) ||
      i.descripcion.toLowerCase().includes(q) ||
      i.contenedorId.toLowerCase().includes(q) ||
      i.ubicacionCedis.toLowerCase().includes(q)
    );
  }, [inventario, busquedaStock]);

  const asesoresSucursales = USUARIOS_OFICIALES.filter(u => u.rol === 'SUCURSAL_ASESOR');

  // PÁGINA 1: ESCOGENCIA DE SUCURSAL & ASESOR ANTES DE COMENZAR EL PROCESO
  if (pantallaActual === 'seleccion_sucursal') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
        {/* Encabezado Corporativo Oficial */}
        <div className="bg-[#050b14] border border-cyan-900/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
                DISTRIBUIDORA AUTOMOTRIZ FORTUNE, SA
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                RUC: 155613501-2-2015 DV 61 &bull; Ave. Domingo Díaz, a un costado de Cardoze y Lindo, a 300 mts.
              </p>
              <p className="text-xs text-cyan-400 font-semibold tracking-wide">
                PORTAL OFICIAL DE REQUISICIÓN DE REPUESTOS SUCURSALES &bull; CEDIS PANAMÁ
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="w-12 h-12 rounded-full border-2 border-cyan-500/60 bg-cyan-950/40 flex items-center justify-center text-cyan-400 font-black text-xl shadow-lg">
                V
              </div>
              <div className="text-right sm:text-left">
                <div className="text-base font-black text-cyan-400 tracking-wider">
                  CHANGAN AUTO
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  PANAMÁ &bull; CEDIS CENTRAL
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Guía Paso 1 */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Paso 1 Obligatorio &bull; Identificación de Sucursal</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Seleccione su Sucursal para Comenzar
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Elija la sede donde se encuentra ubicado. El sistema asignará automáticamente el correlativo oficial y su canal de despacho ante CEDIS Central.
          </p>

          {/* Botón de acceso directo al Rastreador de Repuestos & DPL */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setCodigoInicialRastreo('');
                setModalRastreadorAbierto(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 hover:border-cyan-400 text-cyan-300 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              title="Rastrear repuestos asignados, llegada, estatus, pallet, contenedor y existencias DPL"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Rastreador de Repuestos & Llegadas DPL</span>
            </button>
          </div>
        </div>

        {/* Grid de Sucursales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SUCURSALES_PORTAL.map((suc) => {
            const esSucursalActiva = usuario.sucursal.toLowerCase().includes(suc.nombre.toLowerCase());

            return (
              <div
                key={suc.id}
                className={`border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                  esSucursalActiva
                    ? 'bg-gradient-to-b from-cyan-950/40 to-slate-900 border-cyan-500/80 shadow-xl shadow-cyan-500/10'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold tracking-widest uppercase text-cyan-400">
                        PREFIJO: {suc.prefijo}
                      </div>
                      <h3 className="text-lg font-black text-white">{suc.nombre}</h3>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {suc.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Canal predeterminado: <strong className="text-slate-200">{suc.canalDefecto}</strong>
                  </p>

                  {/* Asignación Directa */}
                  {suc.tipoEquipo === 'INDIVIDUAL' && suc.asesorFijo && (
                    <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 text-xs space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Asesor de Servicio:</div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{suc.asesorFijo.nombre}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {suc.asesorFijo.cargo} &bull; {suc.asesorFijo.area}
                      </div>
                    </div>
                  )}

                  {/* Asignación Equipo Múltiple */}
                  {suc.tipoEquipo === 'MULTIPLE' && suc.equipo && (
                    <div className="space-y-2">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Seleccione su nombre ({suc.equipo.length} asesores):
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {suc.equipo.map((miembro) => {
                          const esMiembroActivo = usuario.nombre === miembro.nombre && usuario.sucursal === suc.nombre;
                          return (
                            <button
                              key={miembro.id}
                              type="button"
                              onClick={() => {
                                handleConfirmarSucursalYAsesor(suc, miembro.nombre, miembro.area);
                              }}
                              className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between cursor-pointer ${
                                esMiembroActivo
                                  ? 'bg-cyan-500/20 border-cyan-400 text-white font-bold'
                                  : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                              }`}
                            >
                              <div>
                                <div className="font-semibold">{miembro.nombre}</div>
                                <div className="text-[10px] text-slate-400">{miembro.cargo} &bull; {miembro.area}</div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {suc.tipoEquipo === 'INDIVIDUAL' && suc.asesorFijo && (
                  <button
                    type="button"
                    onClick={() => {
                      handleConfirmarSucursalYAsesor(suc, suc.asesorFijo!.nombre, suc.asesorFijo!.area);
                    }}
                    className="w-full mt-4 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Entrar como {suc.asesorFijo.nombre}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Acceso a Matriz CEDIS Central */}
        {onAbrirMatrizCentral && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={onAbrirMatrizCentral}
              className="text-xs text-slate-500 hover:text-slate-300 underline transition cursor-pointer"
            >
              ¿Eres administrador de CEDIS Central? Entrar a la Matriz General
            </button>
          </div>
        )}
      </div>
    );
  }

  // PÁGINA 2: WORKSPACE DE REQUISICIÓN & MIS PEDIDOS
  return (
    <div className="space-y-6">
      {/* Barra Superior con Pestañas y Acciones Rápidas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        {/* Pestañas (Solo 2: Nueva Requisición y Mis Requisiciones) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTabActiva('nueva')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              tabActiva === 'nueva'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>+ Nueva Requisición</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('mis-pedidos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
              tabActiva === 'mis-pedidos'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Mis Requisiciones ({pedidosAgrupados.length})</span>
          </button>
        </div>

        {/* Acciones de Cabecera (Botones solicitados por el usuario) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Botón de Rastreo de Repuestos & DPL */}
          <button
            type="button"
            onClick={() => {
              setCodigoInicialRastreo('');
              setModalRastreadorAbierto(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 text-cyan-300 border border-cyan-500/50 hover:border-cyan-400 font-bold text-xs flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            title="Buscar repuestos asignados, llegada, estatus, pallet, contenedor y validar stock libre en DPL"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rastrear Repuestos / DPL</span>
          </button>

          <button
            type="button"
            onClick={() => setPantallaActual('seleccion_sucursal')}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Cambiar de sucursal o de asesor"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cambiar Sucursal / Quién Eres</span>
          </button>

          <button
            type="button"
            onClick={copiarEnlacePortal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar enlace directo al portal"
          >
            <Share2 className="w-3.5 h-3.5 text-blue-400" />
            <span>{copiadoEnlace ? '¡Enlace Copiado!' : 'Copiar Enlace Portal'}</span>
          </button>

          {onAbrirMatrizCentral && (
            <button
              type="button"
              onClick={onAbrirMatrizCentral}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Volver a la vista de administración general de CEDIS"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Matriz CEDIS</span>
            </button>
          )}
        </div>
      </div>

      {/* Contenido según la pestaña */}
      {tabActiva === 'nueva' && (
        <FormularioRequisicion
          usuario={usuario}
          onPedidoCreado={onPedidoCreado}
          onTransmisionCompleta={handleTransmisionExitosa}
          onSolicitarCambioSucursal={() => setPantallaActual('seleccion_sucursal')}
          onAbrirMatrizCentral={onAbrirMatrizCentral}
          onAbrirModalCompartir={onAbrirModalCompartir}
          onAbrirRastreador={() => {
            setCodigoInicialRastreo('');
            setModalRastreadorAbierto(true);
          }}
        />
      )}

      {tabActiva === 'mis-pedidos' && (
        <div className="space-y-4">
          {/* Filtros de la lista */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busquedaPedidos}
                onChange={(e) => setBusquedaPedidos(e.target.value)}
                placeholder="Buscar por N° Pedido, Cliente, VIN, O.R., Placa o Código OEM..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setCodigoInicialRastreo(busquedaPedidos);
                setModalRastreadorAbierto(true);
              }}
              className="bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/50 text-cyan-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm shadow-cyan-500/20"
              title="Rastreo universal de repuestos asignados, contenedores y arribos"
            >
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rastreador Global</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300">
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-slate-400">Sucursal:</span>
                <select
                  value={filtroSucursal}
                  onChange={(e) => setFiltroSucursal(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="TODAS" className="bg-slate-900">Todas las Sucursales</option>
                  <option value="Villa Lucre" className="bg-slate-900">Villa Lucre</option>
                  <option value="Costa Verde" className="bg-slate-900">Costa Verde</option>
                  <option value="Calle 50" className="bg-slate-900">Calle 50</option>
                  <option value="Tumba Muerto" className="bg-slate-900">Tumba Muerto</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-slate-400">Modelo:</span>
                <select
                  value={filtroModelo}
                  onChange={(e) => setFiltroModelo(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
                >
                  <option value="TODOS" className="bg-slate-900">Todos los Modelos</option>
                  {MODELOS_VEHICULOS_CHANGAN.map(m => (
                    <option key={m} value={m} className="bg-slate-900">{m}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setTabActiva('nueva')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer ml-auto"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>+ Nueva Requisición</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Pedidos */}
          {pedidosAgrupados.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <ClipboardList className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No se encontraron requisiciones</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No hay pedidos registrados con los filtros seleccionados. Crea una nueva solicitud para tu sucursal.
              </p>
              <button
                type="button"
                onClick={() => setTabActiva('nueva')}
                className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
              >
                Crear Primera Requisición
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {pedidosAgrupados.map((pedido) => {
                const badgeColor = 
                  pedido.estadoGlobal === 'Despachado' 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600'
                    : pedido.estadoGlobal === 'Asignado'
                    ? 'bg-sky-950/80 text-sky-300 border-sky-600'
                    : pedido.estadoGlobal === 'Sin Stock'
                    ? 'bg-rose-950/80 text-rose-300 border-rose-600'
                    : 'bg-amber-950/80 text-amber-300 border-amber-600';

                return (
                  <div 
                    key={pedido.pedidoId}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow hover:border-slate-700 transition"
                  >
                    {/* Fila Principal de Cabecera */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-mono text-sm font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-700">
                          {pedido.pedidoId}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${badgeColor}`}>
                          {pedido.estadoGlobal}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                          {pedido.cabecera.tipoPedido}
                        </span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-center gap-3">
                        <span>{pedido.cabecera.fechaCreacion.substring(0, 16)}</span>
                        <span>&bull;</span>
                        <span className="text-slate-300 font-medium">{pedido.cabecera.sucursal}</span>
                        <span>&bull;</span>
                        <span className="text-slate-300">{pedido.cabecera.colaborador}</span>
                      </div>
                    </div>

                    {/* Datos del Vehículo y Cliente */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Cliente / Aseguradora</div>
                        <div className="font-semibold text-white truncate">{pedido.cabecera.cliente || 'No especificado'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">Modelo Changan</div>
                        {(() => {
                          const mInfo = CATALOGO_MODELOS_CHANGAN.find(
                            m => m.nombre.toLowerCase() === pedido.cabecera.modeloChangan.toLowerCase()
                          );
                          return (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-sky-400 truncate">
                                {pedido.cabecera.modeloChangan}
                              </div>
                              {mInfo && (
                                <div className="text-[10px] text-slate-400 truncate">
                                  <span className="text-cyan-300 font-medium">{mInfo.categoria}</span>
                                  <span className="mx-1 text-slate-600">&bull;</span>
                                  <span className="font-mono text-slate-400">{mInfo.anosCompatibles}</span>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">VIN / Chasis</div>
                        <div className="font-mono font-medium text-slate-300 truncate">{pedido.cabecera.vin}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase">O.R. / Placa / Cot.</div>
                        <div className="font-medium text-slate-300 truncate">
                          {pedido.cabecera.numeroOR ? `O.R. ${pedido.cabecera.numeroOR}` : ''}
                          {pedido.cabecera.placa ? ` &bull; ${pedido.cabecera.placa}` : ''}
                          {pedido.cabecera.cotizacion ? ` &bull; ${pedido.cabecera.cotizacion}` : ''}
                          {!pedido.cabecera.numeroOR && !pedido.cabecera.placa && !pedido.cabecera.cotizacion && 'Sin doc.'}
                        </div>
                      </div>
                    </div>

                    {/* Líneas de Repuestos Detalladas */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                        <span>Repuestos Solicitados ({pedido.items.length} partes)</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          Asignado: {pedido.totalAsignada} / Despachado: {pedido.totalDespachada} de {pedido.totalSolicitada} unid.
                        </span>
                      </div>

                      <div className="divide-y divide-slate-800/80 bg-slate-950/40 rounded-xl border border-slate-800/80 overflow-hidden">
                        {pedido.items.map((it) => (
                          <div key={it.lineaId} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-sky-400 bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/50 text-[11px] shrink-0">
                                {it.codigoRepuesto}
                              </span>
                              <span className="text-slate-200 font-medium truncate">
                                {it.descripcionOficial || 'Repuesto genuino Changan'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                              <div className="text-right">
                                <span className="text-slate-400 text-[11px]">Cant: </span>
                                <span className="font-bold text-white">{it.cantidadSolicitada}</span>
                                {it.cantidadAsignada > 0 && (
                                  <span className="text-emerald-400 text-[11px] font-semibold ml-1.5">
                                    ({it.cantidadAsignada} asignadas)
                                  </span>
                                )}
                              </div>

                              {it.contenedorAsignado && (
                                <span className="px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-mono">
                                  Cont: {it.contenedorAsignado}
                                </span>
                              )}

                              {it.palletAsignado && (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-mono">
                                  Pallet: {it.palletAsignado}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setCodigoInicialRastreo(it.codigoRepuesto);
                                  setModalRastreadorAbierto(true);
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-950/60 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition"
                                title="Rastrear esta pieza en DPL y contenedores"
                              >
                                <Search className="w-3 h-3 text-cyan-400" />
                                <span>Rastrear</span>
                              </button>

                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                it.estatusLinea === 'Despachado'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                                  : it.estatusLinea === 'Asignado'
                                  ? 'bg-sky-950 text-sky-300 border-sky-800'
                                  : it.estatusLinea === 'Sin Stock'
                                  ? 'bg-rose-950 text-rose-300 border-rose-800'
                                  : 'bg-amber-950 text-amber-300 border-amber-800'
                              }`}>
                                {it.estatusLinea}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Comprobante Oficial & Descarga Automática de PDF */}
      {modalPdfAbierto && comprobantePdfData && (
        <ModalComprobantePDF
          isOpen={modalPdfAbierto}
          datos={comprobantePdfData}
          onClose={() => setModalPdfAbierto(false)}
          onVerMisPedidos={() => {
            setModalPdfAbierto(false);
            setTabActiva('mis-pedidos');
          }}
          onNuevoPedido={() => {
            setModalPdfAbierto(false);
            setTabActiva('nueva');
          }}
        />
      )}

      {/* Modal Rastreador Universal de Repuestos, Asignaciones y DPL */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={() => setModalRastreadorAbierto(false)}
        filas={filas}
        inventario={inventario}
        manifiestos={manifiestos}
        codigoInicial={codigoInicialRastreo}
        onSeleccionarRepuesto={(codigo) => {
          setModalRastreadorAbierto(false);
          setTabActiva('nueva');
        }}
      />
    </div>
  );
};
