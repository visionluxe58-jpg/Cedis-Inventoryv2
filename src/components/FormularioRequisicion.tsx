import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  UserCheck, 
  Car, 
  Plus, 
  Trash2, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Copy, 
  RefreshCw, 
  Sparkles, 
  FileText, 
  DollarSign, 
  Lock, 
  ExternalLink, 
  Share2, 
  Zap,
  Check,
  X,
  Tag
} from 'lucide-react';
import { UsuarioActivo, TipoSolicitud } from '../types/cedis';
import { appsScriptClient } from '../services/appsScriptClient';
import { 
  SUCURSALES_PORTAL, 
  CATALOGO_MODELOS_CHANGAN, 
  CATEGORIAS_MODELOS, 
  ModeloVehiculoChangan,
  ConfiguracionSucursal 
} from '../data/sucursalesData';
import { ModalSeleccionSucursal } from './ModalSeleccionSucursal';
import { ModalComprobantePDF, ComprobantePedidoData } from './ModalComprobantePDF';

export interface FormularioRequisicionProps {
  usuario: UsuarioActivo;
  onPedidoCreado: (pedidoId: string) => void;
  onTransmisionCompleta?: (datos: ComprobantePedidoData) => void;
  onSolicitarCambioSucursal?: () => void;
  onAbrirMatrizCentral?: () => void;
  onAbrirModalCompartir?: () => void;
  onAbrirRastreador?: () => void;
}

export const FormularioRequisicion: React.FC<FormularioRequisicionProps> = ({
  usuario,
  onPedidoCreado,
  onTransmisionCompleta,
  onSolicitarCambioSucursal,
  onAbrirMatrizCentral,
  onAbrirModalCompartir,
  onAbrirRastreador,
}) => {
  // Configuración inicial de sucursal
  const sucursalInicial = usuario.sucursal && !usuario.sucursal.includes('Central') 
    ? usuario.sucursal 
    : 'Costa Verde';
  
  const colaboradorInicial = usuario.nombre && !usuario.nombre.includes('Administrador')
    ? usuario.nombre
    : 'Arquímedes Jordan';

  const canalInicial = usuario.canal && usuario.canal !== 'CEDIS Central'
    ? usuario.canal
    : 'Taller';

  // Estados del Formulario
  const [sucursal, setSucursal] = useState<string>(sucursalInicial);
  const [colaborador, setColaborador] = useState<string>(colaboradorInicial);
  const [canal, setCanal] = useState<string>(canalInicial);
  const [numeroPedido, setNumeroPedido] = useState<string>(() => 
    appsScriptClient.generarNumeroPedidoUnico(sucursalInicial)
  );

  const [tipoSolicitud, setTipoSolicitud] = useState<string>('Pedido Especial (Regular)');
  const [cliente, setCliente] = useState<string>('');
  const [placa, setPlaca] = useState<string>('');
  const [modeloChangan, setModeloChangan] = useState<string>('CS15');
  const [cotizacion, setCotizacion] = useState<string>('');
  const [vin, setVin] = useState<string>('');

  // Información detallada del modelo Changan seleccionado (Categoría y Años Compatibles)
  const modeloSeleccionadoInfo: ModeloVehiculoChangan | undefined = useMemo(() => {
    return CATALOGO_MODELOS_CHANGAN.find(m => m.nombre === modeloChangan);
  }, [modeloChangan]);
  
  const [condicionPago, setCondicionPago] = useState<string>('Cancelado (100% Pagado / Facturado)');
  const [facturaFiscal, setFacturaFiscal] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');

  const [items, setItems] = useState<Array<{ codigoRepuesto: string; descripcionOficial: string; cantidadSolicitada: number }>>([
    { codigoRepuesto: '', descripcionOficial: '', cantidadSolicitada: 1 }
  ]);

  const [enviando, setEnviando] = useState<boolean>(false);
  const [mensajeEstado, setMensajeEstado] = useState<{ tipo: 'exito' | 'error' | 'info'; texto: string } | null>(null);
  const [copiadoId, setCopiadoId] = useState<boolean>(false);
  const [copiadoEnlace, setCopiadoEnlace] = useState<boolean>(false);

  // Modales
  const [modalSucursalAbierto, setModalSucursalAbierto] = useState<boolean>(false);
  const [modalBuscadorCatalogoAbierto, setModalBuscadorCatalogoAbierto] = useState<boolean>(false);
  const [indiceFilaParaBuscador, setIndiceFilaParaBuscador] = useState<number | null>(null);
  const [terminoBusquedaCatalogo, setTerminoBusquedaCatalogo] = useState<string>('');
  
  // Modal de Comprobante PDF generado
  const [modalPdfAbierto, setModalPdfAbierto] = useState<boolean>(false);
  const [datosComprobantePdf, setDatosComprobantePdf] = useState<ComprobantePedidoData | null>(null);

  const inventarioDpl = appsScriptClient.getDPLDetalle();

  // Si cambia la sucursal, regenerar número de pedido único para esa sucursal
  const regenerarNumero = (sucursalRef?: string) => {
    const nuevoId = appsScriptClient.generarNumeroPedidoUnico(sucursalRef || sucursal);
    setNumeroPedido(nuevoId);
  };

  const handleSeleccionarConfiguracionSucursal = (config: {
    sucursal: string;
    colaborador: string;
    canal: string;
    prefijo: string;
  }) => {
    setSucursal(config.sucursal);
    setColaborador(config.colaborador);
    setCanal(config.canal);
    // Generar número de pedido automático y único para esta sucursal
    const nuevoNumero = appsScriptClient.generarNumeroPedidoUnico(config.sucursal);
    setNumeroPedido(nuevoNumero);
    setMensajeEstado(null);
  };

  const handleCambioSucursalDirecto = (nombreSucursal: string) => {
    const sucEncontrada = SUCURSALES_PORTAL.find(s => s.nombre.toLowerCase() === nombreSucursal.toLowerCase());
    if (sucEncontrada) {
      if (sucEncontrada.tipoEquipo === 'INDIVIDUAL' && sucEncontrada.asesorFijo) {
        setSucursal(sucEncontrada.nombre);
        setColaborador(sucEncontrada.asesorFijo.nombre);
        setCanal(sucEncontrada.asesorFijo.area || sucEncontrada.canalDefecto);
        regenerarNumero(sucEncontrada.nombre);
      } else {
        // Si es equipo múltiple, abrir modal para que elija quién es
        setModalSucursalAbierto(true);
      }
    } else {
      setSucursal(nombreSucursal);
      regenerarNumero(nombreSucursal);
    }
  };

  const copiarNumeroPedido = () => {
    navigator.clipboard.writeText(numeroPedido);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 2000);
  };

  const copiarEnlacePortal = () => {
    const url = window.location.origin + window.location.pathname + '?portal=sucursales';
    navigator.clipboard.writeText(url);
    setCopiadoEnlace(true);
    setTimeout(() => setCopiadoEnlace(false), 2000);
  };

  const handleAgregarFila = () => {
    setItems([...items, { codigoRepuesto: '', descripcionOficial: '', cantidadSolicitada: 1 }]);
  };

  const handleEliminarFila = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;

    // Si escribe el código, buscar coincidencia en inventario para autocompletar descripción
    if (field === 'codigoRepuesto') {
      const match = inventarioDpl.find(i => i.codigoRepuesto.toUpperCase() === value.toUpperCase().trim());
      if (match && !updated[index].descripcionOficial) {
        updated[index].descripcionOficial = match.descripcion;
      }
    }

    setItems(updated);
  };

  const handleAbrirBuscadorParaFila = (idx: number) => {
    setIndiceFilaParaBuscador(idx);
    setTerminoBusquedaCatalogo(items[idx]?.codigoRepuesto || '');
    setModalBuscadorCatalogoAbierto(true);
  };

  const handleSeleccionarRepuestoCatalogo = (codigo: string, desc: string) => {
    if (indiceFilaParaBuscador !== null && items[indiceFilaParaBuscador]) {
      handleItemChange(indiceFilaParaBuscador, 'codigoRepuesto', codigo);
      handleItemChange(indiceFilaParaBuscador, 'descripcionOficial', desc);
    }
    setModalBuscadorCatalogoAbierto(false);
    setIndiceFilaParaBuscador(null);
  };

  const repuestosFiltradosCatalogo = terminoBusquedaCatalogo.trim()
    ? inventarioDpl.filter(i => 
        i.codigoRepuesto.toLowerCase().includes(terminoBusquedaCatalogo.toLowerCase()) ||
        i.descripcion.toLowerCase().includes(terminoBusquedaCatalogo.toLowerCase())
      ).slice(0, 30)
    : inventarioDpl.slice(0, 30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cliente.trim()) {
      setMensajeEstado({ tipo: 'error', texto: 'Por favor ingresa el nombre del cliente.' });
      return;
    }

    const itemsValidos = items.filter(it => it.codigoRepuesto.trim().length > 0 && it.cantidadSolicitada > 0);
    if (itemsValidos.length === 0) {
      setMensajeEstado({ tipo: 'error', texto: 'Debe ingresar al menos una línea de repuesto con código y cantidad.' });
      return;
    }

    setEnviando(true);
    setMensajeEstado(null);

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const idTransmision = `ORD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    // Mapeo canónico a TipoSolicitud
    let tipoSolCanonica: TipoSolicitud = 'Stock Regular';
    if (tipoSolicitud.includes('VOR')) tipoSolCanonica = 'VOR / Unidad Parada';
    else if (tipoSolicitud.includes('Garantía') || tipoSolicitud.includes('Garantia')) tipoSolCanonica = 'Garantía';
    else if (tipoSolicitud.includes('Chapistería') || tipoSolicitud.includes('Colisión')) tipoSolCanonica = 'Chapistería y Colisión';
    else if (tipoSolicitud.includes('Taller')) tipoSolCanonica = 'Taller Mecánico';
    else tipoSolCanonica = 'Stock Regular';

    // Mapeo canónico a EstadoPago
    let estadoPagoCanonico: 'Pendiente' | 'Aprobado' | 'Facturado' | 'Exento (Garantía)' = 'Aprobado';
    if (condicionPago.includes('Cancelado') || condicionPago.includes('Facturado')) estadoPagoCanonico = 'Facturado';
    else if (condicionPago.includes('No Pagado') || condicionPago.includes('Pendiente')) estadoPagoCanonico = 'Pendiente';
    else if (condicionPago.includes('Garantía')) estadoPagoCanonico = 'Exento (Garantía)';
    else estadoPagoCanonico = 'Aprobado';

    const resultado = await appsScriptClient.crearPedido({
      pedidoId: numeroPedido,
      fechaCreacion: ahora,
      sucursal,
      colaborador,
      canal,
      tipoPedido: tipoSolCanonica,
      cotizacion: cotizacion || facturaFiscal || 'N/A',
      cliente: cliente.trim(),
      placa: placa.toUpperCase().trim(),
      modeloChangan,
      vin: vin.toUpperCase().trim() || 'LS4A' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      numeroOR: cotizacion || facturaFiscal || '',
      estadoPago: estadoPagoCanonico,
      documentoPagoFactura: facturaFiscal || cotizacion || 'COT-OFICIAL',
      facturadoFinal: estadoPagoCanonico === 'Facturado' ? 'Sí' : 'No',
      estatusFabrica: 'En Espera CEDIS',
      origen: 'PORTAL_CEDIS',
      observaciones: observaciones.trim()
    }, itemsValidos);

    setEnviando(false);

    if (resultado.success) {
      // Preparar datos para el comprobante PDF oficial
      const fechaActualFormateada = new Date().toISOString().split('T')[0];
      const horaActualFormateada = new Date().toLocaleString();

      const comprobanteData: ComprobantePedidoData = {
        pedidoId: numeroPedido,
        cliente: cliente.trim(),
        sucursal,
        asesor: colaborador,
        cotizacion: cotizacion || facturaFiscal || 'N/A',
        fechaEmision: fechaActualFormateada,
        modeloAuto: modeloChangan,
        placa: placa.toUpperCase().trim() || 'En Trámite',
        canal,
        tipoPedido: tipoSolicitud,
        estadoPago: condicionPago,
        facturaFiscal,
        vin: vin.toUpperCase().trim(),
        observaciones: observaciones.trim(),
        idTransmision,
        fechaGenerado: horaActualFormateada,
        piezas: itemsValidos.map(it => ({
          codigo: it.codigoRepuesto,
          descripcion: it.descripcionOficial,
          cantidad: it.cantidadSolicitada
        }))
      };

      if (onTransmisionCompleta) {
        onTransmisionCompleta(comprobanteData);
      } else {
        setDatosComprobantePdf(comprobanteData);
        setModalPdfAbierto(true);
        // Notificar al componente padre
        onPedidoCreado(numeroPedido);
      }

      // Limpiar campos para la siguiente orden
      setCliente('');
      setPlaca('');
      setCotizacion('');
      setFacturaFiscal('');
      setObservaciones('');
      setVin('');
      setItems([{ codigoRepuesto: '', descripcionOficial: '', cantidadSolicitada: 1 }]);
      
      // Regenerar nuevo número único para la próxima orden
      const proximoId = appsScriptClient.generarNumeroPedidoUnico(sucursal);
      setNumeroPedido(proximoId);
    } else {
      setMensajeEstado({
        tipo: 'error',
        texto: resultado.error || 'Ocurrió un error al registrar el pedido canónico.'
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 1. ENCABEZADO CORPORATIVO OFICIAL */}
      <div className="bg-[#050b14] border border-cyan-900/40 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-black tracking-wide text-white">
              DISTRIBUIDORA AUTOMOTRIZ FORTUNE, SA
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              RUC: 155613501-2-2015 DV 61
            </p>
            <p className="text-xs text-slate-400 font-medium">
              DIRECCIÓN: Ave. Domingo Díaz, a un costado de Cardoze y Lindo, a 300 mts.
            </p>
            <p className="text-xs text-slate-400 font-medium">
              TELÉFONOS: 382-5488
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

      {/* 2. BARRA DE SUCURSAL ACTIVA & ACCIONES RÁPIDAS (Image 3) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50"></span>
          <span className="text-slate-300">
            Sucursal Activa: <strong className="text-cyan-300 font-semibold">{sucursal}</strong> &bull; {colaborador} ( {canal} )
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSolicitarCambioSucursal || (() => setModalSucursalAbierto(true))}
            className="px-3 py-1.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cambiar Sucursal / Quién Eres</span>
          </button>

          <button
            type="button"
            onClick={copiarEnlacePortal}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Copiar enlace para asesores"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiadoEnlace ? '¡Enlace Copiado!' : 'Copiar Enlace Portal'}</span>
          </button>

          {onAbrirMatrizCentral && (
            <button
              type="button"
              onClick={onAbrirMatrizCentral}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>CEDIS Central</span>
            </button>
          )}
        </div>
      </div>

      {mensajeEstado && (
        <div className={`p-4 rounded-xl flex items-start gap-2.5 text-xs font-medium ${
          mensajeEstado.tipo === 'exito'
            ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
            : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
        }`}>
          {mensajeEstado.tipo === 'exito' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>{mensajeEstado.texto}</div>
        </div>
      )}

      {/* 4. FORMULARIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* SECCIÓN 1: DATOS DEL COLABORADOR & Nº DE PEDIDO (Image 3) */}
        <div className="bg-[#09111e] border border-cyan-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>1. DATOS DEL COLABORADOR & Nº DE PEDIDO</span>
            </div>
            <span className="text-xs text-slate-400 font-semibold">
              Sucursal: <strong className="text-white">{sucursal}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Colaborador Responsable */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Colaborador Responsable *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={colaborador}
                  readOnly
                  onClick={() => setModalSucursalAbierto(true)}
                  className="w-full bg-[#050b14] border border-cyan-500/30 rounded-xl px-3 py-2 text-xs text-white font-semibold cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-cyan-400 mt-1">
                ✓ Área asignada automáticamente: {canal}
              </p>
            </div>

            {/* Nº Pedido (Seguimiento Oficial) Automático e Inalterable */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Nº Pedido (Seguimiento Oficial) *
                </label>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Auto-Asignado
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-[#050b14] border border-cyan-500/50 rounded-xl px-2.5 py-1.5 text-cyan-300 font-mono font-bold text-xs shadow-inner">
                <span className="flex-1 truncate">{numeroPedido}</span>

                <button
                  type="button"
                  onClick={copiarNumeroPedido}
                  className="p-1 rounded-lg hover:bg-cyan-950/80 text-cyan-400 transition"
                  title="Copiar número de pedido"
                >
                  {copiadoId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => regenerarNumero()}
                  className="p-1 rounded-lg hover:bg-cyan-950/80 text-cyan-400 transition"
                  title="Regenerar correlativo único"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-cyan-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Código oficial único ( {sucursal} )</span>
              </p>
            </div>

            {/* Canal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Canal *
              </label>
              <select
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Más alto">Más alto</option>
                <option value="Taller">Taller</option>
                <option value="Mostrador">Mostrador</option>
                <option value="Chapistería">Chapistería</option>
                <option value="Garantías">Garantías</option>
                <option value="Repuestos">Repuestos</option>
                <option value="Flotas">Flotas</option>
              </select>
            </div>

            {/* Tipo de Solicitud */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Tipo de Solicitud *
              </label>
              <select
                value={tipoSolicitud}
                onChange={(e) => setTipoSolicitud(e.target.value)}
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Pedido Especial (Regular)">Pedido Especial (Regular)</option>
                <option value="VOR / Unidad Parada">VOR / Unidad Parada</option>
                <option value="Chapistería y Colisión">Chapistería y Colisión</option>
                <option value="Taller Mecánico">Taller Mecánico</option>
                <option value="Garantía">Garantía Fábrica</option>
                <option value="Stock Regular">Stock Regular</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: DATOS DEL CLIENTE & VEHÍCULO CHANGAN (Image 4) */}
        <div className="bg-[#09111e] border border-cyan-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide border-b border-slate-800/80 pb-3">
            <Car className="w-4 h-4 text-cyan-400" />
            <span>2. DATOS DEL CLIENTE & VEHÍCULO CHANGAN</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej. Roberto Guardia"
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Placa del Auto *
              </label>
              <input
                type="text"
                value={placa}
                onChange={(e) => setPlaca(e.target.value.toUpperCase())}
                placeholder="EJ. CM-8834"
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Modelo Changan *
                </label>
                {modeloSeleccionadoInfo && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    modeloSeleccionadoInfo.categoria === 'Eléctrico / Híbrido'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : modeloSeleccionadoInfo.categoria === 'SUV'
                      ? 'bg-blue-950/80 text-sky-300 border-sky-500/40'
                      : modeloSeleccionadoInfo.categoria === 'Pickup'
                      ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                      : modeloSeleccionadoInfo.categoria === 'Comercial'
                      ? 'bg-purple-950/80 text-purple-300 border-purple-500/40'
                      : 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40'
                  }`}>
                    {modeloSeleccionadoInfo.categoria}
                  </span>
                )}
              </div>
              <select
                value={modeloChangan}
                onChange={(e) => setModeloChangan(e.target.value)}
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {CATEGORIAS_MODELOS.map(cat => {
                  const modelosDeCat = CATALOGO_MODELOS_CHANGAN.filter(m => m.categoria === cat);
                  if (modelosDeCat.length === 0) return null;
                  return (
                    <optgroup key={cat} label={`─── ${cat.toUpperCase()} ───`}>
                      {modelosDeCat.map(m => (
                        <option key={m.nombre} value={m.nombre}>
                          {m.nombre} ({m.anosCompatibles})
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>

              {/* Ficha técnica informativa del modelo seleccionado para el Asesor */}
              {modeloSeleccionadoInfo && (
                <div className="mt-1.5 bg-[#050b14]/90 border border-slate-800/90 rounded-lg p-2 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Años Compatibles:</span>
                    <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                      {modeloSeleccionadoInfo.anosCompatibles}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-slate-800/60">
                    <span>Segmento:</span>
                    <span className="text-slate-300 font-medium">{modeloSeleccionadoInfo.categoria}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nº Cotización *
              </label>
              <input
                type="text"
                value={cotizacion}
                onChange={(e) => setCotizacion(e.target.value)}
                placeholder="Ej. COT-2026-904"
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: ESTADO DE PAGO Y COMPROBANTE (Image 4) */}
        <div className="bg-[#09111e] border border-cyan-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide border-b border-slate-800/80 pb-3">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>3. ESTADO DE PAGO Y COMPROBANTE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Condición de Pago *
              </label>
              <select
                value={condicionPago}
                onChange={(e) => setCondicionPago(e.target.value)}
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                <option value="Cancelado (100% Pagado / Facturado)">Cancelado (100% Pagado / Facturado)</option>
                <option value="No Pagado (N/A (Pendiente))">No Pagado (N/A (Pendiente))</option>
                <option value="Crédito Aprobado">Crédito Aprobado</option>
                <option value="Exento (Garantía)">Exento (Garantía)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nº de Factura Fiscal *
              </label>
              <input
                type="text"
                value={facturaFiscal}
                onChange={(e) => setFacturaFiscal(e.target.value)}
                placeholder="Ej. RC-44810 o FACT-9921"
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: REPUESTOS SOLICITADOS (BÚSQUEDA AUTOMÁTICA EN CATÁLOGO CHANGAN) (Image 4 & 5) */}
        <div className="bg-[#09111e] border border-cyan-900/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>4. REPUESTOS SOLICITADOS (BÚSQUEDA AUTOMÁTICA EN CATÁLOGO CHANGAN)</span>
            </div>

            <div className="flex items-center gap-2">
              {onAbrirRastreador && (
                <button
                  type="button"
                  onClick={onAbrirRastreador}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 hover:from-cyan-900 hover:to-blue-900 border border-cyan-500/50 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-cyan-500/10"
                  title="Rastrear repuestos en DPL, saldo libre, asignados y arribos de contenedor"
                >
                  <Search className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Rastrear Repuestos / Stock DPL</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleAgregarFila}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Otra Pieza</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-[#050b14] border border-cyan-950 rounded-2xl p-4 sm:p-5 space-y-3 relative group"
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-400">
                    Pieza # {idx + 1}
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEliminarFila(idx)}
                      className="text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      title="Eliminar repuesto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Código */}
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      CÓDIGO DE REPUESTO *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={item.codigoRepuesto}
                        onChange={(e) => handleItemChange(idx, 'codigoRepuesto', e.target.value)}
                        placeholder="EJ. H15001-0800 O FILTRO..."
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleAbrirBuscadorParaFila(idx)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-cyan-400 transition"
                        title="Buscar en catálogo CEDIS"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      DESCRIPCIÓN / NOMBRE DE LA PIEZA *
                    </label>
                    <input
                      type="text"
                      value={item.descripcionOficial}
                      onChange={(e) => handleItemChange(idx, 'descripcionOficial', e.target.value)}
                      placeholder="Ej. FILTRO DE ACEITE MOTOR 1.5L"
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1 text-center">
                      CANTIDAD *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={item.cantidadSolicitada}
                      onChange={(e) => handleItemChange(idx, 'cantidadSolicitada', parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white font-bold text-center focus:outline-none focus:border-cyan-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN 5: OBSERVACIONES ADICIONALES PARA EL CEDIS (Image 5) */}
        <div className="bg-[#09111e] border border-cyan-900/40 rounded-2xl p-6 shadow-xl space-y-2">
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
            OBSERVACIONES ADICIONALES PARA EL CEDIS (OPCIONAL)
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Detalles sobre urgencia, cliente en espera, siniestro o notas para bodega central..."
            className="w-full bg-[#050b14] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* BOTÓN TRANSMITIR (Image 5) */}
        <div>
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 rounded-2xl bg-[#0088cc] hover:bg-[#0099e6] text-white font-extrabold text-sm sm:text-base tracking-wide transition-all duration-200 shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-5 h-5 fill-white ${enviando ? 'animate-spin' : ''}`} />
            <span>{enviando ? 'TRANSMITIENDO A CEDIS CENTRAL...' : '⚡ TRANSMITIR Y ENVIAR PEDIDO A CEDIS CENTRAL'}</span>
          </button>
        </div>
      </form>

      {/* MODAL 1: Selector de Sucursal y Quién Eres */}
      <ModalSeleccionSucursal
        isOpen={modalSucursalAbierto}
        onClose={() => setModalSucursalAbierto(false)}
        sucursalActual={sucursal}
        colaboradorActual={colaborador}
        onSeleccionar={handleSeleccionarConfiguracionSucursal}
      />

      {/* MODAL 2: Catálogo Rápido CEDIS */}
      {modalBuscadorCatalogoAbierto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#09111e] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Catálogo de Repuestos Changan CEDIS</h3>
              </div>
              <button
                onClick={() => setModalBuscadorCatalogoAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={terminoBusquedaCatalogo}
                onChange={(e) => setTerminoBusquedaCatalogo(e.target.value)}
                placeholder="Buscar por código OEM o descripción..."
                className="w-full bg-[#050b14] border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
              {repuestosFiltradosCatalogo.map((rep) => (
                <div
                  key={rep.dplDetalleId}
                  onClick={() => handleSeleccionarRepuestoCatalogo(rep.codigoRepuesto, rep.descripcion)}
                  className="p-3 rounded-xl border border-slate-800 bg-[#050b14] hover:border-cyan-500/60 hover:bg-slate-900/60 transition cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono text-xs font-bold text-cyan-300">
                      {rep.codigoRepuesto}
                    </div>
                    <div className="text-xs text-slate-300">
                      {rep.descripcion}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Pallet: {rep.pallet} &bull; Contenedor: {rep.contenedorId}
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    rep.saldoDisponible > 0
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border-amber-800'
                  }`}>
                    {rep.saldoDisponible > 0 ? `${rep.saldoDisponible} u. libres` : 'Sin stock libre'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Comprobante PDF Oficial Generado Automáticamente (Image 6) */}
      <ModalComprobantePDF
        isOpen={modalPdfAbierto}
        onClose={() => setModalPdfAbierto(false)}
        datos={datosComprobantePdf}
        onNuevoPedido={() => {
          setModalPdfAbierto(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

    </div>
  );
};
