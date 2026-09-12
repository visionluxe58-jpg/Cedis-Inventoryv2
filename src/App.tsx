import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, ModuloActivo } from './components/Navbar';
import { FormularioRequisicion } from './components/FormularioRequisicion';
import { MatrizCentral } from './components/MatrizCentral';
import { KardexStock } from './components/KardexStock';
import { ModuloConciliacion } from './components/ModuloConciliacion';
import { ModuloAuditoria } from './components/ModuloAuditoria';
import { CruceDPL } from './components/CruceDPL';
import { PortalSucursales } from './components/PortalSucursales';
import { DashboardKPIs } from './components/DashboardKPIs';
import { ReporteFabrica } from './components/ReporteFabrica';
import { ModalDPL } from './components/ModalDPL';
import { ModalCompartir } from './components/ModalCompartir';
import { ModalGoogleSheets } from './components/ModalGoogleSheets';
import { ModalRastreadorUniversal } from './components/ModalRastreadorUniversal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { appsScriptClient } from './services/appsScriptClient';
import { 
  UsuarioActivo, 
  FilaMatrizCentral, 
  DPLDetalle, 
  DPLManifiesto, 
  ContenedorManifiesto, 
  DetalleDPL,
  AuditoriaKardex,
  SolicitudCabecera,
  DetalleRepuesto
} from './types/cedis';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [moduloActivo, setModuloActivo] = useState<ModuloActivo>('matriz');
  const [usuarioActivo, setUsuarioActivo] = useState<UsuarioActivo>(() => appsScriptClient.getUsuarioActivo());

  // Detectar si ingresó con ?portal=sucursales
  const [modoPortal, setModoPortal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('portal') === 'sucursales';
    }
    return false;
  });

  // Datos canónicos sincronizados inicializados desde el almacén canónico
  const [matriz, setMatriz] = useState<FilaMatrizCentral[]>(() => appsScriptClient.getMatrizCentral());
  const [inventario, setInventario] = useState<DPLDetalle[]>(() => appsScriptClient.getDPLDetalle());
  const [manifiestos, setManifiestos] = useState<DPLManifiesto[]>(() => appsScriptClient.getManifiestos());
  const [auditoria, setAuditoria] = useState<AuditoriaKardex[]>(() => appsScriptClient.getAuditoria());
  const [cabeceras, setCabeceras] = useState<SolicitudCabecera[]>(() => appsScriptClient.getCabeceras());
  const [detalles, setDetalles] = useState<DetalleRepuesto[]>(() => appsScriptClient.getDetalles());

  // Modales
  const [modalDPLAbierto, setModalDPLAbierto] = useState<boolean>(false);
  const [modalCompartirAbierto, setModalCompartirAbierto] = useState<boolean>(false);
  const [modalSheetsAbierto, setModalSheetsAbierto] = useState<boolean>(false);
  const [modalRastreadorAbierto, setModalRastreadorAbierto] = useState<boolean>(false);
  const [codigoRastreoDirecto, setCodigoRastreoDirecto] = useState<string>('');

  // Toast
  const [notificacion, setNotificacion] = useState<{
    tipo: 'exito' | 'error' | 'info';
    mensaje: string;
  } | null>(null);

  const mostrarNotificacion = (tipo: 'exito' | 'error' | 'info', mensaje: string) => {
    setNotificacion({ tipo, mensaje });
    setTimeout(() => {
      setNotificacion(null);
    }, 4500);
  };

  const recargarDatos = useCallback(() => {
    setMatriz(appsScriptClient.getMatrizCentral());
    setInventario(appsScriptClient.getDPLDetalle());
    setManifiestos(appsScriptClient.getManifiestos());
    setAuditoria(appsScriptClient.getAuditoria());
    setCabeceras(appsScriptClient.getCabeceras());
    setDetalles(appsScriptClient.getDetalles());
  }, []);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  // Escuchar cambios de historial en el navegador
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setModoPortal(params.get('portal') === 'sucursales');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const activarModoPortal = () => {
    setModoPortal(true);
    const url = new URL(window.location.href);
    url.searchParams.set('portal', 'sucursales');
    window.history.pushState({}, '', url.toString());
  };

  const desactivarModoPortal = () => {
    setModoPortal(false);
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    window.history.pushState({}, '', url.toString());
  };

  const handleCambiarUsuario = (usr: UsuarioActivo) => {
    setUsuarioActivo(usr);
    appsScriptClient.setUsuarioActivo(usr);
    mostrarNotificacion('info', `Sesión activa: ${usr.nombre} (${usr.rol}) - ${usr.sucursal}`);
  };

  const handlePedidoCreado = (pedidoId: string) => {
    recargarDatos();
    mostrarNotificacion('exito', `Requisición ${pedidoId} registrada exitosamente.`);
    setModuloActivo('matriz');
  };

  const handleMigracionExitosa = () => {
    recargarDatos();
    mostrarNotificacion('exito', 'Datos de staging migrados a la estructura canónica.');
  };

  // Convertir manifiestos e inventario al formato que espera CruceDPL
  const contenedoresCompat: ContenedorManifiesto[] = manifiestos.map(m => ({
    contenedor: m.contenedorId || '',
    proveedor: m.proveedor || 'Mobitech Changan China Co., Ltd',
    poReferencia: m.poReferencia || `PO-${m.contenedorId}`,
    tipoTransporte: m.tipoTransporte || 'Marítimo 40HQ',
    fechaArribo: m.fechaArribo || '',
    estado: m.estado || 'EN TRÁNSITO',
    totalPiezas: Number(m.totalPiezas || m.piezasTotales || 0),
    skusUnicos: Number(m.skusUnicos || m.totalItems || 0),
    totalPallets: Number(m.totalPallets || 1),
    piezasTotales: Number(m.piezasTotales || m.totalPiezas || 0),
    totalLineas: Number(m.totalItems || m.skusUnicos || 0),
    piezasDespachadas: Number(m.piezasDespachadas || 0),
    blReferencia: m.blReferencia || m.poReferencia || '',
    estatusAduana: m.estatusAduana || ''
  }));

  const detalleDPLCompat: DetalleDPL[] = inventario.map((i, idx) => ({
    uid: i.inventarioId || i.dplDetalleId || `INV-${idx}`,
    uidFila: i.dplDetalleId || i.inventarioId || `INV-${idx}`,
    contenedor: i.contenedorId || '',
    pallet: i.pallet || i.palletCaseNo || 'P001',
    codigoCompra: i.codigoRepuesto || '',
    codigoSuministrado: i.codigoRepuesto || '',
    descripcion: i.descripcion || 'Repuesto Genuino Changan',
    cantidadTotal: Number(i.cantidadTotal) || 0,
    cantTotal: Number(i.cantidadTotal) || 0,
    despachado: Number(i.cantidadDespachada) || 0,
    comprometido: Number(i.cantidadAsignada) || 0,
    saldoLibre: Number(i.saldoDisponible) || 0,
    unidad: i.unidadMedida || 'PZA'
  }));

  // Conteo de pedidos únicos
  const totalPedidosUnicos = new Set(matriz.map(m => m.pedidoId)).size;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast de Notificaciones */}
      {notificacion && (
        <div className="fixed top-16 right-4 z-50 animate-bounce">
          <div className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border backdrop-blur-md ${
            notificacion.tipo === 'exito'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
              : notificacion.tipo === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
              : 'bg-sky-950/90 text-sky-300 border-sky-500/50'
          }`}>
            {notificacion.tipo === 'exito' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {notificacion.tipo === 'error' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            {notificacion.tipo === 'info' && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
            <span>{notificacion.mensaje}</span>
          </div>
        </div>
      )}

      {/* Si está en modo Portal de Sucursales (?portal=sucursales) */}
      {modoPortal ? (
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <PortalSucursales
            usuario={usuarioActivo}
            onCambiarUsuario={handleCambiarUsuario}
            filas={matriz}
            inventario={inventario}
            manifiestos={manifiestos}
            onPedidoCreado={(pedidoId) => {
              recargarDatos();
              mostrarNotificacion('exito', `Requisición ${pedidoId} registrada y sincronizada con CEDIS.`);
            }}
            onAbrirMatrizCentral={desactivarModoPortal}
            onAbrirModalCompartir={() => setModalCompartirAbierto(true)}
          />
        </main>
      ) : (
        <>
          {/* Barra de Navegación Superior con Selector de Rol */}
          <Navbar
            moduloActivo={moduloActivo}
            setModuloActivo={setModuloActivo}
            usuarioActivo={usuarioActivo}
            onCambiarUsuario={handleCambiarUsuario}
            totalPedidos={totalPedidosUnicos}
            totalContenedores={manifiestos.length}
            onAbrirModalSheets={() => setModalSheetsAbierto(true)}
            onAbrirModalCompartir={() => setModalCompartirAbierto(true)}
            onAbrirModalDPL={() => setModalDPLAbierto(true)}
            onAbrirPortalSucursales={activarModoPortal}
            onAbrirRastreador={() => setModalRastreadorAbierto(true)}
          />

          {/* Contenido Principal según el módulo seleccionado */}
          <ErrorBoundary onReset={recargarDatos}>
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              {moduloActivo === 'dashboard' && (
                <DashboardKPIs
                  filas={matriz}
                  inventario={inventario}
                  manifiestos={manifiestos}
                  auditoria={auditoria}
                  usuario={usuarioActivo}
                  onActualizar={recargarDatos}
                  onNavegarModulo={(mod) => setModuloActivo(mod as any)}
                />
              )}

              {moduloActivo === 'reporte_fabrica' && (
                <ReporteFabrica
                  cabeceras={cabeceras}
                  detalles={detalles}
                  onActualizar={recargarDatos}
                />
              )}

              {moduloActivo === 'matriz' && (
                <MatrizCentral
                  filas={matriz}
                  usuario={usuarioActivo}
                  onActualizar={recargarDatos}
                />
              )}

              {moduloActivo === 'formulario' && (
                <FormularioRequisicion
                  usuario={usuarioActivo}
                  onPedidoCreado={handlePedidoCreado}
                />
              )}

              {moduloActivo === 'kardex' && (
                <KardexStock
                  inventario={inventario}
                  usuario={usuarioActivo}
                  onActualizar={recargarDatos}
                />
              )}

              {moduloActivo === 'conciliacion' && (
                <ModuloConciliacion
                  usuario={usuarioActivo}
                  onMigracionExitosa={handleMigracionExitosa}
                />
              )}

              {moduloActivo === 'auditoria' && (
                <ModuloAuditoria />
              )}

              {moduloActivo === 'cruce' && (
                <CruceDPL
                  contenedores={contenedoresCompat}
                  detalleDPL={detalleDPLCompat}
                  onAbrirModalDPL={() => setModalDPLAbierto(true)}
                  onAbrirRastreador={(cod) => {
                    if (cod) setCodigoRastreoDirecto(cod);
                    setModalRastreadorAbierto(true);
                  }}
                  onActualizar={recargarDatos}
                />
              )}
            </main>
          </ErrorBoundary>
        </>
      )}

      {/* Modales Auxiliares */}
      <ModalGoogleSheets
        isOpen={modalSheetsAbierto}
        onClose={() => setModalSheetsAbierto(false)}
        onSyncComplete={() => {
          recargarDatos();
          mostrarNotificacion('exito', 'Conexión y parámetros canónicos actualizados.');
        }}
      />

      <ModalCompartir
        isOpen={modalCompartirAbierto}
        onClose={() => setModalCompartirAbierto(false)}
      />

      <ModalDPL
        isOpen={modalDPLAbierto}
        onClose={() => setModalDPLAbierto(false)}
        onDPLGuardado={() => {
          recargarDatos();
          mostrarNotificacion('exito', 'Manifiesto DPL procesado y sincronizado en almacén.');
        }}
      />

      {/* Modal Rastreador Universal (disponible desde cualquier vista) */}
      <ModalRastreadorUniversal
        isOpen={modalRastreadorAbierto}
        onClose={() => {
          setModalRastreadorAbierto(false);
          setCodigoRastreoDirecto('');
        }}
        filas={matriz}
        inventario={inventario}
        manifiestos={manifiestos}
        codigoInicial={codigoRastreoDirecto}
      />

      {/* Footer Canónico */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sistema CEDIS Changan Auto Panamá &bull; Repuestos Genuinos
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Canónico: Google Sheets API</span>
            <span>&bull;</span>
            <span>Seguridad: Apps Script LockService</span>
            <span>&bull;</span>
            <span>Idempotencia: operationId</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
