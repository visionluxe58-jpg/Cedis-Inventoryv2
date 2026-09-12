import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Ship,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Boxes,
  Layers,
  Download,
  Filter,
  RefreshCw,
  PieChart as PieChartIcon,
  ShieldAlert,
  ArrowUpRight,
  Zap,
  Tag,
  Car,
  PackageCheck,
  Percent,
  Check,
  ChevronRight,
  Truck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import {
  FilaMatrizCentral,
  DPLDetalle,
  DPLManifiesto,
  AuditoriaKardex,
  TipoSolicitud,
  UsuarioActivo
} from '../types/cedis';

interface DashboardKPIsProps {
  filas: FilaMatrizCentral[];
  inventario: DPLDetalle[];
  manifiestos: DPLManifiesto[];
  auditoria?: AuditoriaKardex[];
  usuario?: UsuarioActivo;
  onActualizar: () => void;
  onNavegarModulo?: (modulo: string) => void;
}

// Paleta de colores ejecutivos sofisticada para gráficos
const PALETA_COLORES = {
  azul: '#3b82f6',
  sky: '#0284c7',
  cyan: '#06b6d4',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  purple: '#8b5cf6',
  indigo: '#6366f1',
  slate: '#64748b'
};

const COLORES_PRIORIDAD: Record<string, string> = {
  'VOR / Unidad Parada': '#f43f5e', // Rose / Rojo alerta
  'Garantía': '#f59e0b', // Amber
  'Chapistería y Colisión': '#8b5cf6', // Violeta
  'Taller Mecánico': '#3b82f6', // Azul
  'Stock Regular': '#10b981' // Esmeralda
};

export const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
  filas,
  inventario,
  manifiestos,
  onActualizar,
  onNavegarModulo
}) => {
  // Filtros interactivos del Dashboard
  const [filtroPeriodo, setFiltroPeriodo] = useState<'TODOS' | '30DIAS' | '7DIAS'>('TODOS');
  const [filtroSucursal, setFiltroSucursal] = useState<string>('TODAS');
  const [filtroTipoPedido, setFiltroTipoPedido] = useState<string>('TODOS');
  const [vistaActiva, setVistaActiva] = useState<'resumen' | 'importacion' | 'demanda' | 'cruce'>('resumen');

  // Filtrado de filas según los selectores
  const filasFiltradas = useMemo(() => {
    return filas.filter(f => {
      if (filtroSucursal !== 'TODAS' && !f.sucursal.toLowerCase().includes(filtroSucursal.toLowerCase())) {
        return false;
      }
      if (filtroTipoPedido !== 'TODOS' && f.tipoPedido !== filtroTipoPedido) {
        return false;
      }
      if (filtroPeriodo === '30DIAS' || filtroPeriodo === '7DIAS') {
        const fechaFila = new Date(f.fechaCreacion.replace(' ', 'T')).getTime();
        const dias = filtroPeriodo === '7DIAS' ? 7 : 30;
        const limite = Date.now() - (dias * 24 * 60 * 60 * 1000);
        // Si fecha válida y anterior al límite
        if (!isNaN(fechaFila) && fechaFila < limite) {
          return false;
        }
      }
      return true;
    });
  }, [filas, filtroSucursal, filtroTipoPedido, filtroPeriodo]);

  // =========================================================================
  // 1. CÁLCULO DE KPIS GLOBALES DE RENDIMIENTO
  // =========================================================================
  const kpis = useMemo(() => {
    // Pedidos únicos
    const pedidosIds = new Set(filasFiltradas.map(f => f.pedidoId));
    const totalPedidos = pedidosIds.size;

    // Conteo de piezas solicitadas, asignadas y despachadas
    let totalPiezasSolicitadas = 0;
    let totalPiezasAsignadas = 0;
    let totalPiezasDespachadas = 0;
    let totalLineasSinStock = 0;
    let totalLineasVOR = 0;
    let vorResueltas = 0;

    filasFiltradas.forEach(f => {
      const sol = Number(f.cantidadSolicitada) || 0;
      const asig = Number(f.cantidadAsignada) || 0;
      const desp = Number(f.cantidadDespachada) || 0;

      totalPiezasSolicitadas += sol;
      totalPiezasAsignadas += asig;
      totalPiezasDespachadas += desp;

      if (f.estatusLinea === 'Sin Stock') {
        totalLineasSinStock++;
      }

      if (f.tipoPedido === 'VOR / Unidad Parada') {
        totalLineasVOR++;
        if (f.estatusLinea === 'Despachado' || f.estatusLinea === 'Asignado') {
          vorResueltas++;
        }
      }
    });

    // Fill rate / Tasa de Cruce (% de piezas cubiertas por inventario)
    const piezasCubiertas = totalPiezasAsignadas + totalPiezasDespachadas;
    const fillRate = totalPiezasSolicitadas > 0 
      ? Math.round((piezasCubiertas / totalPiezasSolicitadas) * 1000) / 10 
      : 100;

    // Tasa de efectividad de despacho físico
    const tasaDespacho = totalPiezasSolicitadas > 0
      ? Math.round((totalPiezasDespachadas / totalPiezasSolicitadas) * 1000) / 10
      : 0;

    // Inventario DPL Global
    let dplTotalPiezas = 0;
    let dplComprometido = 0;
    let dplDespachado = 0;
    let dplSaldoLibre = 0;
    const skusSet = new Set<string>();

    inventario.forEach(item => {
      const tot = Number(item.cantidadTotal) || 0;
      const asig = Number(item.cantidadAsignada) || 0;
      const desp = Number(item.cantidadDespachada) || 0;
      const saldo = tot - asig - desp;

      dplTotalPiezas += tot;
      dplComprometido += asig;
      dplDespachado += desp;
      dplSaldoLibre += saldo;

      if (item.codigoRepuesto) {
        skusSet.add(item.codigoRepuesto.trim().toUpperCase());
      }
    });

    const porcentajeOcupacionDpl = dplTotalPiezas > 0
      ? Math.round(((dplComprometido + dplDespachado) / dplTotalPiezas) * 1000) / 10
      : 0;

    // Eficiencia VOR
    const tasaVORAtendida = totalLineasVOR > 0
      ? Math.round((vorResueltas / totalLineasVOR) * 1000) / 10
      : 100;

    return {
      totalPedidos,
      totalLineas: filasFiltradas.length,
      totalPiezasSolicitadas,
      totalPiezasAsignadas,
      totalPiezasDespachadas,
      totalLineasSinStock,
      totalLineasVOR,
      tasaVORAtendida,
      fillRate,
      tasaDespacho,
      dplTotalPiezas,
      dplComprometido,
      dplDespachado,
      dplSaldoLibre,
      porcentajeOcupacionDpl,
      totalSKUs: skusSet.size,
      totalContenedores: manifiestos.length
    };
  }, [filasFiltradas, inventario, manifiestos]);

  // =========================================================================
  // 2. DATOS DE DEMANDA SEGMENTADA POR TIPO DE PEDIDO (Especiales / VOR)
  // =========================================================================
  const datosTipoPedido = useMemo(() => {
    const mapa = new Map<string, { cantidadPedidos: Set<string>; piezas: number; asignadas: number }>();
    
    filasFiltradas.forEach(f => {
      const tipo = f.tipoPedido || 'Stock Regular';
      if (!mapa.has(tipo)) {
        mapa.set(tipo, { cantidadPedidos: new Set<string>(), piezas: 0, asignadas: 0 });
      }
      const entry = mapa.get(tipo)!;
      entry.cantidadPedidos.add(f.pedidoId);
      entry.piezas += Number(f.cantidadSolicitada) || 0;
      entry.asignadas += (Number(f.cantidadAsignada) || 0) + (Number(f.cantidadDespachada) || 0);
    });

    return Array.from(mapa.entries()).map(([name, data]) => {
      const fillRateTipo = data.piezas > 0 ? Math.round((data.asignadas / data.piezas) * 100) : 100;
      return {
        name,
        pedidos: data.cantidadPedidos.size,
        piezas: data.piezas,
        asignadas: data.asignadas,
        fillRate: fillRateTipo,
        color: COLORES_PRIORIDAD[name] || PALETA_COLORES.slate
      };
    }).sort((a, b) => b.piezas - a.piezas);
  }, [filasFiltradas]);

  // =========================================================================
  // 3. DATOS DE FLUJO Y ESTADO DE CONTENEDORES DE IMPORTACIÓN
  // =========================================================================
  const datosContenedores = useMemo(() => {
    return manifiestos.map(m => {
      // Cruzar con inventario DPL para calcular totales reales
      const piezasContenedor = inventario.filter(i => i.contenedorId === m.contenedorId);
      const totalPiezas = piezasContenedor.reduce((acc, i) => acc + (Number(i.cantidadTotal) || 0), 0);
      const comprometidas = piezasContenedor.reduce((acc, i) => acc + (Number(i.cantidadAsignada) || 0), 0);
      const despachadas = piezasContenedor.reduce((acc, i) => acc + (Number(i.cantidadDespachada) || 0), 0);
      const saldoLibre = totalPiezas - comprometidas - despachadas;
      const skus = new Set(piezasContenedor.map(i => i.codigoRepuesto)).size;

      const absorcionPorc = totalPiezas > 0
        ? Math.round(((comprometidas + despachadas) / totalPiezas) * 100)
        : 0;

      return {
        id: m.contenedorId,
        proveedor: m.proveedor,
        po: m.poReferencia,
        arribo: m.fechaArribo,
        transporte: m.tipoTransporte,
        totalPiezas: totalPiezas || m.totalPiezas || 0,
        comprometidas,
        despachadas,
        saldoLibre,
        skus,
        absorcionPorc
      };
    });
  }, [manifiestos, inventario]);

  // =========================================================================
  // 4. DEMANDA SEGMENTADA POR MODELO CHANGAN
  // =========================================================================
  const datosDemandaModelo = useMemo(() => {
    const mapa = new Map<string, { solicitadas: number; asignadas: number; pedidos: Set<string> }>();

    filasFiltradas.forEach(f => {
      // Normalizar nombre de modelo
      let mod = f.modeloChangan || 'Otro Modelo';
      if (mod.toLowerCase().includes('uni-t')) mod = 'UNI-T';
      else if (mod.toLowerCase().includes('cs55')) mod = 'CS55 Plus';
      else if (mod.toLowerCase().includes('cs35')) mod = 'CS35 Plus';
      else if (mod.toLowerCase().includes('hunter')) mod = 'Hunter 4x4';
      else if (mod.toLowerCase().includes('alsvin')) mod = 'Alsvin V3';
      else if (mod.toLowerCase().includes('uni-k')) mod = 'UNI-K';

      if (!mapa.has(mod)) {
        mapa.set(mod, { solicitadas: 0, asignadas: 0, pedidos: new Set<string>() });
      }
      const entry = mapa.get(mod)!;
      entry.solicitadas += Number(f.cantidadSolicitada) || 0;
      entry.asignadas += (Number(f.cantidadAsignada) || 0) + (Number(f.cantidadDespachada) || 0);
      entry.pedidos.add(f.pedidoId);
    });

    return Array.from(mapa.entries()).map(([modelo, data]) => ({
      modelo,
      solicitadas: data.solicitadas,
      asignadas: data.asignadas,
      pendientes: Math.max(0, data.solicitadas - data.asignadas),
      totalPedidos: data.pedidos.size,
      fillRate: data.solicitadas > 0 ? Math.round((data.asignadas / data.solicitadas) * 100) : 100
    })).sort((a, b) => b.solicitadas - a.solicitadas);
  }, [filasFiltradas]);

  // =========================================================================
  // 5. DEMANDA SEGMENTADA POR SUCURSAL
  // =========================================================================
  const datosDemandaSucursal = useMemo(() => {
    const mapa = new Map<string, { solicitadas: number; despachadas: number; asignadas: number; pedidos: Set<string>; vor: number }>();

    filasFiltradas.forEach(f => {
      const suc = f.sucursal || 'Sin Sucursal';
      if (!mapa.has(suc)) {
        mapa.set(suc, { solicitadas: 0, despachadas: 0, asignadas: 0, pedidos: new Set<string>(), vor: 0 });
      }
      const entry = mapa.get(suc)!;
      entry.solicitadas += Number(f.cantidadSolicitada) || 0;
      entry.despachadas += Number(f.cantidadDespachada) || 0;
      entry.asignadas += Number(f.cantidadAsignada) || 0;
      entry.pedidos.add(f.pedidoId);
      if (f.tipoPedido === 'VOR / Unidad Parada') {
        entry.vor++;
      }
    });

    return Array.from(mapa.entries()).map(([sucursal, data]) => {
      const cumplimiento = data.solicitadas > 0
        ? Math.round(((data.asignadas + data.despachadas) / data.solicitadas) * 100)
        : 100;
      return {
        sucursal,
        solicitadas: data.solicitadas,
        atendidas: data.asignadas + data.despachadas,
        despachadas: data.despachadas,
        pedidos: data.pedidos.size,
        vor: data.vor,
        cumplimiento
      };
    }).sort((a, b) => b.solicitadas - a.solicitadas);
  }, [filasFiltradas]);

  // =========================================================================
  // 6. TOP 5 REPUESTOS CON MAYOR DEMANDA CRÍTICA
  // =========================================================================
  const topRepuestosDemanda = useMemo(() => {
    const mapa = new Map<string, { descripcion: string; solicitadas: number; asignadas: number; modelo: string }>();

    filasFiltradas.forEach(f => {
      const cod = f.codigoRepuesto || 'SIN-CODIGO';
      if (!mapa.has(cod)) {
        mapa.set(cod, {
          descripcion: f.descripcionOficial || 'Repuesto Changan',
          solicitadas: 0,
          asignadas: 0,
          modelo: f.modeloChangan
        });
      }
      const entry = mapa.get(cod)!;
      entry.solicitadas += Number(f.cantidadSolicitada) || 0;
      entry.asignadas += (Number(f.cantidadAsignada) || 0) + (Number(f.cantidadDespachada) || 0);
    });

    return Array.from(mapa.entries())
      .map(([codigo, d]) => ({
        codigo,
        descripcion: d.descripcion,
        solicitadas: d.solicitadas,
        asignadas: d.asignadas,
        faltante: Math.max(0, d.solicitadas - d.asignadas),
        modelo: d.modelo
      }))
      .sort((a, b) => b.solicitadas - a.solicitadas)
      .slice(0, 6);
  }, [filasFiltradas]);

  // Exportar reporte ejecutivo en CSV
  const exportarReporteEjecutivoCSV = () => {
    const lines: string[] = [];
    lines.push('REPORTE EJECUTIVO CEDIS CHANGAN PANAMA');
    lines.push(`Fecha de Emisión,"${new Date().toLocaleString()}"`);
    lines.push(`Periodo Filtrado,"${filtroPeriodo}"`);
    lines.push(`Sucursal Filtrada,"${filtroSucursal}"`);
    lines.push('');
    lines.push('KPIS GLOBALES');
    lines.push(`Total Pedidos,${kpis.totalPedidos}`);
    lines.push(`Piezas Solicitadas,${kpis.totalPiezasSolicitadas}`);
    lines.push(`Piezas Asignadas,${kpis.totalPiezasAsignadas}`);
    lines.push(`Piezas Despachadas,${kpis.totalPiezasDespachadas}`);
    lines.push(`Fill-Rate Global (%),${kpis.fillRate}%`);
    lines.push(`Efectividad Despacho (%),${kpis.tasaDespacho}%`);
    lines.push(`Total Piezas DPL,${kpis.dplTotalPiezas}`);
    lines.push(`Piezas Saldo Libre,${kpis.dplSaldoLibre}`);
    lines.push('');
    lines.push('DEMANDA POR SUCURSAL');
    lines.push('Sucursal,Pedidos,Piezas Solicitadas,Piezas Atendidas,Piezas Despachadas,VORs,Cumplimiento %');
    datosDemandaSucursal.forEach(s => {
      lines.push(`"${s.sucursal}",${s.pedidos},${s.solicitadas},${s.atendidas},${s.despachadas},${s.vor},${s.cumplimiento}%`);
    });
    lines.push('');
    lines.push('DEMANDA POR MODELO');
    lines.push('Modelo,Pedidos,Piezas Solicitadas,Piezas Asignadas,Pendientes,Fill-Rate %');
    datosDemandaModelo.forEach(m => {
      lines.push(`"${m.modelo}",${m.totalPedidos},${m.solicitadas},${m.asignadas},${m.pendientes},${m.fillRate}%`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Reporte_Ejecutivo_CEDIS_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Ejecutiva Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/50 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-blue-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white font-black px-2 py-0.5 rounded text-xs tracking-wider shadow">
                CHANGAN
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <BarChart3 className="w-3.5 h-3.5" />
                CONTROL INTEGRAL DE RENDIMIENTO & FLUJO DE IMPORTACIÓN
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tablero Ejecutivo de KPIs & Inteligencia Logística CEDIS
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Visualización ejecutiva de volumen de pedidos especiales, estado de contenedores de importación, eficiencia de cruce en CEDIS y demanda segmentada por modelo y sucursal.
            </p>
          </div>

          {/* Acciones Rápidas de Exportación y Actualización */}
          <div className="flex items-center gap-2.5 self-start lg:self-center">
            <button
              type="button"
              onClick={exportarReporteEjecutivoCSV}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow"
              title="Descargar reporte ejecutivo en formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Exportar Reporte</span>
            </button>

            <button
              type="button"
              onClick={onActualizar}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-lg shadow-blue-600/20"
              title="Recargar métricas desde la base canónica"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar KPIs</span>
            </button>
          </div>
        </div>

        {/* Barra de Filtros Interactivos Superiores */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Filtro Periodo */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400">Periodo:</span>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODOS" className="bg-slate-900">Histórico Completo</option>
                <option value="30DIAS" className="bg-slate-900">Últimos 30 días</option>
                <option value="7DIAS" className="bg-slate-900">Últimos 7 días</option>
              </select>
            </div>

            {/* Filtro Sucursal */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] text-slate-400">Sucursal:</span>
              <select
                value={filtroSucursal}
                onChange={(e) => setFiltroSucursal(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODAS" className="bg-slate-900">Todas las Sucursales</option>
                <option value="Villa Lucre" className="bg-slate-900">Villa Lucre</option>
                <option value="Costa Verde" className="bg-slate-900">Costa Verde</option>
                <option value="Calle 50" className="bg-slate-900">Calle 50</option>
                <option value="Tumba Muerto" className="bg-slate-900">Tumba Muerto</option>
              </select>
            </div>

            {/* Filtro Tipo Pedido */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">Tipo:</span>
              <select
                value={filtroTipoPedido}
                onChange={(e) => setFiltroTipoPedido(e.target.value)}
                className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="TODOS" className="bg-slate-900">Todos los Tipos</option>
                <option value="VOR / Unidad Parada" className="bg-slate-900">VOR / Unidad Parada</option>
                <option value="Garantía" className="bg-slate-900">Garantía</option>
                <option value="Chapistería y Colisión" className="bg-slate-900">Chapistería y Colisión</option>
                <option value="Taller Mecánico" className="bg-slate-900">Taller Mecánico</option>
                <option value="Stock Regular" className="bg-slate-900">Stock Regular</option>
              </select>
            </div>
          </div>

          {/* Selector de Vistas / Pestañas de Análisis */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setVistaActiva('resumen')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                vistaActiva === 'resumen'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Control Integral
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('importacion')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                vistaActiva === 'importacion'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Flujo de Importación
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('demanda')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                vistaActiva === 'demanda'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Demanda & Sucursales
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('cruce')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                vistaActiva === 'cruce'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Eficiencia de Cruce
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TARJETAS EJECUTIVAS SUPERIORES DE RENDIMIENTO (KPI CARDS)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fill-Rate y Cobertura de Cruce */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fill-Rate en Cruce CEDIS
            </span>
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{kpis.fillRate}%</div>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3 h-3 mr-0.5" /> Meta: 85%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, kpis.fillRate)}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.totalPiezasAsignadas + kpis.totalPiezasDespachadas} de {kpis.totalPiezasSolicitadas} piezas cubiertas con stock DPL
          </p>
        </div>

        {/* KPI 2: Stock Físico Importado vs Comprometido */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Libre DPL Bodega
            </span>
            <span className="p-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{kpis.dplSaldoLibre}</div>
            <span className="text-xs text-slate-400 font-mono">
              de {kpis.dplTotalPiezas} u.
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.dplTotalPiezas > 0 ? (kpis.dplSaldoLibre / kpis.dplTotalPiezas) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.dplComprometido} piezas comprometidas a pedidos vigentes
          </p>
        </div>

        {/* KPI 3: VOR / Unidades Paradas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pedidos VOR Críticos
            </span>
            <span className={`p-1.5 rounded-lg border ${
              kpis.totalLineasVOR > 0 ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-rose-400">{kpis.totalLineasVOR}</div>
            <span className="text-[11px] font-bold text-slate-300">
              {kpis.tasaVORAtendida}% atendidos
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.tasaVORAtendida}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            Prioridad canónica #1 para vehículos paralizados en taller
          </p>
        </div>

        {/* KPI 4: Contenedores y Flujo de Importación */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow space-y-2 hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contenedores en CEDIS
            </span>
            <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
              <Ship className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-white">{kpis.totalContenedores}</div>
            <span className="text-[11px] text-blue-400 font-bold">
              {kpis.totalSKUs} SKUs Únicos
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${kpis.porcentajeOcupacionDpl}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400">
            {kpis.porcentajeOcupacionDpl}% del volumen importado ya fue asignado/despachado
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: CONTROL INTEGRAL DE RENDIMIENTO & RESUMEN EJECUTIVO             */}
      {/* ========================================================================= */}
      {vistaActiva === 'resumen' && (
        <div className="space-y-6">
          {/* Fila 1: Demanda por Tipo de Pedido y Desglose por Modelo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico 1: Demanda Segmentada por Tipo de Pedido */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    Volumen de Pedidos por Canal y Tipo de Solicitud
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">
                  {filasFiltradas.length} líneas analizadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosTipoPedido}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="piezas"
                      >
                        {datosTipoPedido.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                        formatter={(value: any, name: any) => [`${value} piezas`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs">
                  {datosTipoPedido.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-slate-200 font-medium truncate">{item.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-white">{item.piezas} u.</span>
                        <span className="text-[10px] text-slate-400 ml-1">({item.fillRate}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Gráfico 2: Demanda Segmentada por Modelo Changan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Demanda de Repuestos por Modelo Changan
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Piezas Solicitadas vs Asignadas</span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosDemandaModelo} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="modelo" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="solicitadas" name="Piezas Solicitadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="asignadas" name="Asignadas CEDIS" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Fila 2: Flujo de Contenedores y Resumen de Sucursales */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado Rápido de Contenedores */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Ship className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">
                    Estado de Contenedores de Importación en CEDIS
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setVistaActiva('importacion')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <span>Ver Detalle</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {datosContenedores.map((c) => (
                  <div key={c.id} className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60">
                          {c.id}
                        </span>
                        <span className="text-xs text-slate-300 font-medium">{c.proveedor}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          {c.transporte}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-3">
                        <span>P.O: {c.po}</span>
                        <span>&bull;</span>
                        <span>Arribo: {c.arribo}</span>
                        <span>&bull;</span>
                        <span>{c.skus} SKUs Únicos</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:text-right">
                      <div>
                        <div className="text-xs font-bold text-white">{c.totalPiezas} piezas</div>
                        <div className="text-[10px] text-slate-400">
                          {c.saldoLibre} u. libres / {c.comprometidas} asignadas
                        </div>
                      </div>

                      <div className="w-16 text-center">
                        <div className="text-xs font-bold text-emerald-400">{c.absorcionPorc}%</div>
                        <div className="text-[9px] text-slate-400 uppercase">Absorción</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Desempeño por Sucursal */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Nivel de Servicio por Sucursal
                  </h3>
                </div>
              </div>

              <div className="space-y-3">
                {datosDemandaSucursal.map((suc) => (
                  <div key={suc.sucursal} className="space-y-1.5 bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-white">{suc.sucursal}</span>
                      <span className="font-bold text-emerald-400">{suc.cumplimiento}% Cumplimiento</span>
                    </div>

                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${suc.cumplimiento}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{suc.pedidos} pedidos ({suc.solicitadas} piezas)</span>
                      {suc.vor > 0 ? (
                        <span className="text-rose-400 font-semibold">{suc.vor} VORs activos</span>
                      ) : (
                        <span className="text-emerald-400">Sin VORs pendientes</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: FLUJO DE IMPORTACIÓN & DETALLE DE CONTENEDORES                   */}
      {/* ========================================================================= */}
      {vistaActiva === 'importacion' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Ship className="w-4 h-4 text-sky-400" />
                  <span>Flujo y Capacidad de Contenedores de Importación</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Desglose de piezas totales, asignadas a requisición y saldo remanente libre en CEDIS Panamá.
                </p>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Capacidad Total Importada:</span>
                <span className="font-bold text-white bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {kpis.dplTotalPiezas} piezas
                </span>
              </div>
            </div>

            {/* Gráfico de Barras de Contenedores */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosContenedores} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="id" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="saldoLibre" name="Saldo Libre en Bodega" fill="#10b981" stackId="a" />
                  <Bar dataKey="comprometidas" name="Comprometidas en Cruce" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="despachadas" name="Despachadas Físicamente" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla Detallada de Manifiestos */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Manifiestos y Líneas DPL Activas
              </h4>
              <span className="text-xs text-slate-400">{manifiestos.length} manifiestos registrados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
                    <th className="py-3 px-4">Contenedor</th>
                    <th className="py-3 px-4">Proveedor Oficial</th>
                    <th className="py-3 px-4">P.O. / Tránsito</th>
                    <th className="py-3 px-4">Fecha Arribo</th>
                    <th className="py-3 px-4 text-center">SKUs</th>
                    <th className="py-3 px-4 text-center">Total Piezas</th>
                    <th className="py-3 px-4 text-center">Comprometido</th>
                    <th className="py-3 px-4 text-center">Saldo Libre</th>
                    <th className="py-3 px-4 text-center">% Absorción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {datosContenedores.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {c.id}
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {c.proveedor}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {c.po} &bull; {c.transporte}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {c.arribo}
                      </td>
                      <td className="py-3 px-4 text-center font-semibold text-slate-200">
                        {c.skus}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        {c.totalPiezas}
                      </td>
                      <td className="py-3 px-4 text-center font-medium text-sky-400">
                        {c.comprometidas}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-400">
                        {c.saldoLibre}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800">
                          {c.absorcionPorc}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 3: DEMANDA SEGMENTADA POR MODELO Y SUCURSAL                        */}
      {/* ========================================================================= */}
      {vistaActiva === 'demanda' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Sucursales */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">
                    Piezas Solicitadas vs Atendidas por Sucursal
                  </h3>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosDemandaSucursal} margin={{ top: 15, right: 15, left: -15, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="sucursal" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="solicitadas" name="Piezas Solicitadas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="atendidas" name="Piezas Atendidas" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Repuestos de Mayor Demanda */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Repuestos con Mayor Demanda y Rotación
                  </h3>
                </div>
                <span className="text-[11px] text-slate-400">Top 6 Repuestos OEM</span>
              </div>

              <div className="space-y-2.5">
                {topRepuestosDemanda.map((r, idx) => (
                  <div key={idx} className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sky-400">{r.codigo}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{r.modelo}</span>
                      </div>
                      <div className="text-slate-300 font-medium truncate mt-0.5">
                        {r.descripcion}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-white">{r.solicitadas} unid. pedidas</div>
                      <div className="text-[10px] text-emerald-400 font-medium">
                        {r.asignadas} cubiertas {r.faltante > 0 && <span className="text-rose-400">({r.faltante} faltantes)</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 4: EFICIENCIA DE CRUCE EN CEDIS (CROSS-DOCKING FUNNEL)              */}
      {/* ========================================================================= */}
      {vistaActiva === 'cruce' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Embudo de Flujo Logístico & Asignación CEDIS</span>
              </h3>
              <p className="text-xs text-slate-400">
                Paso a paso del flujo de cruce canónico: desde la requisición en sucursal hasta el despacho físico desde bodega.
              </p>
            </div>

            {/* Embudo Visual de 3 Etapas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Etapa 1 */}
              <div className="bg-slate-950/80 border border-blue-900/50 rounded-xl p-4 text-center space-y-2 relative">
                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                  Etapa 1: Demanda
                </span>
                <div className="text-3xl font-black text-white">{kpis.totalPiezasSolicitadas}</div>
                <div className="text-xs text-slate-300 font-medium">Piezas Solicitadas</div>
                <div className="text-[10px] text-slate-400">
                  Registradas en {kpis.totalPedidos} requisiciones de sucursales
                </div>
              </div>

              {/* Etapa 2 */}
              <div className="bg-slate-950/80 border border-sky-900/50 rounded-xl p-4 text-center space-y-2 relative">
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded-full border border-sky-800">
                  Etapa 2: Cruce & Asignación
                </span>
                <div className="text-3xl font-black text-sky-300">{kpis.totalPiezasAsignadas + kpis.totalPiezasDespachadas}</div>
                <div className="text-xs text-slate-300 font-medium">Piezas con Stock Asignado</div>
                <div className="text-[10px] text-emerald-400 font-bold">
                  {kpis.fillRate}% de cobertura automática
                </div>
              </div>

              {/* Etapa 3 */}
              <div className="bg-slate-950/80 border border-emerald-900/50 rounded-xl p-4 text-center space-y-2 relative">
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                  Etapa 3: Salida Bodega
                </span>
                <div className="text-3xl font-black text-emerald-300">{kpis.totalPiezasDespachadas}</div>
                <div className="text-xs text-slate-300 font-medium">Piezas Despachadas Físicamente</div>
                <div className="text-[10px] text-slate-400">
                  Entregadas a camión o retiradas en sucursal
                </div>
              </div>
            </div>

            {/* Diagnóstico de Líneas Sin Stock / Backorders */}
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Líneas Pendientes de Arribo / Backorder Changan Fábrica
                  </span>
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {kpis.totalLineasSinStock} líneas en espera de nuevo contenedor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                El sistema de cruce canónico monitorea continuamente los arribos de nuevos manifiestos DPL para asignar de manera automática estas piezas con prioridad a pedidos VOR y garantías.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
