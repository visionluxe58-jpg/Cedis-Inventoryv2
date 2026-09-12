import React, { useState, useMemo } from 'react';
import { 
  Table, 
  Search, 
  CheckCircle, 
  Clock, 
  Truck, 
  AlertCircle, 
  Download,
  Filter,
  Eye,
  Check,
  Package,
  Layers,
  ShieldCheck,
  UploadCloud,
  Zap,
  FileSpreadsheet,
  Box,
  RefreshCw,
  Sparkles,
  Edit3,
  Trash2,
  Mail,
  Send,
  FileText,
  CheckSquare,
  Square,
  ChevronDown
} from 'lucide-react';
import { FilaMatrizCentral, UsuarioActivo } from '../types/cedis';
import { appsScriptClient } from '../services/appsScriptClient';
import { ModalCargaMasivaMatriz } from './ModalCargaMasivaMatriz';
import { ModalCentroPlantillas } from './ModalCentroPlantillas';
import { ModalEditarPedido } from './ModalEditarPedido';
import { ModalExpedientePedido } from './ModalExpedientePedido';
import { ModalNotificacionPedido } from './ModalNotificacionPedido';
import { ModalEditarMasivo } from './ModalEditarMasivo';
import { ModalEliminarMasivo } from './ModalEliminarMasivo';
import { ModalComprobantePDF, ComprobantePedidoData } from './ModalComprobantePDF';
import { CORREO_REMITENTE_OFICIAL, normalizarEstatusLogistico } from '../utils/notificacionesPedido';

interface MatrizCentralProps {
  filas: FilaMatrizCentral[];
  usuario: UsuarioActivo;
  onActualizar: () => void;
}

export const MatrizCentral: React.FC<MatrizCentralProps> = ({
  filas,
  usuario,
  onActualizar
}) => {
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'PENDIENTE' | 'ASIGNADO' | 'DESPACHADO'>('TODOS');
  const [filtroEstatusGeneral, setFiltroEstatusGeneral] = useState<string>('TODOS');
  const [pedidosSeleccionados, setPedidosSeleccionados] = useState<string[]>([]);
  const [modalDespacho, setModalDespacho] = useState<FilaMatrizCentral | null>(null);
  const [modalCargaMasiva, setModalCargaMasiva] = useState<boolean>(false);
  const [modalPlantillas, setModalPlantillas] = useState<boolean>(false);
  const [modalEditarPedidoId, setModalEditarPedidoId] = useState<string | null>(null);
  const [modalExpedientePedidoId, setModalExpedientePedidoId] = useState<string | null>(null);
  const [modalNotificacion, setModalNotificacion] = useState<{
    open: boolean;
    datos: any | null;
    estatus: string;
  }>({
    open: false,
    datos: null,
    estatus: 'ESPERANDO ENVÍO'
  });
  const [modalEditarMasivo, setModalEditarMasivo] = useState<boolean>(false);
  const [modalEliminarMasivo, setModalEliminarMasivo] = useState<boolean>(false);
  const [modalComprobante, setModalComprobante] = useState<{
    open: boolean;
    datos: ComprobantePedidoData | null;
  }>({ open: false, datos: null });

  const [cantDespacho, setCantDespacho] = useState<number>(1);
  const [procesando, setProcesando] = useState<boolean>(false);
  const [ejecutandoMatching, setEjecutandoMatching] = useState<boolean>(false);
  const [sincronizandoSheets, setSincronizandoSheets] = useState<boolean>(false);
  const [cargandoNube, setCargandoNube] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const esRolOperativo = usuario.rol === 'ADMINISTRADOR_CEDIS' || usuario.rol === 'OPERADOR_CEDIS';

  // Métricas rápidas de matching en la Matriz
  const metricas = useMemo(() => {
    let piezasSolicitadas = 0;
    let piezasAsignadas = 0;
    let piezasDespachadas = 0;
    const palletsSet = new Set<string>();
    const contenedoresSet = new Set<string>();
    let lineasAsignadas = 0;
    let lineasPendientes = 0;

    filas.forEach(f => {
      piezasSolicitadas += (Number(f.cantidadSolicitada) || 0);
      piezasAsignadas += (Number(f.cantidadAsignada) || 0);
      piezasDespachadas += (Number(f.cantidadDespachada) || 0);

      if (f.palletAsignado) palletsSet.add(f.palletAsignado);
      if (f.contenedorAsignado) contenedoresSet.add(f.contenedorAsignado);

      if (f.estatusLinea === 'Asignado') lineasAsignadas++;
      else if (f.estatusLinea === 'Pendiente' || f.estatusLinea === 'Sin Stock') lineasPendientes++;
    });

    return {
      piezasSolicitadas,
      piezasAsignadas,
      piezasDespachadas,
      totalPallets: palletsSet.size,
      totalContenedores: contenedoresSet.size,
      lineasAsignadas,
      lineasPendientes
    };
  }, [filas]);

  const filasFiltradas = useMemo(() => {
    return filas.filter((f) => {
      // Filtro de estado de línea
      if (filtroEstado === 'PENDIENTE' && f.estatusLinea !== 'Pendiente' && f.estatusLinea !== 'Sin Stock') {
        return false;
      }
      if (filtroEstado === 'ASIGNADO' && f.estatusLinea !== 'Asignado') {
        return false;
      }
      if (filtroEstado === 'DESPACHADO' && f.estatusLinea !== 'Despachado') {
        return false;
      }

      // Filtro de Estatus General del Pedido
      if (filtroEstatusGeneral !== 'TODOS') {
        const estGeneral = (f.estatusGeneral || '').toUpperCase();
        if (!estGeneral.includes(filtroEstatusGeneral.toUpperCase())) {
          return false;
        }
      }

      // Filtro de texto multi-criterio
      if (!filtroTexto.trim()) return true;
      const q = filtroTexto.toLowerCase();
      return (
        f.pedidoId.toLowerCase().includes(q) ||
        f.codigoRepuesto.toLowerCase().includes(q) ||
        f.descripcionOficial.toLowerCase().includes(q) ||
        f.cliente.toLowerCase().includes(q) ||
        f.vin.toLowerCase().includes(q) ||
        f.sucursal.toLowerCase().includes(q) ||
        f.colaborador.toLowerCase().includes(q) ||
        f.modeloChangan.toLowerCase().includes(q) ||
        f.cotizacion.toLowerCase().includes(q) ||
        f.contenedorAsignado.toLowerCase().includes(q) ||
        f.palletAsignado.toLowerCase().includes(q) ||
        (f.estatusGeneral && f.estatusGeneral.toLowerCase().includes(q))
      );
    });
  }, [filas, filtroTexto, filtroEstado, filtroEstatusGeneral]);

  // IDs de pedidos únicos visibles en la vista filtrada
  const pedidosEnVista = useMemo(() => {
    return Array.from(new Set(filasFiltradas.map(f => f.pedidoId)));
  }, [filasFiltradas]);

  const todosSeleccionados = pedidosEnVista.length > 0 && pedidosEnVista.every(id => pedidosSeleccionados.includes(id));

  const handleToggleSeleccionarTodos = () => {
    if (todosSeleccionados) {
      setPedidosSeleccionados([]);
    } else {
      setPedidosSeleccionados(pedidosEnVista);
    }
  };

  const handleToggleSeleccionPedido = (pedidoId: string) => {
    setPedidosSeleccionados(prev => {
      if (prev.includes(pedidoId)) {
        return prev.filter(id => id !== pedidoId);
      } else {
        return [...prev, pedidoId];
      }
    });
  };

  const handleAbrirNotificacionParaPedido = (pedidoId: string, nuevoEstatus?: string) => {
    const filasPedido = filas.filter(f => f.pedidoId === pedidoId);
    if (filasPedido.length === 0) return;
    const f0 = filasPedido[0];
    const estatusFinal = nuevoEstatus || f0.estatusGeneral || 'ESPERANDO ENVÍO';

    const cabeceras = appsScriptClient.getCabeceras();
    const cab = cabeceras.find(c => c.pedidoId === pedidoId);

    setModalNotificacion({
      open: true,
      estatus: estatusFinal,
      datos: {
        pedidoId,
        fechaCreacion: cab?.fechaCreacion || f0.fechaCreacion,
        sucursal: cab?.sucursal || f0.sucursal,
        colaborador: cab?.colaborador || f0.colaborador,
        cliente: cab?.cliente || f0.cliente,
        placa: cab?.placa || f0.placa,
        modeloChangan: cab?.modeloChangan || f0.modeloChangan,
        cotizacion: cab?.cotizacion || f0.cotizacion,
        canal: cab?.canal || (f0 as any).canal || 'Taller',
        tipoPedido: cab?.tipoPedido || f0.tipoPedido,
        estadoPago: cab?.estadoPago || 'GARANTIA',
        estatusActual: estatusFinal,
        items: filasPedido.map(fp => ({
          codigoRepuesto: fp.codigoRepuesto,
          descripcionOficial: fp.descripcionOficial,
          cantidadSolicitada: fp.cantidadSolicitada,
          cantidadAsignada: fp.cantidadAsignada,
          cantidadDespachada: fp.cantidadDespachada,
          palletAsignado: fp.palletAsignado,
          contenedorAsignado: fp.contenedorAsignado,
          ubicacionCedis: fp.ubicacionCedis,
          estatusLinea: fp.estatusLinea
        }))
      }
    });
  };

  const handleAbrirComprobante = (pedidoId: string) => {
    const filasPedido = filas.filter(f => f.pedidoId === pedidoId);
    if (filasPedido.length === 0) return;
    const f0 = filasPedido[0];
    const cabeceras = appsScriptClient.getCabeceras();
    const cab = cabeceras.find(c => c.pedidoId === pedidoId);

    setModalComprobante({
      open: true,
      datos: {
        pedidoId: f0.pedidoId,
        cliente: cab?.cliente || f0.cliente,
        sucursal: cab?.sucursal || f0.sucursal,
        asesor: cab?.colaborador || f0.colaborador,
        cotizacion: cab?.cotizacion || f0.cotizacion,
        fechaEmision: cab?.fechaCreacion || f0.fechaCreacion,
        modeloAuto: cab?.modeloChangan || f0.modeloChangan,
        placa: cab?.placa || f0.placa,
        canal: cab?.canal || (f0 as any).canal || 'Taller',
        tipoPedido: cab?.tipoPedido || f0.tipoPedido,
        estadoPago: cab?.estadoPago || 'GARANTIA',
        facturaFiscal: cab?.documentoPagoFactura,
        vin: f0.vin,
        idTransmision: `TX-${Date.now().toString(36).toUpperCase()}`,
        fechaGenerado: new Date().toISOString(),
        piezas: filasPedido.map(fp => ({
          codigo: fp.codigoRepuesto,
          descripcion: fp.descripcionOficial,
          cantidad: fp.cantidadSolicitada
        }))
      }
    });
  };

  const handleCambiarEstatusRapidoTabla = async (pedidoId: string, nuevoEstatus: string) => {
    const res = await appsScriptClient.cambiarEstatusPedido(
      pedidoId,
      nuevoEstatus,
      `Cambio de estatus rápido desde la Matriz Central a: ${nuevoEstatus}`
    );
    if (res.success) {
      onActualizar();
      setMensaje({ tipo: 'ok', texto: `Pedido ${pedidoId}: Estatus actualizado a ${nuevoEstatus}.` });
      // Abrir modal de notificación automáticamente para enviar por changanBodega2@outlook.es o WhatsApp
      handleAbrirNotificacionParaPedido(pedidoId, nuevoEstatus);
    }
  };

  const handleEjecutarDespacho = async () => {
    if (!modalDespacho) return;
    setProcesando(true);
    setMensaje(null);

    const res = await appsScriptClient.despacharLinea(modalDespacho.lineaId, cantDespacho);
    setProcesando(false);

    if (res.success) {
      setMensaje({ tipo: 'ok', texto: res.message || 'Despacho completado con éxito.' });
      setModalDespacho(null);
      onActualizar();
    } else {
      setMensaje({ tipo: 'error', texto: res.error || 'Error al despachar el repuesto.' });
    }
  };

  const handleEjecutarMatchingGlobal = async () => {
    setEjecutandoMatching(true);
    setMensaje(null);

    try {
      const res = appsScriptClient.ejecutarMatchingGlobal();
      onActualizar();
      setMensaje({
        tipo: 'ok',
        texto: res.mensaje || `Matching FIFO completado: ${res.piezasAsignadas} piezas asignadas a pedidos pendientes en ${res.palletsInvolucrados.length} pallets.`
      });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: 'Error al ejecutar el matching: ' + e.message });
    } finally {
      setEjecutandoMatching(false);
    }
  };

  const handleSincronizarSheets = async () => {
    setSincronizandoSheets(true);
    setMensaje(null);

    try {
      const res = await appsScriptClient.sincronizarMatrizConGoogleSheets();
      setMensaje({
        tipo: res.ok ? 'ok' : 'error',
        texto: res.mensaje
      });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: 'Error al sincronizar con Google Sheets: ' + e.message });
    } finally {
      setSincronizandoSheets(false);
    }
  };

  const handleRecargarDesdeSheets = async () => {
    setCargandoNube(true);
    setMensaje(null);

    try {
      const res = await appsScriptClient.fetchInitialData(true);
      onActualizar();
      if (res.success && res.totalCargado) {
        setMensaje({
          tipo: 'ok',
          texto: `Datos vivos sincronizados desde Google Sheets: ${res.totalCargado.cabeceras} pedidos y ${res.totalCargado.dplDetalle} lotes de inventario DPL.`
        });
      } else if (res.error) {
        setMensaje({
          tipo: 'ok',
          texto: res.error
        });
      }
    } catch (e: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al consultar datos desde Google Sheets: ' + (e.message || e)
      });
    } finally {
      setCargandoNube(false);
    }
  };

  const exportarCSV = () => {
    const headers = [
      'Pedido', 'Línea', 'Fecha', 'Sucursal', 'Asesor', 'Tipo Pedido', 'Cotización',
      'Cliente', 'Modelo', 'VIN', 'Código OEM', 'Descripción', 'Cant Solicitada',
      'Cant Asignada', 'Cant Despachada', 'Saldo Pendiente', 'Contenedor', 'Pallet',
      'Ubicación', 'Estatus Línea', 'Estatus Pedido'
    ];

    const rows = filasFiltradas.map(f => [
      f.pedidoId,
      f.lineaId,
      `"${f.fechaCreacion}"`,
      `"${f.sucursal}"`,
      `"${f.colaborador}"`,
      `"${f.tipoPedido}"`,
      `"${f.cotizacion}"`,
      `"${f.cliente.replace(/"/g, '""')}"`,
      `"${f.modeloChangan}"`,
      `"${f.vin}"`,
      `"${f.codigoRepuesto}"`,
      `"${f.descripcionOficial.replace(/"/g, '""')}"`,
      f.cantidadSolicitada,
      f.cantidadAsignada,
      f.cantidadDespachada,
      f.saldoPendiente,
      f.contenedorAsignado,
      f.palletAsignado,
      `"${f.ubicacionCedis}"`,
      f.estatusLinea,
      f.estatusGeneral
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriz_Central_CEDIS_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Tarjetas Resumen de Matching y Estado */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 border-t-2 border-t-sky-500 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Total en Matriz</span>
            <Table className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono">{filas.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{metricas.piezasSolicitadas} unidades solicitadas</div>
        </div>

        <div className="bg-slate-900 border border-emerald-900/40 border-t-2 border-t-emerald-500 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-emerald-400 uppercase font-semibold">Asignadas en Pallets</span>
            <Box className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-300 font-mono">
            {metricas.piezasAsignadas} u.
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-0.5 font-medium">
            En {metricas.totalPallets} pallets ({metricas.totalContenedores} contenedores)
          </div>
        </div>

        <div className="bg-slate-900 border border-amber-900/40 border-t-2 border-t-amber-500 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-amber-400 uppercase font-semibold">Pendientes de Stock</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-amber-300 font-mono">
            {metricas.piezasSolicitadas - metricas.piezasAsignadas - metricas.piezasDespachadas} u.
          </div>
          <div className="text-[11px] text-amber-400/80 mt-0.5">
            {metricas.lineasPendientes} líneas requieren arribo / fábrica
          </div>
        </div>

        <div className="bg-slate-900 border border-purple-900/40 border-t-2 border-t-purple-500 rounded-xl p-3.5 shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-purple-400 uppercase font-semibold">Despachadas</span>
            <Truck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-purple-300 font-mono">
            {metricas.piezasDespachadas} u.
          </div>
          <div className="text-[11px] text-purple-400/80 mt-0.5">Entregadas a sucursales</div>
        </div>
      </div>

      {/* Cabecera y Barra de Acciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
              Matriz_Central
            </span>
            <span className="text-xs text-slate-400">
              Matching Automático de Pallets, Contenedor y Cliente
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Table className="w-5 h-5 text-sky-400" />
            Matriz Central Consolidada de Pedidos
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Botón: Centro de Plantillas Oficiales */}
          <button
            onClick={() => setModalPlantillas(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 transition shadow shrink-0 cursor-pointer"
            title="Descargar plantillas oficiales de Excel/CSV para pedidos de sucursales o matriz completa"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Plantillas (.xlsx)</span>
          </button>

          {/* Botón Principal: Carga Masiva de Pedidos */}
          <button
            onClick={() => setModalCargaMasiva(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition cursor-pointer"
            title="Subir pedidos masivamente desde archivo Excel, CSV o Portapapeles"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Carga Masiva de Pedidos</span>
          </button>

          {/* Botón: Ejecutar Matching FIFO */}
          <button
            onClick={handleEjecutarMatchingGlobal}
            disabled={ejecutandoMatching}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-500 text-white transition shadow disabled:opacity-50"
            title="Re-ejecutar matching FIFO de prioridad (VOR > Garantía > Chapistería > Taller > Stock) contra los pallets disponibles"
          >
            <Zap className={`w-3.5 h-3.5 ${ejecutandoMatching ? 'animate-spin' : ''}`} />
            <span>{ejecutandoMatching ? 'Matching...' : 'Matching FIFO'}</span>
          </button>

          {/* Botón: Sincronizar con Google Sheets */}
          <button
            onClick={handleSincronizarSheets}
            disabled={sincronizandoSheets}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition shrink-0 disabled:opacity-50"
            title="Enviar los datos consolidados a la hoja Google Sheets (Pestaña Matriz_Central)"
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${sincronizandoSheets ? 'animate-spin' : ''}`} />
            <span>{sincronizandoSheets ? 'Sincronizando...' : 'Sync Sheets'}</span>
          </button>

          {/* Botón: Traer de Sheets (Carga Bidireccional getInitialData) */}
          <button
            onClick={handleRecargarDesdeSheets}
            disabled={cargandoNube}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-md shadow-sky-900/30 border border-sky-400/30 transition shrink-0 disabled:opacity-50 cursor-pointer"
            title="Traer información viva y actualizada de pedidos e inventario desde Google Sheets (getInitialData)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargandoNube ? 'animate-spin' : ''}`} />
            <span>{cargandoNube ? 'Trayendo...' : 'Traer de Sheets'}</span>
            <span className="hidden xl:inline-block text-[9px] px-1.5 py-0.5 bg-white/20 rounded font-bold uppercase tracking-wider">En Vivo</span>
          </button>

          {/* Exportar CSV */}
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0"
            title="Exportar a CSV"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </div>

      {mensaje && (
        <div className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 shadow ${
          mensaje.tipo === 'ok' ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200' : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
        }`}>
          {mensaje.tipo === 'ok' ? <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Buscador, Filtros de Línea y Filtros de Estatus General de Pedidos */}
      <div className="space-y-2.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filtroTexto}
              onChange={(e) => setFiltroTexto(e.target.value)}
              placeholder="Buscar por código, pallet, contenedor, cliente, VIN, pedido, estatus..."
              className="bg-slate-900 border border-slate-800 text-xs rounded-lg pl-9 pr-3 py-2 text-white w-full focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto">
            {[
              { id: 'TODOS', label: `Todos (${filas.length})` },
              { id: 'ASIGNADO', label: `Asignados (${metricas.lineasAsignadas})` },
              { id: 'PENDIENTE', label: `Pendientes (${metricas.lineasPendientes})` },
              { id: 'DESPACHADO', label: 'Despachados' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFiltroEstado(tab.id as any)}
                className={`px-3 py-1.5 rounded-md font-semibold transition whitespace-nowrap cursor-pointer ${
                  filtroEstado === tab.id
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtro Rápido por Estatus General de Solicitud */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
            Estatus General:
          </span>
          {[
            { id: 'TODOS', label: 'Todos los Estatus' },
            { id: 'PENDIENTE', label: 'Pendiente' },
            { id: 'EN TRÁNSITO', label: 'En Tránsito' },
            { id: 'EN BODEGA CEDIS', label: 'En Bodega CEDIS' },
            { id: 'ESPERANDO ENVÍO', label: 'Esperando Envío' },
            { id: 'DESPACHADO', label: 'Despachado' },
            { id: 'RECIBIDO', label: 'Recibido' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setFiltroEstatusGeneral(item.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap border cursor-pointer ${
                filtroEstatusGeneral === item.id
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* BARRA FLOTANTE DE ACCIONES MASIVAS CUANDO HAY SELECCIONADOS */}
      {pedidosSeleccionados.length > 0 && (
        <div className="bg-gradient-to-r from-slate-950 via-cyan-950/80 to-slate-950 border border-cyan-500/50 rounded-xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-xs">
                {pedidosSeleccionados.length} {pedidosSeleccionados.length === 1 ? 'pedido seleccionado' : 'pedidos seleccionados'}
              </span>
              <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline">
                (Acciones aplicables al lote completo en Matriz Central)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Editar Masivo */}
            <button
              type="button"
              onClick={() => setModalEditarMasivo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow transition cursor-pointer"
              title="Modificar estatus, sucursal o prioridad en los pedidos seleccionados"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Masivamente</span>
            </button>

            {/* Botón Eliminar Masivo */}
            <button
              type="button"
              onClick={() => setModalEliminarMasivo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold bg-rose-900/80 hover:bg-rose-800 text-rose-200 border border-rose-700/60 shadow transition cursor-pointer"
              title="Eliminar permanentemente los pedidos seleccionados"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Borrar Masivamente</span>
            </button>

            {/* Botón Notificar Lote */}
            <button
              type="button"
              onClick={() => handleAbrirNotificacionParaPedido(pedidosSeleccionados[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition cursor-pointer"
              title={`Generar notificación desde ${CORREO_REMITENTE_OFICIAL}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Notificar Lote ({CORREO_REMITENTE_OFICIAL})</span>
              <span className="md:hidden">Notificar</span>
            </button>

            {/* Deseleccionar */}
            <button
              type="button"
              onClick={() => setPedidosSeleccionados([])}
              className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Tabla de Matriz Central con Pallets y Contenedores */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase sticky top-0 z-10 border-b border-slate-800 font-mono text-[10px]">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={todosSeleccionados}
                    onChange={handleToggleSeleccionarTodos}
                    className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
                    title="Seleccionar o deseleccionar todos los pedidos visibles"
                  />
                </th>
                <th className="px-3.5 py-3">ID Pedido / Prioridad</th>
                <th className="px-3.5 py-3">Sucursal / Asesor</th>
                <th className="px-3.5 py-3">Cliente / Cotización</th>
                <th className="px-3.5 py-3">Modelo / VIN</th>
                <th className="px-3.5 py-3">Repuesto OEM</th>
                <th className="px-3.5 py-3 text-center">Cantidades</th>
                <th className="px-3.5 py-3">Matching (Contenedor / Pallet)</th>
                <th className="px-3.5 py-3 text-center">Estatus General</th>
                <th className="px-3.5 py-3 text-center min-w-[140px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    No hay solicitudes que coincidan con la búsqueda. Puedes subir pedidos masivamente con el botón superior.
                  </td>
                </tr>
              ) : (
                filasFiltradas.map((fila) => {
                  const seleccionado = pedidosSeleccionados.includes(fila.pedidoId);
                  const estatusGen = fila.estatusGeneral || 'PENDIENTE';
                  const metaEst = normalizarEstatusLogistico(estatusGen);

                  return (
                    <tr
                      key={fila.lineaId}
                      className={`transition ${
                        seleccionado
                          ? 'bg-cyan-950/30 hover:bg-cyan-950/40'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Checkbox de selección masiva */}
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => handleToggleSeleccionPedido(fila.pedidoId)}
                          className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 bg-slate-900 border-slate-700 cursor-pointer"
                        />
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setModalExpedientePedidoId(fila.pedidoId)}
                            className="font-bold text-white font-mono hover:text-cyan-400 transition cursor-pointer text-left"
                            title="Ver expediente completo del pedido"
                          >
                            {fila.pedidoId}
                          </button>
                        </div>
                        <div className="text-[10px]">
                          <span className={`font-semibold ${
                            fila.tipoPedido.includes('VOR') ? 'text-rose-400' :
                            fila.tipoPedido.includes('Garantía') ? 'text-amber-400' :
                            fila.tipoPedido.includes('Chapistería') ? 'text-purple-400' : 'text-slate-300'
                          }`}>
                            {fila.tipoPedido}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{fila.fechaCreacion.substring(0, 10)}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-slate-200 font-medium">{fila.sucursal}</div>
                        <div className="text-[11px] text-slate-400">{fila.colaborador}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-slate-100 truncate max-w-[160px]" title={fila.cliente}>
                          {fila.cliente}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {fila.cotizacion || fila.numeroOR || '-'}
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-slate-200 font-medium">{fila.modeloChangan}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{fila.vin || 'Sin VIN'}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-mono text-sky-400 font-bold">{fila.codigoRepuesto}</div>
                        <div className="text-slate-300 text-[11px] truncate max-w-[180px]" title={fila.descripcionOficial}>
                          {fila.descripcionOficial}
                        </div>
                      </td>

                      <td className="px-3.5 py-3 text-center">
                        <div className="font-bold text-white text-sm">{fila.cantidadSolicitada} u.</div>
                        <div className="text-[10px] text-slate-400">
                          {fila.cantidadAsignada > 0 && <span className="text-emerald-400 font-semibold">{fila.cantidadAsignada} asig. </span>}
                          {fila.cantidadDespachada > 0 && <span className="text-purple-400 font-semibold">{fila.cantidadDespachada} desp.</span>}
                          {fila.saldoPendiente > 0 && <span className="text-amber-400 font-semibold">{fila.saldoPendiente} pend.</span>}
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        {fila.contenedorAsignado ? (
                          <div>
                            <div className="font-semibold text-emerald-300 flex items-center gap-1 text-[11px]">
                              <Box className="w-3 h-3 text-emerald-400" />
                              <span>{fila.contenedorAsignado}</span>
                            </div>
                            <div className="text-[11px] text-slate-300 font-mono">
                              Pallet: <strong className="text-white">{fila.palletAsignado}</strong> {fila.packageNo ? `(${fila.packageNo})` : ''}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-[170px]" title={fila.ubicacionCedis}>
                              {fila.ubicacionCedis}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500 italic text-[11px]">
                            Sin asignación de pallet (Requiere Arribo)
                          </div>
                        )}
                      </td>

                      {/* Estatus General con Cambio Rápido e Indicador */}
                      <td className="px-3.5 py-3 text-center">
                        <div className="inline-block">
                          <select
                            value={estatusGen}
                            onChange={(e) => handleCambiarEstatusRapidoTabla(fila.pedidoId, e.target.value)}
                            className="bg-slate-950 border border-slate-700 hover:border-cyan-400 rounded-lg px-2 py-1 text-[10px] font-bold text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-400 cursor-pointer text-center"
                            title="Haz clic para cambiar el estatus y generar la notificación oficial"
                          >
                            <option value="PENDIENTE">PENDIENTE</option>
                            <option value="EN TRÁNSITO">EN TRÁNSITO</option>
                            <option value="EN BODEGA CEDIS">EN BODEGA CEDIS</option>
                            <option value="ESPERANDO ENVÍO">ESPERANDO ENVÍO</option>
                            <option value="DESPACHADO A SUCURSAL">DESPACHADO A SUCURSAL</option>
                            <option value="RECIBIDO EN SUCURSAL">RECIBIDO EN SUCURSAL</option>
                          </select>
                        </div>
                      </td>

                      {/* Acciones por Fila */}
                      <td className="px-3.5 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Ver Expediente */}
                          <button
                            type="button"
                            onClick={() => setModalExpedientePedidoId(fila.pedidoId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                            title="Ver expediente completo y bitácora de llamadas"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Editar Pedido */}
                          <button
                            type="button"
                            onClick={() => setModalEditarPedidoId(fila.pedidoId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
                            title="Editar pedido y repuestos"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Notificar por Correo / WhatsApp */}
                          <button
                            type="button"
                            onClick={() => handleAbrirNotificacionParaPedido(fila.pedidoId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 transition cursor-pointer"
                            title={`Enviar notificación desde ${CORREO_REMITENTE_OFICIAL} o WhatsApp`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* Despachar si aplica */}
                          {esRolOperativo && fila.cantidadAsignada > 0 && (
                            <button
                              onClick={() => {
                                setModalDespacho(fila);
                                setCantDespacho(fila.cantidadAsignada);
                              }}
                              className="p-1.5 rounded-lg text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 transition cursor-pointer"
                              title="Despachar físicamente a sucursal"
                            >
                              <Truck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Editar Pedido */}
      <ModalEditarPedido
        isOpen={modalEditarPedidoId !== null}
        onClose={() => setModalEditarPedidoId(null)}
        pedidoId={modalEditarPedidoId}
        filasMatriz={filas}
        onPedidoGuardado={() => {
          onActualizar();
          setMensaje({ tipo: 'ok', texto: 'Pedido actualizado exitosamente en la Matriz Central.' });
        }}
        onEliminarPedido={(id) => {
          onActualizar();
          setMensaje({ tipo: 'ok', texto: `Pedido ${id} eliminado.` });
        }}
        onAbrirNotificacion={(datos, est) => {
          setModalNotificacion({
            open: true,
            datos,
            estatus: est
          });
        }}
      />

      {/* Modal Expediente de Pedido */}
      <ModalExpedientePedido
        isOpen={modalExpedientePedidoId !== null}
        onClose={() => setModalExpedientePedidoId(null)}
        pedidoId={modalExpedientePedidoId}
        filasMatriz={filas}
        onActualizar={onActualizar}
        onEditarPedido={(id) => {
          setModalExpedientePedidoId(null);
          setModalEditarPedidoId(id);
        }}
        onEliminarPedido={(id) => {
          setModalExpedientePedidoId(null);
          onActualizar();
        }}
        onAbrirNotificacion={(datos, est) => {
          setModalNotificacion({
            open: true,
            datos,
            estatus: est
          });
        }}
        onImprimirComprobante={(id) => handleAbrirComprobante(id)}
      />

      {/* Modal Notificación Oficial por Correo / WhatsApp */}
      <ModalNotificacionPedido
        isOpen={modalNotificacion.open}
        onClose={() => setModalNotificacion({ open: false, datos: null, estatus: 'ESPERANDO ENVÍO' })}
        datosPedido={modalNotificacion.datos}
        estatusInicial={modalNotificacion.estatus}
        onEstatusCambiado={async (nuevoEstatus) => {
          if (modalNotificacion.datos?.pedidoId) {
            await appsScriptClient.cambiarEstatusPedido(modalNotificacion.datos.pedidoId, nuevoEstatus);
            onActualizar();
          }
        }}
      />

      {/* Modal Edición Masiva */}
      <ModalEditarMasivo
        isOpen={modalEditarMasivo}
        onClose={() => setModalEditarMasivo(false)}
        pedidoIds={pedidosSeleccionados}
        onActualizadoExitoso={() => {
          onActualizar();
          setMensaje({
            tipo: 'ok',
            texto: `${pedidosSeleccionados.length} pedidos actualizados correctamente en la Matriz Central.`
          });
          setPedidosSeleccionados([]);
        }}
        onAbrirNotificacionLote={(ids, est) => {
          if (ids.length > 0) {
            handleAbrirNotificacionParaPedido(ids[0], est);
          }
        }}
      />

      {/* Modal Eliminación Masiva */}
      <ModalEliminarMasivo
        isOpen={modalEliminarMasivo}
        onClose={() => setModalEliminarMasivo(false)}
        pedidoIds={pedidosSeleccionados}
        onEliminadoExitoso={() => {
          onActualizar();
          setMensaje({
            tipo: 'ok',
            texto: `Se eliminaron ${pedidosSeleccionados.length} pedidos seleccionados.`
          });
          setPedidosSeleccionados([]);
        }}
      />

      {/* Modal Comprobante Oficial PDF */}
      {modalComprobante.datos && (
        <ModalComprobantePDF
          isOpen={modalComprobante.open}
          onClose={() => setModalComprobante({ open: false, datos: null })}
          datos={modalComprobante.datos}
        />
      )}

      {/* Modal Carga Masiva */}
      <ModalCargaMasivaMatriz
        isOpen={modalCargaMasiva}
        onClose={() => setModalCargaMasiva(false)}
        onImportadoExitoso={() => {
          onActualizar();
          setMensaje({
            tipo: 'ok',
            texto: 'Pedidos importados y reflejados en Matriz Central con matching de pallets y contenedores exitoso.'
          });
        }}
      />

      {/* Modal Centro de Plantillas Oficiales */}
      <ModalCentroPlantillas
        isOpen={modalPlantillas}
        onClose={() => setModalPlantillas(false)}
      />

      {/* Modal Confirmación de Despacho */}
      {modalDespacho && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-purple-400" />
              Confirmar Despacho Físico a Sucursal
            </h3>
            <p className="text-xs text-slate-300">
              Esta acción es irreversible y registrará la salida física del repuesto en el Kardex y en la bitácora inmutable.
            </p>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs space-y-1.5">
              <div><strong className="text-slate-400">Pedido:</strong> <span className="text-white font-mono">{modalDespacho.pedidoId}</span></div>
              <div><strong className="text-slate-400">Cliente:</strong> <span className="text-white">{modalDespacho.cliente}</span></div>
              <div><strong className="text-slate-400">Repuesto:</strong> <span className="text-sky-300 font-mono">{modalDespacho.codigoRepuesto}</span> - {modalDespacho.descripcionOficial}</div>
              <div><strong className="text-slate-400">Destino:</strong> <span className="text-white">{modalDespacho.sucursal} ({modalDespacho.colaborador})</span></div>
              <div><strong className="text-slate-400">Lote Origen:</strong> <span className="text-emerald-400 font-semibold">{modalDespacho.contenedorAsignado} (Pallet {modalDespacho.palletAsignado})</span></div>
              <div><strong className="text-slate-400">Cantidad Asignada:</strong> <span className="text-white font-bold">{modalDespacho.cantidadAsignada} u.</span></div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Cantidad a despachar:</label>
              <input
                type="number"
                min={1}
                max={modalDespacho.cantidadAsignada}
                value={cantDespacho}
                onChange={(e) => setCantDespacho(Math.min(modalDespacho.cantidadAsignada, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalDespacho(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleEjecutarDespacho}
                disabled={procesando}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                {procesando ? 'Despachando...' : 'Confirmar y Grabar en Kardex'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
