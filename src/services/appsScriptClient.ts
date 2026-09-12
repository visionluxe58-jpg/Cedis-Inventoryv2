import { 
  SolicitudCabecera, 
  DetalleRepuesto, 
  DPLManifiesto, 
  DPLDetalle, 
  ModeloChangan, 
  BDEncargado, 
  AuditoriaKardex, 
  AppsScriptApiConfig,
  ResultadoDiagnosticoCORS,
  UsuarioActivo,
  FilaMatrizCentral,
  RegistroStaging,
  BitacoraNota,
  EstatusLineaRepuesto,
  EstatusDPL,
  normalizarEstatusDPL
} from '../types/cedis';
import { ReconciliationEngine } from './reconciliationEngine';

const STORAGE_KEYS = {
  CONFIG: 'changan_cedis_api_config_v2',
  USER: 'changan_cedis_active_user_v2',
  CABECERA: 'changan_cedis_cabecera_canonica_v2',
  DETALLE: 'changan_cedis_detalle_canonica_v2',
  MANIFIESTOS: 'changan_cedis_manifiestos_v2',
  DPL_DETALLE: 'changan_cedis_dpl_detalle_v2',
  MODELOS: 'changan_cedis_modelos_v2',
  ENCARGADOS: 'changan_cedis_encargados_v2',
  AUDITORIA: 'changan_cedis_auditoria_inmutable_v2',
};

export const OFFICIAL_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwMhnEB2QAvnnymfH8ZrDYMDMxv3pYtnNh41L_JNtmpqbkF3Qcb5msG2I6XXez46bNc/exec';

// Usuarios oficiales con Roles
export const USUARIOS_OFICIALES: BDEncargado[] = [
  {
    usuarioId: 'USR-001',
    nombre: 'Administrador CEDIS',
    correo: 'visionluxe58@gmail.com',
    sucursal: 'Bodega Central',
    canal: 'CEDIS Central',
    rol: 'ADMINISTRADOR_CEDIS',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-002',
    nombre: 'Operador Bodega CEDIS',
    correo: 'operaciones.cedis@changanpanama.com',
    sucursal: 'Bodega Central',
    canal: 'CEDIS Operativo',
    rol: 'OPERADOR_CEDIS',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-003',
    nombre: 'Leidys Perez',
    correo: 'repuestos@changanpanama.com',
    sucursal: 'Villa Lucre',
    canal: 'Mostrador',
    rol: 'SUCURSAL_ASESOR',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-004',
    nombre: 'Edwin Blanco',
    correo: 'repuestos.vl@changanpanama.com',
    sucursal: 'Villa Lucre',
    canal: 'Chapistería',
    rol: 'SUCURSAL_ASESOR',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-005',
    nombre: 'Carlos Mendoza',
    correo: 'taller.costaverde@changanpanama.com',
    sucursal: 'Costa Verde',
    canal: 'Taller',
    rol: 'SUCURSAL_ASESOR',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-006',
    nombre: 'Valeria Castillo',
    correo: 'garantias@changanpanama.com',
    sucursal: 'Calle 50',
    canal: 'Garantías',
    rol: 'SUCURSAL_ASESOR',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-007',
    nombre: 'Alexis Rios',
    correo: 'repuestos.tm@changanpanama.com',
    sucursal: 'Tumba Muerto',
    canal: 'Colisión',
    rol: 'SUCURSAL_ASESOR',
    activo: true,
    movilHabilitado: true
  },
  {
    usuarioId: 'USR-008',
    nombre: 'Auditor Financiero',
    correo: 'auditoria@changanpanama.com',
    sucursal: 'Sede Central',
    canal: 'Auditoría',
    rol: 'CONSULTA',
    activo: true,
    movilHabilitado: false
  }
];

export const MODELOS_OFICIALES: ModeloChangan[] = [
  { modeloId: 'MOD-01', nombre: 'CS15', categoria: 'SUV', rangoAnio: '2018-2026', anosCompatibles: '2018-2026', motor: '1.5L Blue Core', activo: true, notas: 'Compact SUV urbano' },
  { modeloId: 'MOD-02', nombre: 'CS35 Plus', categoria: 'SUV', rangoAnio: '2019-2026', anosCompatibles: '2019-2026', motor: '1.6L GDI', activo: true, notas: 'SUV familiar compacto' },
  { modeloId: 'MOD-03', nombre: 'CS35 Plus Turbo', categoria: 'SUV', rangoAnio: '2021-2026', anosCompatibles: '2021-2026', motor: '1.4T Turbo GDI', activo: true, notas: 'Motor Turbo refrigeración y bujías' },
  { modeloId: 'MOD-04', nombre: 'CS55 Plus', categoria: 'SUV', rangoAnio: '2021-2026', anosCompatibles: '2021-2026', motor: '1.5T GDI', activo: true, notas: 'Transmisión DCT 7 velocidades' },
  { modeloId: 'MOD-05', nombre: 'CS55 Plus 2da Gen', categoria: 'SUV', rangoAnio: '2022-2026', anosCompatibles: '2022-2026', motor: '1.5T Blue Core NE', activo: true, notas: 'Segunda generación facelift y sensores' },
  { modeloId: 'MOD-06', nombre: 'CS75 Plus', categoria: 'SUV', rangoAnio: '2020-2026', anosCompatibles: '2020-2026', motor: '2.0T / 1.5T', activo: true, notas: 'SUV mediano alta gama' },
  { modeloId: 'MOD-07', nombre: 'Oshan X7 Plus', categoria: 'SUV', rangoAnio: '2021-2025', anosCompatibles: '2021-2025', motor: '1.5T Blue Core 7P', activo: true, notas: 'SUV 7 pasajeros' },
  { modeloId: 'MOD-08', nombre: 'UNI-T', categoria: 'SUV', rangoAnio: '2021-2026', anosCompatibles: '2021-2026', motor: '1.5T Blue Core DCT', activo: true, notas: 'Línea de diseño futurista UNI' },
  { modeloId: 'MOD-09', nombre: 'UNI-K', categoria: 'SUV', rangoAnio: '2021-2026', anosCompatibles: '2021-2026', motor: '2.0T AWD 8AT', activo: true, notas: 'SUV insignia Changan con tracción total' },
  { modeloId: 'MOD-10', nombre: 'Alsvin', categoria: 'Sedán', rangoAnio: '2020-2026', anosCompatibles: '2020-2026', motor: '1.4L MT / 1.5L DCT', activo: true, notas: 'Sedán de alta rotación en posventa' },
  { modeloId: 'MOD-11', nombre: 'Eado EV460', categoria: 'Eléctrico / Híbrido', rangoAnio: '2021-2026', anosCompatibles: '2021-2026', motor: '100% Eléctrico 120kW', activo: true, notas: 'Sedán eléctrico para flotas y particular' },
  { modeloId: 'MOD-12', nombre: 'Hunter Pickup (4x2 / 4x4)', categoria: 'Pickup', rangoAnio: '2020-2026', anosCompatibles: '2020-2026', motor: '1.9T / 2.0T Turbo Diésel', activo: true, notas: 'Trabajo rudo y flotas comerciales' },
  { modeloId: 'MOD-13', nombre: 'Hunter REEV / Híbrido', categoria: 'Eléctrico / Híbrido', rangoAnio: '2024-2026', anosCompatibles: '2024-2026', motor: 'Range Extender 2.0T Eléctrico', activo: true, notas: 'Pickup híbrida con extensor de rango' },
  { modeloId: 'MOD-14', nombre: 'Deepal S07', categoria: 'Eléctrico / Híbrido', rangoAnio: '2023-2026', anosCompatibles: '2023-2026', motor: '100% Eléctrico / REEV', activo: true, notas: 'SUV eléctrica Deepal arquitectura EPA1' },
  { modeloId: 'MOD-15', nombre: 'Deepal L07', categoria: 'Eléctrico / Híbrido', rangoAnio: '2023-2026', anosCompatibles: '2023-2026', motor: '100% Eléctrico / REEV', activo: true, notas: 'Sedán deportivo eléctrico aerodinámico' },
  { modeloId: 'MOD-16', nombre: 'Avatr 11', categoria: 'Eléctrico / Híbrido', rangoAnio: '2024-2026', anosCompatibles: '2024-2026', motor: 'Dual Motor AWD Eléctrico', activo: true, notas: 'SUV Premium eléctrico alta tecnología' },
  { modeloId: 'MOD-17', nombre: 'Honor S', categoria: 'Comercial', rangoAnio: '2018-2025', anosCompatibles: '2018-2025', motor: '1.5L Gasolina 5MT', activo: true, notas: 'Microbús / furgón comercial' },
  { modeloId: 'MOD-18', nombre: 'Star Truck / M201', categoria: 'Comercial', rangoAnio: '2017-2026', anosCompatibles: '2017-2026', motor: '1.2L / 1.5L Carga Ligera', activo: true, notas: 'Mini truck de carga liviana' }
];

export const CONTENEDORES_CANONICOS: DPLManifiesto[] = [
  {
    contenedorId: 'INV-CN-8902',
    proveedor: 'Mobitech Changan China Co., Ltd',
    fechaArribo: '2026-08-15',
    poReferencia: 'PO-2026-CH-089',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 120,
    skusUnicos: 6,
    totalPallets: 4,
    estado: 'RECIBIDO',
    creadoPor: 'Administrador CEDIS',
    creadoEn: '2026-08-15 09:00:00'
  },
  {
    contenedorId: 'INV-CN-9140',
    proveedor: 'Mobitech Changan China Co., Ltd',
    fechaArribo: '2026-09-02',
    poReferencia: 'PO-2026-CH-112',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 85,
    skusUnicos: 5,
    totalPallets: 3,
    estado: 'RECIBIDO',
    creadoPor: 'Administrador CEDIS',
    creadoEn: '2026-09-02 10:30:00'
  },
  {
    contenedorId: 'INV-CN-9250',
    proveedor: 'Mobitech Changan China Co., Ltd',
    fechaArribo: '2026-09-18',
    poReferencia: 'PO-2026-CH-125',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 140,
    skusUnicos: 8,
    totalPallets: 5,
    estado: 'EN TRÁNSITO',
    creadoPor: 'Administrador CEDIS',
    creadoEn: '2026-09-05 11:00:00'
  },
  {
    contenedorId: 'INV-CN-9310',
    proveedor: 'Mobitech Changan China Co., Ltd',
    fechaArribo: '2026-09-14',
    poReferencia: 'PO-2026-CH-131',
    tipoTransporte: 'Marítimo 40HQ',
    totalPiezas: 95,
    skusUnicos: 6,
    totalPallets: 3,
    estado: 'ADUANA',
    creadoPor: 'Administrador CEDIS',
    creadoEn: '2026-09-07 14:20:00'
  }
];

export const DPL_DETALLE_CANONICO: DPLDetalle[] = [
  {
    inventarioId: 'INV-CN-8902_1',
    contenedorId: 'INV-CN-8902',
    palletCaseNo: 'P001',
    packageNo: 'PKG-01',
    codigoRepuesto: 'S111F270108-0103',
    descripcion: 'Puerta Delantera Derecha UNI-T',
    cantidadTotal: 6,
    cantidadAsignada: 1,
    cantidadDespachada: 2,
    saldoDisponible: 3, // 6 - 1 - 2 = 3
    ubicacionCedis: 'Bahía A-01 / Pallet P001'
  },
  {
    inventarioId: 'INV-CN-8902_2',
    contenedorId: 'INV-CN-8902',
    palletCaseNo: 'P001',
    packageNo: 'PKG-02',
    codigoRepuesto: '8511F270102-0202-AA',
    descripcion: 'Faro Delantero LED Izquierdo CS55 Plus',
    cantidadTotal: 8,
    cantidadAsignada: 2,
    cantidadDespachada: 0,
    saldoDisponible: 6, // 8 - 2 - 0 = 6
    ubicacionCedis: 'Bahía A-02 / Pallet P001'
  },
  {
    inventarioId: 'INV-CN-8902_3',
    contenedorId: 'INV-CN-8902',
    palletCaseNo: 'P002',
    packageNo: 'PKG-03',
    codigoRepuesto: 'F202F260100',
    descripcion: 'Amortiguador Delantero Hunter 4x4',
    cantidadTotal: 24,
    cantidadAsignada: 4,
    cantidadDespachada: 4,
    saldoDisponible: 16, // 24 - 4 - 4 = 16
    ubicacionCedis: 'Rack B-12 / Pallet P002'
  },
  {
    inventarioId: 'INV-CN-8902_4',
    contenedorId: 'INV-CN-8902',
    palletCaseNo: 'P003',
    packageNo: 'PKG-04',
    codigoRepuesto: 'C301F280201',
    descripcion: 'Pastillas de Freno Delanteras Alsvin',
    cantidadTotal: 50,
    cantidadAsignada: 5,
    cantidadDespachada: 10,
    saldoDisponible: 35, // 50 - 5 - 10 = 35
    ubicacionCedis: 'Rack C-05 / Pallet P003'
  },
  {
    inventarioId: 'INV-CN-9140_1',
    contenedorId: 'INV-CN-9140',
    palletCaseNo: 'P101',
    packageNo: 'PKG-01',
    codigoRepuesto: 'E101F310100',
    descripcion: 'Radiador de Enfriamiento Motor CS35',
    cantidadTotal: 15,
    cantidadAsignada: 2,
    cantidadDespachada: 0,
    saldoDisponible: 13, // 15 - 2 - 0 = 13
    ubicacionCedis: 'Bahía D-01 / Pallet P101'
  },
  {
    inventarioId: 'INV-CN-9140_2',
    contenedorId: 'INV-CN-9140',
    palletCaseNo: 'P102',
    packageNo: 'PKG-02',
    codigoRepuesto: 'H200F290400',
    descripcion: 'Bomba de Agua Genuina UNI-K 2.0T',
    cantidadTotal: 20,
    cantidadAsignada: 1,
    cantidadDespachada: 1,
    saldoDisponible: 18, // 20 - 1 - 1 = 18
    ubicacionCedis: 'Rack E-08 / Pallet P102'
  },
  {
    inventarioId: 'INV-CN-9250_1',
    contenedorId: 'INV-CN-9250',
    palletCaseNo: 'P201',
    packageNo: 'PKG-01',
    codigoRepuesto: 'K999F120000',
    descripcion: 'Juego de Espejos Retrovisores Eléctricos Hunter/CS55',
    cantidadTotal: 10,
    cantidadAsignada: 0,
    cantidadDespachada: 0,
    saldoDisponible: 10,
    ubicacionCedis: 'En Tránsito Marítimo (No Asignable hasta Arribo)'
  },
  {
    inventarioId: 'INV-CN-9310_1',
    contenedorId: 'INV-CN-9310',
    palletCaseNo: 'P301',
    packageNo: 'PKG-01',
    codigoRepuesto: 'S111F260204-0100',
    descripcion: 'Sensor ABS Trasero UNI-T',
    cantidadTotal: 15,
    cantidadAsignada: 0,
    cantidadDespachada: 0,
    saldoDisponible: 15,
    ubicacionCedis: 'En Aduana Portuaria (No Asignable hasta Arribo)'
  }
];

export const CABECERAS_BASE_9_SEP: SolicitudCabecera[] = [
  {
    pedidoId: 'PED-VL-2101',
    fechaCreacion: '2026-09-08 09:30:00',
    sucursal: 'Villa Lucre',
    colaborador: 'Leidys Perez',
    canal: 'Mostrador',
    tipoPedido: 'VOR / Unidad Parada',
    cotizacion: 'COT-VL-901',
    cliente: 'GRUPO SILABA S.A.',
    placa: 'PA-9912',
    modeloChangan: 'UNI-T Elite',
    vin: 'LS4A2B999RA019283',
    numeroOR: 'OR-8921',
    estadoPago: 'Aprobado',
    documentoPagoFactura: 'FAC-09-112',
    facturadoFinal: 'Sí',
    estatusGeneral: 'Asignado Total',
    estatusFabrica: 'Asignado en CEDIS',
    origen: 'PORTAL_CEDIS',
    version: 1,
    creadoPor: 'Leidys Perez',
    creadoEn: '2026-09-08 09:30:00',
    actualizadoPor: 'Administrador CEDIS',
    actualizadoEn: '2026-09-08 09:35:00',
    observaciones: 'Cliente en taller con unidad parada urgente'
  },
  {
    pedidoId: 'PED-CV-2102',
    fechaCreacion: '2026-09-08 11:15:00',
    sucursal: 'Costa Verde',
    colaborador: 'Carlos Mendoza',
    canal: 'Taller',
    tipoPedido: 'Chapistería y Colisión',
    cotizacion: 'COT-CV-442',
    cliente: 'Aseguradora Fedpa / Auto Express',
    placa: 'CG-8812',
    modeloChangan: 'CS55 Plus DCT',
    vin: 'LS4A3C888TA029182',
    numeroOR: 'COL-4421',
    estadoPago: 'Aprobado',
    documentoPagoFactura: 'POL-FEDPA-990',
    facturadoFinal: 'No',
    estatusGeneral: 'Asignado Total',
    estatusFabrica: 'Asignado en CEDIS',
    origen: 'PORTAL_CEDIS',
    version: 1,
    creadoPor: 'Carlos Mendoza',
    creadoEn: '2026-09-08 11:15:00',
    actualizadoPor: 'Administrador CEDIS',
    actualizadoEn: '2026-09-08 11:20:00',
    observaciones: 'Reparación de frente por colisión'
  },
  {
    pedidoId: 'PED-TM-2103',
    fechaCreacion: '2026-09-09 14:00:00',
    sucursal: 'Tumba Muerto',
    colaborador: 'Alexis Rios',
    canal: 'Colisión',
    tipoPedido: 'Taller Mecánico',
    cotizacion: 'COT-TM-112',
    cliente: 'Flotas Corporativas Changan',
    placa: 'FL-4001',
    modeloChangan: 'Hunter 4x4 Diesel',
    vin: 'LS4A4D777SA038271',
    numeroOR: 'MT-1092',
    estadoPago: 'Facturado',
    documentoPagoFactura: 'FAC-FL-889',
    facturadoFinal: 'Sí',
    estatusGeneral: 'Despachado Total',
    estatusFabrica: 'Completado',
    origen: 'PORTAL_CEDIS',
    version: 2,
    creadoPor: 'Alexis Rios',
    creadoEn: '2026-09-09 14:00:00',
    actualizadoPor: 'Operador Bodega CEDIS',
    actualizadoEn: '2026-09-09 15:30:00',
    observaciones: 'Mantenimiento preventivo 40k km'
  },
  {
    pedidoId: 'PED-C50-2104',
    fechaCreacion: '2026-09-09 16:45:00',
    sucursal: 'Calle 50',
    colaborador: 'Valeria Castillo',
    canal: 'Garantías',
    tipoPedido: 'Garantía',
    cotizacion: 'GAR-C50-990',
    cliente: 'Roberto Gonzalez',
    placa: 'RG-7711',
    modeloChangan: 'CS35 Plus Turbo',
    vin: 'LS4A1A666PA048192',
    numeroOR: 'GAR-3329',
    estadoPago: 'Exento (Garantía)',
    documentoPagoFactura: 'GAR-CH-2026-11',
    facturadoFinal: 'No',
    estatusGeneral: 'Asignado Total',
    estatusFabrica: 'Aprobado Fábrica',
    origen: 'PORTAL_CEDIS',
    version: 1,
    creadoPor: 'Valeria Castillo',
    creadoEn: '2026-09-09 16:45:00',
    actualizadoPor: 'Administrador CEDIS',
    actualizadoEn: '2026-09-09 16:50:00',
    observaciones: 'Reclamo aprobado por fábrica'
  },
  // Pedido ausente preservado (1 de los 5)
  {
    pedidoId: 'PED-CV-2240',
    fechaCreacion: '2026-09-07 10:00:00',
    sucursal: 'Costa Verde',
    colaborador: 'Carlos Mendoza',
    canal: 'Taller',
    tipoPedido: 'VOR / Unidad Parada',
    cotizacion: 'COT-CV-2240',
    cliente: 'Constructora del Istmo S.A.',
    placa: 'CI-1199',
    modeloChangan: 'Hunter 4x4 Diesel',
    vin: 'LS4A9Z001YA888881',
    numeroOR: 'OR-9001',
    estadoPago: 'Aprobado',
    documentoPagoFactura: 'FAC-CV-781',
    facturadoFinal: 'Sí',
    estatusGeneral: 'Asignado Total',
    estatusFabrica: 'Asignado en CEDIS',
    origen: 'PORTAL_CEDIS',
    version: 1,
    creadoPor: 'Carlos Mendoza',
    creadoEn: '2026-09-07 10:00:00',
    actualizadoPor: 'Administrador CEDIS',
    actualizadoEn: '2026-09-07 10:15:00',
    observaciones: 'Control 9-Sep: Preservado sin borrado automático'
  }
];

export const DETALLES_BASE_9_SEP: DetalleRepuesto[] = [
  {
    lineaId: 'PED-VL-2101-L1',
    pedidoId: 'PED-VL-2101',
    codigoRepuesto: 'S111F270108-0103',
    codigoActualizado: 'S111F270108-0103',
    descripcionOficial: 'Puerta Delantera Derecha UNI-T',
    cantidadSolicitada: 1,
    cantidadAsignada: 1,
    cantidadDespachada: 0,
    contenedorAsignado: 'INV-CN-8902',
    palletAsignado: 'P001',
    packageNo: 'PKG-01',
    ubicacionCedis: 'Bahía A-01 / Pallet P001',
    estatusLinea: 'Asignado'
  },
  {
    lineaId: 'PED-CV-2102-L1',
    pedidoId: 'PED-CV-2102',
    codigoRepuesto: '8511F270102-0202-AA',
    codigoActualizado: '8511F270102-0202-AA',
    descripcionOficial: 'Faro Delantero LED Izquierdo CS55 Plus',
    cantidadSolicitada: 2,
    cantidadAsignada: 2,
    cantidadDespachada: 0,
    contenedorAsignado: 'INV-CN-8902',
    palletAsignado: 'P001',
    packageNo: 'PKG-02',
    ubicacionCedis: 'Bahía A-02 / Pallet P001',
    estatusLinea: 'Asignado'
  },
  {
    lineaId: 'PED-TM-2103-L1',
    pedidoId: 'PED-TM-2103',
    codigoRepuesto: 'F202F260100',
    codigoActualizado: 'F202F260100',
    descripcionOficial: 'Amortiguador Delantero Hunter 4x4',
    cantidadSolicitada: 4,
    cantidadAsignada: 0,
    cantidadDespachada: 4,
    contenedorAsignado: 'INV-CN-8902',
    palletAsignado: 'P002',
    packageNo: 'PKG-03',
    ubicacionCedis: 'Rack B-12 / Pallet P002',
    estatusLinea: 'Despachado'
  },
  {
    lineaId: 'PED-C50-2104-L1',
    pedidoId: 'PED-C50-2104',
    codigoRepuesto: 'E101F310100',
    codigoActualizado: 'E101F310100',
    descripcionOficial: 'Radiador de Enfriamiento Motor CS35',
    cantidadSolicitada: 2,
    cantidadAsignada: 2,
    cantidadDespachada: 0,
    contenedorAsignado: 'INV-CN-9140',
    palletAsignado: 'P101',
    packageNo: 'PKG-01',
    ubicacionCedis: 'Bahía D-01 / Pallet P101',
    estatusLinea: 'Asignado'
  },
  {
    lineaId: 'PED-CV-2240-L1',
    pedidoId: 'PED-CV-2240',
    codigoRepuesto: 'F202F260100',
    codigoActualizado: 'F202F260100',
    descripcionOficial: 'Amortiguador Delantero Hunter 4x4',
    cantidadSolicitada: 2,
    cantidadAsignada: 2,
    cantidadDespachada: 0,
    contenedorAsignado: 'INV-CN-8902',
    palletAsignado: 'P002',
    packageNo: 'PKG-03',
    ubicacionCedis: 'Rack B-12 / Pallet P002',
    estatusLinea: 'Asignado'
  }
];

export const AUDITORIA_INICIAL: AuditoriaKardex[] = [
  {
    auditoriaId: 'AUD-INIT-001',
    timestamp: '2026-09-08 10:00:00',
    usuarioId: 'USR-001',
    usuarioNombre: 'Administrador CEDIS',
    accion: 'DESPACHO_FISICO',
    entidad: 'Detalle_Repuestos',
    identificador: 'PED-VL-2090-L1',
    valoresAnteriores: JSON.stringify({ cantDespachada: 0, cantAsignada: 2 }),
    valoresNuevos: JSON.stringify({ cantDespachada: 2, cantAsignada: 0, contenedor: 'INV-CN-8902', pallet: 'P001' }),
    operationId: 'OP-DISP-20260908-01',
    notas: 'Despacho completado hacia Villa Lucre trasbordador #4'
  },
  {
    auditoriaId: 'AUD-INIT-002',
    timestamp: '2026-09-09 15:30:00',
    usuarioId: 'USR-002',
    usuarioNombre: 'Operador Bodega CEDIS',
    accion: 'DESPACHO_FISICO',
    entidad: 'Detalle_Repuestos',
    identificador: 'PED-TM-2103-L1',
    valoresAnteriores: JSON.stringify({ cantDespachada: 0, cantAsignada: 4 }),
    valoresNuevos: JSON.stringify({ cantDespachada: 4, cantAsignada: 0, contenedor: 'INV-CN-8902', pallet: 'P002' }),
    operationId: 'OP-DISP-20260909-02',
    notas: 'Despacho de amortiguadores para Flotas Corporativas'
  }
];

class AppsScriptClientService {
  private config: AppsScriptApiConfig;
  private usuarioActivo: UsuarioActivo;
  
  // Base de datos canónica local
  private cabeceras: SolicitudCabecera[] = [];
  private detalles: DetalleRepuesto[] = [];
  private manifiestos: DPLManifiesto[] = [];
  private dplDetalle: DPLDetalle[] = [];
  private modelos: ModeloChangan[] = [];
  private encargados: BDEncargado[] = [];
  private auditoria: AuditoriaKardex[] = [];

  constructor() {
    this.config = this.cargarConfig();
    this.usuarioActivo = this.cargarUsuarioActivo();
    this.cargarDatosLocales();
  }

  private memoryStore: Map<string, string> = new Map();

  private safeGet(key: string): string | null {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch (e) {
      // Fallback a memoryStore
    }
    return this.memoryStore.get(key) || null;
  }

  private safeSet(key: string, value: string): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      // Fallback
    }
    this.memoryStore.set(key, value);
  }

  private cargarConfig(): AppsScriptApiConfig {
    const defaultUrl = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_APPS_SCRIPT_URL) || OFFICIAL_WEB_APP_URL;
    try {
      const c = this.safeGet(STORAGE_KEYS.CONFIG);
      if (c) {
        const parsed = JSON.parse(c);
        if (!parsed.webAppUrl) {
          parsed.webAppUrl = defaultUrl;
          parsed.modoOfflineSimulado = false;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Error cargando config API:', e);
    }
    return {
      webAppUrl: defaultUrl,
      modoOfflineSimulado: false,
      estadoConexion: 'MODO_LOCAL_SEGURO',
      ultimoPing: new Date().toISOString()
    };
  }

  public guardarConfig(cfg: Partial<AppsScriptApiConfig>): void {
    this.config = { ...this.config, ...cfg };
    this.safeSet(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
  }

  public getConfig(): AppsScriptApiConfig {
    return { ...this.config };
  }

  /**
   * Ejecuta el diagnóstico de conectividad, CORS y preflight OPTIONS para validar la API
   */
  public async diagnosticarConexion(urlCustom?: string, timeoutMs?: number): Promise<ResultadoDiagnosticoCORS> {
    const targetUrl = urlCustom !== undefined ? urlCustom : this.config.webAppUrl;
    const resultado = await diagnosticarConexionAppsScript(targetUrl, timeoutMs);
    if (resultado.ok) {
      this.guardarConfig({
        estadoConexion: 'CONECTADO_CANONICO',
        ultimoPing: new Date().toISOString()
      });
    } else if (targetUrl) {
      this.guardarConfig({
        estadoConexion: 'ERROR_CONEXION'
      });
    }
    return resultado;
  }

  /**
   * Sincronización Canónica Bidireccional: Trae datos vivos desde Google Apps Script (Endpoint getInitialData)
   * e hidrata el estado local de la aplicación.
   */
  public async fetchInitialData(forzar: boolean = false): Promise<{
    success: boolean;
    error?: string;
    totalCargado?: {
      cabeceras: number;
      detalles: number;
      manifiestos: number;
      dplDetalle: number;
      modelos: number;
      encargados: number;
      auditoria: number;
    };
  }> {
    if (!this.config.webAppUrl || this.config.modoOfflineSimulado) {
      return {
        success: true,
        error: 'Modo local activo (no se contactó Google Sheets porque no hay URL configurada o está en modo offline).'
      };
    }

    try {
      const url = new URL(this.config.webAppUrl);
      url.searchParams.set('action', 'getInitialData');
      url.searchParams.set('userEmail', this.usuarioActivo.correo);
      if (forzar) {
        url.searchParams.set('_ts', Date.now().toString());
      }

      const resp = await fetch(url.toString(), {
        method: 'GET'
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const resJson = await resp.json();

      if (!resJson.success || !resJson.data) {
        return {
          success: false,
          error: resJson.error || 'Respuesta inválida del backend de Google Apps Script.'
        };
      }

      const data = resJson.data;

      // 1. Cabeceras
      if (Array.isArray(data.cabeceras) && data.cabeceras.length > 0) {
        this.cabeceras = data.cabeceras.map((c: any) => ({
          ...c,
          version: Number(c.version) || 1
        }));
      }

      // 2. Detalles
      if (Array.isArray(data.detalles) && data.detalles.length > 0) {
        this.detalles = data.detalles.map((d: any) => ({
          ...d,
          cantidadSolicitada: Number(d.cantidadSolicitada) || 0,
          cantidadAsignada: Number(d.cantidadAsignada) || 0,
          cantidadDespachada: Number(d.cantidadDespachada) || 0
        }));
      }

      // 3. Manifiestos
      if (Array.isArray(data.manifiestos) && data.manifiestos.length > 0) {
        this.manifiestos = data.manifiestos.map((m: any) => ({
          ...m,
          totalPiezas: Number(m.totalPiezas) || 0,
          skusUnicos: Number(m.skusUnicos) || 0,
          totalPallets: Number(m.totalPallets) || 1
        }));
      }

      // 4. DPL Detalle (Inventario Físico)
      if (Array.isArray(data.dplDetalle) && data.dplDetalle.length > 0) {
        this.dplDetalle = data.dplDetalle.map((i: any) => ({
          ...i,
          cantidadTotal: Number(i.cantidadTotal) || 0,
          cantidadAsignada: Number(i.cantidadAsignada) || 0,
          cantidadDespachada: Number(i.cantidadDespachada) || 0,
          saldoDisponible: i.saldoDisponible !== undefined 
            ? Number(i.saldoDisponible) 
            : (Number(i.cantidadTotal) || 0) - (Number(i.cantidadAsignada) || 0) - (Number(i.cantidadDespachada) || 0)
        }));
      }

      // 5. Modelos
      if (Array.isArray(data.modelos) && data.modelos.length > 0) {
        this.modelos = data.modelos;
      }

      // 6. Encargados
      if (Array.isArray(data.encargados) && data.encargados.length > 0) {
        this.encargados = data.encargados;
      }

      // 7. Auditoría
      if (Array.isArray(data.auditoria) && data.auditoria.length > 0) {
        this.auditoria = data.auditoria;
      }

      this.persistirDatos();
      this.guardarConfig({
        estadoConexion: 'CONECTADO_CANONICO',
        ultimoPing: new Date().toISOString()
      });

      return {
        success: true,
        totalCargado: {
          cabeceras: this.cabeceras.length,
          detalles: this.detalles.length,
          manifiestos: this.manifiestos.length,
          dplDetalle: this.dplDetalle.length,
          modelos: this.modelos.length,
          encargados: this.encargados.length,
          auditoria: this.auditoria.length
        }
      };
    } catch (err: any) {
      console.warn('Fallo al obtener datos vivos desde Google Sheets (manteniendo caché local):', err);
      return {
        success: false,
        error: `Error de red al consultar Google Sheets: ${err.message || err}`
      };
    }
  }

  public getUsuarioActivo(): UsuarioActivo {
    return { ...this.usuarioActivo };
  }

  public setUsuarioActivo(usr: UsuarioActivo): void {
    this.usuarioActivo = { ...usr };
    this.safeSet(STORAGE_KEYS.USER, JSON.stringify(this.usuarioActivo));
  }

  private cargarUsuarioActivo(): UsuarioActivo {
    try {
      const u = this.safeGet(STORAGE_KEYS.USER);
      if (u) return JSON.parse(u);
    } catch (e) {
      console.warn('Error cargando usuario activo:', e);
    }
    // Default: Administrador CEDIS
    const admin = USUARIOS_OFICIALES[0];
    return {
      usuarioId: admin.usuarioId,
      nombre: admin.nombre,
      correo: admin.correo,
      sucursal: admin.sucursal,
      canal: admin.canal,
      rol: admin.rol,
      activo: admin.activo,
      movilHabilitado: admin.movilHabilitado
    };
  }

  private cargarDatosLocales(): void {
    try {
      const cab = this.safeGet(STORAGE_KEYS.CABECERA);
      this.cabeceras = cab ? JSON.parse(cab) : CABECERAS_BASE_9_SEP;

      const det = this.safeGet(STORAGE_KEYS.DETALLE);
      this.detalles = det ? JSON.parse(det) : DETALLES_BASE_9_SEP;

      const man = this.safeGet(STORAGE_KEYS.MANIFIESTOS);
      this.manifiestos = man ? JSON.parse(man) : CONTENEDORES_CANONICOS;

      const dpl = this.safeGet(STORAGE_KEYS.DPL_DETALLE);
      this.dplDetalle = dpl ? JSON.parse(dpl) : DPL_DETALLE_CANONICO;

      const mod = this.safeGet(STORAGE_KEYS.MODELOS);
      const parsedMod = mod ? JSON.parse(mod) : null;
      if (parsedMod && Array.isArray(parsedMod) && parsedMod.length >= 18) {
        this.modelos = parsedMod;
      } else {
        this.modelos = MODELOS_OFICIALES;
        this.safeSet(STORAGE_KEYS.MODELOS, JSON.stringify(this.modelos));
      }

      const enc = this.safeGet(STORAGE_KEYS.ENCARGADOS);
      this.encargados = enc ? JSON.parse(enc) : USUARIOS_OFICIALES;

      const aud = this.safeGet(STORAGE_KEYS.AUDITORIA);
      this.auditoria = aud ? JSON.parse(aud) : AUDITORIA_INICIAL;
    } catch (e) {
      console.error('Error cargando almacén canónico:', e);
      this.cabeceras = CABECERAS_BASE_9_SEP;
      this.detalles = DETALLES_BASE_9_SEP;
      this.manifiestos = CONTENEDORES_CANONICOS;
      this.dplDetalle = DPL_DETALLE_CANONICO;
      this.modelos = MODELOS_OFICIALES;
      this.encargados = USUARIOS_OFICIALES;
      this.auditoria = AUDITORIA_INICIAL;
    }
  }

  private persistirDatos(): void {
    this.safeSet(STORAGE_KEYS.CABECERA, JSON.stringify(this.cabeceras));
    this.safeSet(STORAGE_KEYS.DETALLE, JSON.stringify(this.detalles));
    this.safeSet(STORAGE_KEYS.MANIFIESTOS, JSON.stringify(this.manifiestos));
    this.safeSet(STORAGE_KEYS.DPL_DETALLE, JSON.stringify(this.dplDetalle));
    this.safeSet(STORAGE_KEYS.MODELOS, JSON.stringify(this.modelos));
    this.safeSet(STORAGE_KEYS.ENCARGADOS, JSON.stringify(this.encargados));
    this.safeSet(STORAGE_KEYS.AUDITORIA, JSON.stringify(this.auditoria));
  }

  /**
   * Obtiene la Matriz Central Derivada combinando Cabeceras, Detalles e Inventario
   */
  public getMatrizCentral(): FilaMatrizCentral[] {
    const cabMap = new Map<string, SolicitudCabecera>();
    this.cabeceras.forEach(c => cabMap.set(c.pedidoId, c));

    const filas: FilaMatrizCentral[] = [];

    this.detalles.forEach(d => {
      const cab = cabMap.get(d.pedidoId);
      const cantSol = Number(d.cantidadSolicitada) || 1;
      const cantAsig = Number(d.cantidadAsignada) || 0;
      const cantDesp = Number(d.cantidadDespachada) || 0;
      const saldoPendiente = Math.max(0, cantSol - cantAsig - cantDesp);

      filas.push({
        lineaId: d.lineaId,
        pedidoId: d.pedidoId,
        fechaCreacion: cab ? cab.fechaCreacion : '2026-09-10',
        sucursal: cab ? cab.sucursal : 'Desconocida',
        colaborador: cab ? cab.colaborador : 'Desconocido',
        tipoPedido: cab ? cab.tipoPedido : 'Stock Regular',
        cotizacion: cab ? cab.cotizacion : '',
        cliente: cab ? cab.cliente : '',
        placa: cab ? cab.placa : '',
        modeloChangan: cab ? cab.modeloChangan : '',
        vin: cab ? cab.vin : '',
        numeroOR: cab ? cab.numeroOR : '',
        codigoRepuesto: d.codigoRepuesto,
        codigoActualizado: d.codigoActualizado || d.codigoRepuesto,
        descripcionOficial: d.descripcionOficial,
        cantidadSolicitada: cantSol,
        cantidadAsignada: cantAsig,
        cantidadDespachada: cantDesp,
        saldoPendiente: saldoPendiente,
        contenedorAsignado: d.contenedorAsignado,
        palletAsignado: d.palletAsignado,
        packageNo: d.packageNo,
        ubicacionCedis: d.ubicacionCedis,
        estatusLinea: d.estatusLinea,
        estatusGeneral: cab ? cab.estatusGeneral : 'Pendiente',
        origen: cab ? cab.origen : 'PORTAL_CEDIS',
        observaciones: cab?.observaciones || ''
      });
    });

    return filas;
  }

  public getCabeceras(): SolicitudCabecera[] {
    return [...this.cabeceras];
  }

  public getDetalles(): DetalleRepuesto[] {
    return [...this.detalles];
  }

  public getManifiestos(): DPLManifiesto[] {
    return [...this.manifiestos];
  }

  public getDPLDetalle(): DPLDetalle[] {
    return [...this.dplDetalle];
  }

  public getModelos(): ModeloChangan[] {
    return [...this.modelos];
  }

  public getEncargados(): BDEncargado[] {
    return [...this.encargados];
  }

  public getAuditoria(): AuditoriaKardex[] {
    return [...this.auditoria];
  }

  /**
   * Cálculo de KPIs con la fórmula estricta:
   * saldoDisponible = cantidadTotal - cantidadAsignada - cantidadDespachada
   */
  public getKPIs() {
    let totDpl = 0;
    let desp = 0;
    let asig = 0;
    let saldoDisp = 0;
    const skusSet = new Set<string>();

    this.dplDetalle.forEach(item => {
      const tot = Number(item.cantidadTotal) || 0;
      const d = Number(item.cantidadDespachada) || 0;
      const a = Number(item.cantidadAsignada) || 0;
      const s = tot - a - d;

      totDpl += tot;
      desp += d;
      asig += a;
      saldoDisp += s;

      if (item.codigoRepuesto) {
        skusSet.add(item.codigoRepuesto.trim().toUpperCase());
      }
    });

    return {
      totalDpl: totDpl,
      despachado: desp,
      comprometido: asig,
      saldoLibre: saldoDisp,
      skus: skusSet.size
    };
  }

  /**
   * Actualiza el estatus de un Manifiesto / Contenedor DPL:
   * Ciclo de Vida: 'EN TRÁNSITO' -> 'ADUANA' -> 'RECIBIDO'
   * REGLA DE NEGOCIO OBLIGATORIA:
   * - Solamente cuando el estatus pasa a 'RECIBIDO' se ejecuta el matching automático FIFO y se asignan repuestos a pedidos.
   * - Si está en 'EN TRÁNSITO' o 'ADUANA', los repuestos NO se asignan a órdenes, pero quedan registrados en historial y disponibles para rastreo universal.
   */
  public async actualizarEstatusManifiesto(
    contenedorId: string,
    nuevoEstado: EstatusDPL | string
  ): Promise<{
    success: boolean;
    nuevoEstado: EstatusDPL;
    asignacionesEjecutadas: boolean;
    reporteMatching?: any;
    error?: string;
    mensaje: string;
  }> {
    const idTarget = (contenedorId || '').trim().toUpperCase();
    let contIndex = this.manifiestos.findIndex(m => (m.contenedorId || '').trim().toUpperCase() === idTarget);
    const estadoNormalizado = normalizarEstatusDPL(nuevoEstado);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const operationId = `OP-MAN-STATUS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, enviar mutación a Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updateManifiestoStatus',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            contenedorId: idTarget,
            nuevoEstado: estadoNormalizado
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script updateManifiestoStatus error:', resJson.error);
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script updateManifiestoStatus, aplicando fallback local:', err);
      }
    }
    
    if (contIndex === -1) {
      // Auto-registrar cabecera de manifiesto si no existía
      const itemsLote = this.dplDetalle.filter(i => (i.contenedorId || '').trim().toUpperCase() === idTarget);
      const totalPiezas = itemsLote.reduce((acc, it) => acc + (Number(it.cantidadTotal) || 0), 0);
      const skus = new Set(itemsLote.map(it => (it.codigoRepuesto || '').toUpperCase())).size;
      const pallets = new Set(itemsLote.map(it => it.palletCaseNo || it.pallet || 'P001')).size;

      const nuevoMan: DPLManifiesto = {
        contenedorId: idTarget,
        proveedor: 'Mobitech Changan China Co., Ltd',
        fechaArribo: new Date().toISOString().split('T')[0],
        poReferencia: `PO-${idTarget}`,
        tipoTransporte: 'Marítimo 40HQ',
        totalPiezas: totalPiezas || 1,
        skusUnicos: skus || 1,
        totalPallets: pallets || 1,
        estado: estadoNormalizado,
        creadoPor: this.usuarioActivo.nombre,
        creadoEn: ahora
      };
      this.manifiestos.unshift(nuevoMan);
      contIndex = 0;
    }

    const estadoAnterior = this.manifiestos[contIndex].estado;
    this.manifiestos[contIndex].estado = estadoNormalizado;

    // Actualizar ubicación descriptiva de los items si corresponde
    this.dplDetalle.forEach(item => {
      if ((item.contenedorId || '').trim().toUpperCase() === idTarget) {
        const ubi = item.ubicacionCedis || '';
        if (estadoNormalizado === 'EN TRÁNSITO') {
          item.ubicacionCedis = 'En Tránsito Marítimo / Altamar (Rastreo Activo)';
        } else if (estadoNormalizado === 'ADUANA') {
          item.ubicacionCedis = 'En Trámites de Aduana / Puerto (Rastreo Activo)';
        } else if (estadoNormalizado === 'RECIBIDO') {
          if (ubi.includes('Tránsito') || ubi.includes('Aduana') || !ubi) {
            item.ubicacionCedis = `Bahía CEDIS / Pallet ${item.palletCaseNo || item.pallet || 'P001'}`;
          }
        }
      }
    });

    // Ejecutar motor de matching global
    const reporteMatching = this.ejecutarMatchingGlobal();
    const asignacionesEjecutadas = estadoNormalizado === 'RECIBIDO';

    // Registro en auditoría inmutable
    this.auditoria.unshift({
      auditoriaId: `AUD-DPL-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'CORRECCION_DPL',
      entidad: 'DPL_Manifiestos',
      identificador: idTarget,
      valoresAnteriores: JSON.stringify({ estado: estadoAnterior }),
      valoresNuevos: JSON.stringify({ estado: estadoNormalizado }),
      operationId: operationId,
      notas: `Estatus de contenedor ${idTarget} actualizado a ${estadoNormalizado}.${
        estadoNormalizado === 'RECIBIDO' 
          ? ` Asignación automática ejecutada: ${reporteMatching.piezasAsignadas} piezas asignadas.` 
          : ' Piezas reservadas para validación en Rastreador Universal (sin asignación a órdenes).'
      }`
    });

    this.persistirDatos();

    const mensaje = estadoNormalizado === 'RECIBIDO'
      ? `Contenedor ${idTarget} marcado como RECIBIDO en Bodega CEDIS. Se han asignado automáticamente repuestos a las requisiciones pendientes por prioridad FIFO.`
      : `Contenedor ${idTarget} actualizado a estatus "${estadoNormalizado}". Sus repuestos están disponibles para consulta en el Rastreador Universal y se asignarán cuando cambie a "RECIBIDO".`;

    return {
      success: true,
      nuevoEstado: estadoNormalizado,
      asignacionesEjecutadas,
      reporteMatching,
      mensaje
    };
  }

  /**
   * Importación de un nuevo Manifiesto / DPL con selección de estatus inicial
   */
  public async importarManifiestoDPL(payload: {
    contenedorId: string;
    proveedor?: string;
    poReferencia?: string;
    tipoTransporte?: string;
    fechaArribo?: string;
    estado?: EstatusDPL | string;
    items: Array<{
      palletCaseNo?: string;
      packageNo?: string;
      codigoRepuesto: string;
      descripcion?: string;
      cantidadTotal: number | string;
      ubicacionCedis?: string;
      pallet?: string;
      unidadMedida?: string;
    }>;
  }): Promise<{
    success: boolean;
    contenedorId: string;
    totalLineas: number;
    totalPiezas: number;
    estado: EstatusDPL;
    asignacionesEjecutadas: boolean;
    reporteMatching?: any;
    error?: string;
    mensaje: string;
  }> {
    const idCont = (payload.contenedorId || '').trim().toUpperCase();
    if (!idCont) {
      return {
        success: false,
        contenedorId: '',
        totalLineas: 0,
        totalPiezas: 0,
        estado: 'EN TRÁNSITO',
        asignacionesEjecutadas: false,
        error: 'El ID de Contenedor es obligatorio.',
        mensaje: 'El ID de Contenedor es obligatorio.'
      };
    }

    if (!payload.items || payload.items.length === 0) {
      return {
        success: false,
        contenedorId: idCont,
        totalLineas: 0,
        totalPiezas: 0,
        estado: 'EN TRÁNSITO',
        asignacionesEjecutadas: false,
        error: 'El archivo DPL no contiene filas de repuestos válidas.',
        mensaje: 'El archivo DPL no contiene filas de repuestos válidas.'
      };
    }

    const estadoNormalizado = normalizarEstatusDPL(payload.estado || 'EN TRÁNSITO');
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const operationId = `OP-DPL-UPLOAD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, enviar mutación a Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'importManifiestoDPL',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            contenedorId: idCont,
            proveedor: payload.proveedor,
            poReferencia: payload.poReferencia,
            tipoTransporte: payload.tipoTransporte,
            fechaArribo: payload.fechaArribo,
            estado: estadoNormalizado,
            items: payload.items
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script importManifiestoDPL error:', resJson.error);
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script importManifiestoDPL, aplicando fallback local:', err);
      }
    }

    // Eliminar versión previa del mismo contenedor si ya existía para sobrescribir limpiamente
    this.manifiestos = this.manifiestos.filter(m => m.contenedorId.trim().toUpperCase() !== idCont);
    this.dplDetalle = this.dplDetalle.filter(i => i.contenedorId.trim().toUpperCase() !== idCont);

    let totalPiezas = 0;
    const skusSet = new Set<string>();
    const palletsSet = new Set<string>();
    const nuevosItems: DPLDetalle[] = [];

    payload.items.forEach((it, idx) => {
      const cod = (it.codigoRepuesto || '').trim().toUpperCase();
      if (!cod) return;

      const cant = Math.max(1, Number(it.cantidadTotal) || 1);
      totalPiezas += cant;
      skusSet.add(cod);

      const pallet = (it.palletCaseNo || it.pallet || `P${String(idx + 1).padStart(3, '0')}`).trim();
      palletsSet.add(pallet);

      let ubicacion = it.ubicacionCedis;
      if (!ubicacion) {
        if (estadoNormalizado === 'EN TRÁNSITO') {
          ubicacion = 'En Tránsito Marítimo / Altamar';
        } else if (estadoNormalizado === 'ADUANA') {
          ubicacion = 'En Trámites de Aduana / Puerto';
        } else {
          ubicacion = `Bahía CEDIS / Pallet ${pallet}`;
        }
      }

      nuevosItems.push({
        inventarioId: `${idCont}_${idx + 1}`,
        contenedorId: idCont,
        palletCaseNo: pallet,
        packageNo: it.packageNo || `PKG-${String(idx + 1).padStart(2, '0')}`,
        codigoRepuesto: cod,
        descripcion: (it.descripcion || 'Repuesto Genuino Changan').trim(),
        cantidadTotal: cant,
        cantidadAsignada: 0,
        cantidadDespachada: 0,
        saldoDisponible: cant,
        ubicacionCedis: ubicacion,
        dplDetalleId: `${idCont}_${idx + 1}`,
        pallet: pallet,
        unidadMedida: it.unidadMedida || 'PZA'
      });
    });

    const nuevoManifiesto: DPLManifiesto = {
      contenedorId: idCont,
      proveedor: (payload.proveedor || 'Mobitech Changan China Co., Ltd').trim(),
      fechaArribo: payload.fechaArribo || ahora.substring(0, 10),
      poReferencia: (payload.poReferencia || `PO-${idCont}`).trim(),
      tipoTransporte: payload.tipoTransporte || 'Marítimo 40HQ',
      totalPiezas: totalPiezas,
      skusUnicos: skusSet.size,
      totalPallets: palletsSet.size || 1,
      estado: estadoNormalizado,
      creadoPor: this.usuarioActivo.nombre,
      creadoEn: ahora,
      estatusAduana: estadoNormalizado,
      totalItems: nuevosItems.length,
      piezasTotales: totalPiezas,
      piezasDespachadas: 0
    };

    this.manifiestos.unshift(nuevoManifiesto);
    this.dplDetalle.unshift(...nuevosItems);

    // Ejecutar matching solo si el estatus es RECIBIDO
    let reporteMatching: any = null;
    let asignacionesEjecutadas = false;

    if (estadoNormalizado === 'RECIBIDO') {
      reporteMatching = this.ejecutarMatchingGlobal();
      asignacionesEjecutadas = true;
    } else {
      // Re-sincronizar matching para asegurar que las órdenes pendientes no tengan cosas fantasmas
      reporteMatching = this.ejecutarMatchingGlobal();
    }

    this.auditoria.unshift({
      auditoriaId: `AUD-DPL-IMP-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'IMPORTACION_CONCILIACION',
      entidad: 'DPL_Manifiestos',
      identificador: idCont,
      valoresAnteriores: '{}',
      valoresNuevos: JSON.stringify({
        contenedorId: idCont,
        estado: estadoNormalizado,
        totalPiezas,
        skus: skusSet.size,
        pallets: palletsSet.size
      }),
      operationId: operationId,
      notas: `DPL ${idCont} importado con ${totalPiezas} piezas en estatus ${estadoNormalizado}.${
        estadoNormalizado === 'RECIBIDO' 
          ? ' Asignación FIFO ejecutada.' 
          : ' Repuestos en espera de arribo físico en CEDIS.'
      }`
    });

    this.persistirDatos();

    const mensaje = estadoNormalizado === 'RECIBIDO'
      ? `DPL ${idCont} cargado con éxito como RECIBIDO (${totalPiezas} piezas). Se asignaron repuestos a requisiciones pendientes.`
      : `DPL ${idCont} cargado con éxito en estatus "${estadoNormalizado}" (${totalPiezas} piezas). Los repuestos quedan registrados en historial y Rastreador Universal, sin asignar hasta recibir en CEDIS.`;

    return {
      success: true,
      contenedorId: idCont,
      totalLineas: nuevosItems.length,
      totalPiezas,
      estado: estadoNormalizado,
      asignacionesEjecutadas,
      reporteMatching,
      mensaje
    };
  }

  /**
   * Eliminar un contenedor / manifiesto DPL y sus items asociados
   */
  public eliminarManifiestoDPL(contenedorId: string): { success: boolean; mensaje: string } {
    const idTarget = (contenedorId || '').trim().toUpperCase();
    this.manifiestos = this.manifiestos.filter(m => m.contenedorId.trim().toUpperCase() !== idTarget);
    this.dplDetalle = this.dplDetalle.filter(i => i.contenedorId.trim().toUpperCase() !== idTarget);

    // Limpiar asignaciones en pedidos que apuntaban a este contenedor si no estaban despachados
    this.detalles.forEach(d => {
      if ((d.contenedorAsignado || '').trim().toUpperCase() === idTarget && d.estatusLinea !== 'Despachado') {
        d.cantidadAsignada = 0;
        d.contenedorAsignado = '';
        d.palletAsignado = '';
        d.packageNo = '';
        d.estatusLinea = 'Pendiente';
        d.ubicacionCedis = 'Sin Stock en CEDIS • Requiere Fábrica';
      }
    });

    this.ejecutarMatchingGlobal();
    this.persistirDatos();

    return {
      success: true,
      mensaje: `Contenedor ${idTarget} eliminado del sistema. Reasignación de stock ejecutada.`
    };
  }

  /**
   * Generación automática e inalterable de Número de Pedido Único Oficial
   * Garantiza correlativo único por sucursal sin repetición alguna.
   */
  public generarNumeroPedidoUnico(prefijoOSucursal: string): string {
    let prefijo = 'CEN';
    const pUpper = (prefijoOSucursal || '').toUpperCase();
    if (pUpper.includes('COSTA') || pUpper === 'CV') prefijo = 'CV';
    else if (pUpper.includes('LUCRE') || pUpper === 'VL') prefijo = 'VL';
    else if (pUpper.includes('50') || pUpper === 'C50') prefijo = 'C50';
    else if (pUpper.includes('MUERTO') || pUpper === 'TM') prefijo = 'TM';
    else if (pUpper.includes('CHIRI') || pUpper === 'CH') prefijo = 'CH';
    else if (pUpper.includes('MARIA') || pUpper.includes('MARÍA') || pUpper === 'SM') prefijo = 'SM';

    const existingIds = new Set<string>();
    this.cabeceras.forEach(c => c.pedidoId && existingIds.add(c.pedidoId.toUpperCase().trim()));
    this.detalles.forEach(d => d.pedidoId && existingIds.add(d.pedidoId.toUpperCase().trim()));

    // Buscar el número correlativo más alto existente para este prefijo
    let maxCorrelativo = 2045;
    const year = 2026;
    const regexCompleta = new RegExp(`^PED-${prefijo}-(?:${year}-)?(\\d+)$`, 'i');

    for (const id of existingIds) {
      const match = id.match(regexCompleta);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxCorrelativo) {
          maxCorrelativo = num;
        }
      }
    }

    let siguiente = maxCorrelativo + 1;
    // Formato con año si es > 9000 o estándar como PED-CV-2026-XXXX o PED-VL-XXXX
    let candidato = siguiente > 5000 
      ? `PED-${prefijo}-${year}-${siguiente}` 
      : `PED-${prefijo}-${siguiente}`;

    while (existingIds.has(candidato.toUpperCase())) {
      siguiente++;
      candidato = siguiente > 5000 
        ? `PED-${prefijo}-${year}-${siguiente}` 
        : `PED-${prefijo}-${siguiente}`;
    }

    return candidato;
  }

  /**
   * Creación Canónica de Pedidos Multi-Línea
   * Genera 1 fila en Solicitudes_Cabecera y N filas en Detalle_Repuestos
   */
  public async crearPedido(
    cabecera: Omit<SolicitudCabecera, 'version' | 'creadoPor' | 'creadoEn' | 'actualizadoPor' | 'actualizadoEn' | 'estatusGeneral'>,
    items: Array<{ codigoRepuesto: string; descripcionOficial: string; cantidadSolicitada: number }>
  ): Promise<{ success: boolean; pedidoId?: string; error?: string }> {
    const operationId = `OP-CREA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Si hay Web App URL configurada, invocar Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createPedido',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedido: {
              ...cabecera,
              items: items
            }
          })
        });
        const resJson = await resp.json();
        if (resJson.success) {
          // Actualizar estado canónico local de inmediato para que la UI lo refleje sin recargar
          const nuevaCabecera: SolicitudCabecera = {
            ...cabecera,
            estatusGeneral: 'Pendiente',
            version: 1,
            creadoPor: this.usuarioActivo.nombre,
            creadoEn: ahora,
            actualizadoPor: this.usuarioActivo.nombre,
            actualizadoEn: ahora
          };

          const nuevosDetalles: DetalleRepuesto[] = items.map((it, idx) => ({
            lineaId: `${cabecera.pedidoId}-L${idx + 1}`,
            pedidoId: cabecera.pedidoId,
            codigoRepuesto: it.codigoRepuesto,
            codigoActualizado: it.codigoRepuesto,
            descripcionOficial: it.descripcionOficial,
            cantidadSolicitada: it.cantidadSolicitada,
            cantidadAsignada: 0,
            cantidadDespachada: 0,
            contenedorAsignado: '',
            palletAsignado: '',
            packageNo: '',
            ubicacionCedis: '',
            estatusLinea: 'Pendiente'
          }));

          if (!this.cabeceras.some(c => c.pedidoId === cabecera.pedidoId)) {
            this.cabeceras.unshift(nuevaCabecera);
            this.detalles.unshift(...nuevosDetalles);
          }

          this.auditoria.unshift({
            auditoriaId: `AUD-${Date.now()}`,
            timestamp: ahora,
            usuarioId: this.usuarioActivo.usuarioId,
            usuarioNombre: this.usuarioActivo.nombre,
            accion: 'CREACION_PEDIDO',
            entidad: 'Solicitudes_Cabecera',
            identificador: cabecera.pedidoId,
            valoresAnteriores: '{}',
            valoresNuevos: JSON.stringify({ pedidoId: cabecera.pedidoId, totalLineas: items.length, cliente: cabecera.cliente }),
            operationId: operationId,
            notas: `Requisición registrada canónicamente en Google Sheets desde sucursal ${cabecera.sucursal}`
          });

          this.persistirDatos();
          return { success: true, pedidoId: resJson.pedidoId || cabecera.pedidoId };
        } else {
          return { success: false, error: resJson.error };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script, aplicando fallback canónico local:', err);
      }
    }

    // 2. Ejecución local segura con idempotencia y verificación de duplicados
    if (this.cabeceras.some(c => c.pedidoId === cabecera.pedidoId)) {
      return { success: false, error: `El identificador de pedido ${cabecera.pedidoId} ya existe.` };
    }

    const nuevaCabecera: SolicitudCabecera = {
      ...cabecera,
      estatusGeneral: 'Pendiente',
      version: 1,
      creadoPor: this.usuarioActivo.nombre,
      creadoEn: ahora,
      actualizadoPor: this.usuarioActivo.nombre,
      actualizadoEn: ahora
    };

    const nuevosDetalles: DetalleRepuesto[] = items.map((it, idx) => ({
      lineaId: `${cabecera.pedidoId}-L${idx + 1}`,
      pedidoId: cabecera.pedidoId,
      codigoRepuesto: it.codigoRepuesto,
      codigoActualizado: it.codigoRepuesto,
      descripcionOficial: it.descripcionOficial,
      cantidadSolicitada: it.cantidadSolicitada,
      cantidadAsignada: 0,
      cantidadDespachada: 0,
      contenedorAsignado: '',
      palletAsignado: '',
      packageNo: '',
      ubicacionCedis: '',
      estatusLinea: 'Pendiente'
    }));

    this.cabeceras.unshift(nuevaCabecera);
    this.detalles.unshift(...nuevosDetalles);

    // Registrar en Auditoría Inmutable
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'CREACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: cabecera.pedidoId,
      valoresAnteriores: '{}',
      valoresNuevos: JSON.stringify({ pedidoId: cabecera.pedidoId, totalLineas: items.length, cliente: cabecera.cliente }),
      operationId: operationId,
      notas: `Requisición ingresada desde sucursal ${cabecera.sucursal}`
    });

    this.persistirDatos();
    return { success: true, pedidoId: cabecera.pedidoId };
  }

  /**
   * Asignación Atómica de Inventario Físico DPL a una Línea de Repuesto
   */
  public async asignarStock(
    lineaId: string,
    inventarioId: string,
    cantidadAsignar: number
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    // Control de Rol
    if (this.usuarioActivo.rol !== 'ADMINISTRADOR_CEDIS' && this.usuarioActivo.rol !== 'OPERADOR_CEDIS') {
      return { success: false, error: 'Permisos insuficientes. Solo CEDIS puede asignar repuestos de inventario central.' };
    }

    const operationId = `OP-ASIG-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const detIndex = this.detalles.findIndex(d => d.lineaId === lineaId);
    if (detIndex === -1) return { success: false, error: 'Línea de pedido no encontrada.' };

    const invIndex = this.dplDetalle.findIndex(i => i.inventarioId === inventarioId);
    if (invIndex === -1) return { success: false, error: 'Lote de inventario no encontrado.' };

    const linea = this.detalles[detIndex];
    const lote = this.dplDetalle[invIndex];

    const saldoDisp = lote.cantidadTotal - lote.cantidadAsignada - lote.cantidadDespachada;
    if (saldoDisp < cantidadAsignar) {
      return {
        success: false,
        error: `Stock insuficiente en ${lote.palletCaseNo}. Saldo disponible: ${saldoDisp} u., Solicitado: ${cantidadAsignar} u.`
      };
    }

    // 1. Si hay Web App URL configurada, invocar Apps Script con LockService
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'assignStock',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            lineaId: lineaId,
            inventarioId: inventarioId,
            cantidad: cantidadAsignar
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          return { success: false, error: resJson.error || 'Error al asignar stock en el servidor.' };
        }
      } catch (err) {
        console.warn('Fallo llamada remota assignStock, aplicando fallback canónico local:', err);
      }
    }

    const prevAsig = linea.cantidadAsignada;
    const nuevaAsig = prevAsig + cantidadAsignar;

    // Actualizar Detalle_Repuestos
    this.detalles[detIndex] = {
      ...linea,
      cantidadAsignada: nuevaAsig,
      contenedorAsignado: lote.contenedorId,
      palletAsignado: lote.palletCaseNo,
      packageNo: lote.packageNo,
      ubicacionCedis: lote.ubicacionCedis,
      estatusLinea: 'Asignado'
    };

    // Actualizar DPL_Detalle
    const loteNuevaAsig = lote.cantidadAsignada + cantidadAsignar;
    const loteNuevoSaldo = lote.cantidadTotal - loteNuevaAsig - lote.cantidadDespachada;
    this.dplDetalle[invIndex] = {
      ...lote,
      cantidadAsignada: loteNuevaAsig,
      saldoDisponible: loteNuevoSaldo
    };

    // Actualizar Estatus General en Cabecera
    const cabIndex = this.cabeceras.findIndex(c => c.pedidoId === linea.pedidoId);
    if (cabIndex !== -1) {
      this.cabeceras[cabIndex].estatusGeneral = 'Asignado Parcial';
      this.cabeceras[cabIndex].actualizadoPor = this.usuarioActivo.nombre;
      this.cabeceras[cabIndex].actualizadoEn = ahora;
    }

    // Registrar en Auditoría Inmutable
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'ASIGNACION_STOCK',
      entidad: 'Detalle_Repuestos',
      identificador: lineaId,
      valoresAnteriores: JSON.stringify({ cantAsignada: prevAsig }),
      valoresNuevos: JSON.stringify({ cantAsignada: nuevaAsig, contenedor: lote.contenedorId, pallet: lote.palletCaseNo }),
      operationId: operationId,
      notas: `Asignación de ${cantidadAsignar} u. desde pallet ${lote.palletCaseNo}`
    });

    this.persistirDatos();
    return { success: true, message: `Asignación exitosa de ${cantidadAsignar} u. en pallet ${lote.palletCaseNo}.` };
  }

  /**
   * Despacho Físico Irreversible hacia Sucursal
   */
  public async despacharLinea(
    lineaId: string,
    cantidadDespachar: number
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    // Control de Rol
    if (this.usuarioActivo.rol !== 'ADMINISTRADOR_CEDIS' && this.usuarioActivo.rol !== 'OPERADOR_CEDIS') {
      return { success: false, error: 'Permisos insuficientes. Solo CEDIS puede ejecutar despachos físicos.' };
    }

    const operationId = `OP-DESP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const detIndex = this.detalles.findIndex(d => d.lineaId === lineaId);
    if (detIndex === -1) return { success: false, error: 'Línea de pedido no encontrada.' };

    const linea = this.detalles[detIndex];
    if (cantidadDespachar > linea.cantidadAsignada) {
      return { success: false, error: `No se puede despachar más de lo asignado (${linea.cantidadAsignada} u.).` };
    }

    // 1. Si hay Web App URL configurada, invocar Apps Script con LockService
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'dispatchItem',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            lineaId: lineaId,
            cantidad: cantidadDespachar
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          return { success: false, error: resJson.error || 'Error al despachar en el servidor.' };
        }
      } catch (err) {
        console.warn('Fallo llamada remota dispatchItem, aplicando fallback canónico local:', err);
      }
    }

    const nuevaDesp = linea.cantidadDespachada + cantidadDespachar;
    const remAsig = linea.cantidadAsignada - cantidadDespachar;

    this.detalles[detIndex] = {
      ...linea,
      cantidadAsignada: remAsig,
      cantidadDespachada: nuevaDesp,
      estatusLinea: remAsig === 0 ? 'Despachado' : 'Asignado'
    };

    // Actualizar DPL_Detalle
    const invIndex = this.dplDetalle.findIndex(
      i => i.contenedorId === linea.contenedorAsignado && i.palletCaseNo === linea.palletAsignado && i.codigoRepuesto === linea.codigoRepuesto
    );
    if (invIndex !== -1) {
      const lote = this.dplDetalle[invIndex];
      const loteNuevaAsig = Math.max(0, lote.cantidadAsignada - cantidadDespachar);
      const loteNuevaDesp = lote.cantidadDespachada + cantidadDespachar;
      const loteNuevoSaldo = lote.cantidadTotal - loteNuevaAsig - loteNuevaDesp;

      this.dplDetalle[invIndex] = {
        ...lote,
        cantidadAsignada: loteNuevaAsig,
        cantidadDespachada: loteNuevaDesp,
        saldoDisponible: loteNuevoSaldo
      };
    }

    // Actualizar Cabecera
    const cabIndex = this.cabeceras.findIndex(c => c.pedidoId === linea.pedidoId);
    if (cabIndex !== -1) {
      this.cabeceras[cabIndex].estatusGeneral = 'Despachado Total';
      this.cabeceras[cabIndex].actualizadoPor = this.usuarioActivo.nombre;
      this.cabeceras[cabIndex].actualizadoEn = ahora;
    }

    // Registrar en Auditoría Inmutable
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'DESPACHO_FISICO',
      entidad: 'Detalle_Repuestos',
      identificador: lineaId,
      valoresAnteriores: JSON.stringify({ cantDespachada: linea.cantidadDespachada, cantAsignada: linea.cantidadAsignada }),
      valoresNuevos: JSON.stringify({ cantDespachada: nuevaDesp, cantAsignada: remAsig }),
      operationId: operationId,
      notas: `Despacho físico irreversible completado hacia sucursal. Responsable: ${this.usuarioActivo.nombre}`
    });

    this.persistirDatos();
    return { success: true, message: `Despacho de ${cantidadDespachar} u. registrado canónicamente en Kardex.` };
  }

  /**
   * Actualizar un Pedido y sus Repuestos
   */
  public async actualizarPedido(
    pedidoId: string,
    datosCabecera: Partial<SolicitudCabecera>,
    repuestos?: Array<{
      lineaId?: string;
      codigoRepuesto: string;
      codigoActualizado?: string;
      descripcionOficial: string;
      cantidadSolicitada: number;
      cantidadAsignada?: number;
      cantidadDespachada?: number;
      contenedorAsignado?: string;
      palletAsignado?: string;
      packageNo?: string;
      ubicacionCedis?: string;
      estatusLinea?: EstatusLineaRepuesto;
    }>
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    const cabIndex = this.cabeceras.findIndex(c => c.pedidoId === pedidoId);
    if (cabIndex === -1) {
      return { success: false, error: `Pedido ${pedidoId} no encontrado.` };
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const anterior = { ...this.cabeceras[cabIndex] };
    const operationId = `OP-UPD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, enviar mutación a Google Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'updatePedido',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidoId: pedidoId,
            datosCabecera: datosCabecera,
            repuestos: repuestos
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script updatePedido error:', resJson.error);
          return { success: false, error: resJson.error || 'Error al actualizar pedido en el backend.' };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script updatePedido, aplicando fallback local:', err);
      }
    }

    // Actualizar campos de cabecera
    this.cabeceras[cabIndex] = {
      ...this.cabeceras[cabIndex],
      ...datosCabecera,
      version: (this.cabeceras[cabIndex].version || 1) + 1,
      actualizadoPor: this.usuarioActivo.nombre,
      actualizadoEn: ahora
    };

    // Si se enviaron repuestos, actualizar los detalles
    if (repuestos && repuestos.length > 0) {
      // Remover detalles antiguos de este pedido
      this.detalles = this.detalles.filter(d => d.pedidoId !== pedidoId);

      // Agregar los actualizados
      repuestos.forEach((r, idx) => {
        this.detalles.push({
          lineaId: r.lineaId || `${pedidoId}-L${idx + 1}-${Date.now().toString(36).substring(4)}`,
          pedidoId: pedidoId,
          codigoRepuesto: (r.codigoRepuesto || '').trim().toUpperCase(),
          codigoActualizado: (r.codigoActualizado || r.codigoRepuesto || '').trim().toUpperCase(),
          descripcionOficial: r.descripcionOficial || 'Repuesto genuino Changan',
          cantidadSolicitada: Number(r.cantidadSolicitada) || 1,
          cantidadAsignada: Number(r.cantidadAsignada) || 0,
          cantidadDespachada: Number(r.cantidadDespachada) || 0,
          contenedorAsignado: r.contenedorAsignado || '',
          palletAsignado: r.palletAsignado || '',
          packageNo: r.packageNo || '',
          ubicacionCedis: r.ubicacionCedis || '',
          estatusLinea: (r.estatusLinea as any) || (Number(r.cantidadAsignada) > 0 ? 'Asignado' : 'Pendiente')
        });
      });
    }

    // Auditoría
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'MODIFICACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: pedidoId,
      valoresAnteriores: JSON.stringify(anterior),
      valoresNuevos: JSON.stringify(this.cabeceras[cabIndex]),
      operationId: operationId,
      notas: `Pedido ${pedidoId} modificado por ${this.usuarioActivo.nombre}`
    });

    this.persistirDatos();
    return { success: true, message: `Pedido ${pedidoId} actualizado exitosamente.` };
  }

  /**
   * Cambiar estatus rápido de un pedido (y alinear líneas)
   */
  public async cambiarEstatusPedido(
    pedidoId: string,
    nuevoEstatus: string,
    notaBitacora?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    const cabIndex = this.cabeceras.findIndex(c => c.pedidoId === pedidoId);
    if (cabIndex === -1) {
      return { success: false, error: `Pedido ${pedidoId} no encontrado.` };
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const operationId = `OP-STATUS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, invocar Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'changePedidoStatus',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidoId: pedidoId,
            nuevoEstatus: nuevoEstatus,
            notaBitacora: notaBitacora
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script changePedidoStatus error:', resJson.error);
          return { success: false, error: resJson.error || 'Error al cambiar estatus en el backend.' };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script changePedidoStatus, aplicando fallback local:', err);
      }
    }

    const estatusAnterior = this.cabeceras[cabIndex].estatusGeneral;
    this.cabeceras[cabIndex].estatusGeneral = nuevoEstatus as any;
    this.cabeceras[cabIndex].actualizadoPor = this.usuarioActivo.nombre;
    this.cabeceras[cabIndex].actualizadoEn = ahora;

    // Alinear estatus de líneas si corresponde
    if (nuevoEstatus.toUpperCase().includes('DESPACH')) {
      this.detalles.forEach((d, idx) => {
        if (d.pedidoId === pedidoId) {
          this.detalles[idx].estatusLinea = 'Despachado';
        }
      });
    }

    // Si hay nota, registrarla
    if (notaBitacora) {
      this.agregarNotaPedido(pedidoId, notaBitacora, 'Cambio de Estatus');
    }

    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'MODIFICACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: pedidoId,
      valoresAnteriores: JSON.stringify({ estatusGeneral: estatusAnterior }),
      valoresNuevos: JSON.stringify({ estatusGeneral: nuevoEstatus }),
      operationId: operationId,
      notas: `Cambio de estatus de ${estatusAnterior} a ${nuevoEstatus}`
    });

    this.persistirDatos();
    return { success: true, message: `Estatus de ${pedidoId} cambiado a ${nuevoEstatus}.` };
  }

  /**
   * Eliminar un Pedido individual
   */
  public async eliminarPedido(pedidoId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    const cabIndex = this.cabeceras.findIndex(c => c.pedidoId === pedidoId);
    if (cabIndex === -1) {
      return { success: false, error: `Pedido ${pedidoId} no encontrado.` };
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const cab = this.cabeceras[cabIndex];
    const operationId = `OP-DEL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, invocar Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deletePedido',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidoId: pedidoId
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script deletePedido error:', resJson.error);
          return { success: false, error: resJson.error || 'Error al eliminar pedido en el backend.' };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script deletePedido, aplicando fallback local:', err);
      }
    }

    // Liberar cualquier cantidad asignada de vuelta al DPL
    const detallesABorrar = this.detalles.filter(d => d.pedidoId === pedidoId);
    detallesABorrar.forEach(det => {
      if (det.cantidadAsignada > 0 && det.contenedorAsignado && det.palletAsignado) {
        const invIndex = this.dplDetalle.findIndex(
          i => i.contenedorId === det.contenedorAsignado && i.palletCaseNo === det.palletAsignado && i.codigoRepuesto === det.codigoRepuesto
        );
        if (invIndex !== -1) {
          const inv = this.dplDetalle[invIndex];
          const nuevaAsig = Math.max(0, inv.cantidadAsignada - det.cantidadAsignada);
          const nuevoSaldo = inv.cantidadTotal - nuevaAsig - inv.cantidadDespachada;
          this.dplDetalle[invIndex] = {
            ...inv,
            cantidadAsignada: nuevaAsig,
            saldoDisponible: nuevoSaldo
          };
        }
      }
    });

    // Eliminar cabecera y detalles
    this.cabeceras = this.cabeceras.filter(c => c.pedidoId !== pedidoId);
    this.detalles = this.detalles.filter(d => d.pedidoId !== pedidoId);

    // Auditoría
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'MODIFICACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: pedidoId,
      valoresAnteriores: JSON.stringify(cab),
      valoresNuevos: 'ELIMINADO',
      operationId: operationId,
      notas: `Pedido ${pedidoId} eliminado permanentemente por ${this.usuarioActivo.nombre}`
    });

    this.persistirDatos();
    return { success: true, message: `Pedido ${pedidoId} eliminado con éxito.` };
  }

  /**
   * Eliminar Masivamente Pedidos Seleccionados
   */
  public async eliminarPedidosMasivo(pedidoIds: string[]): Promise<{ success: boolean; totalEliminados: number; error?: string; message?: string }> {
    if (!pedidoIds || pedidoIds.length === 0) {
      return { success: false, totalEliminados: 0, error: 'No se indicaron pedidos para eliminar.' };
    }

    const setIds = new Set(pedidoIds);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const operationId = `OP-DEL-MASIVO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, invocar Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulkDeletePedidos',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidoIds: pedidoIds
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script bulkDeletePedidos error:', resJson.error);
          return { success: false, totalEliminados: 0, error: resJson.error || 'Error al eliminar pedidos en el backend.' };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script bulkDeletePedidos, aplicando fallback local:', err);
      }
    }

    let eliminados = 0;

    // Liberar asignaciones de todos
    this.detalles.forEach(det => {
      if (setIds.has(det.pedidoId) && det.cantidadAsignada > 0 && det.contenedorAsignado && det.palletAsignado) {
        const invIndex = this.dplDetalle.findIndex(
          i => i.contenedorId === det.contenedorAsignado && i.palletCaseNo === det.palletAsignado && i.codigoRepuesto === det.codigoRepuesto
        );
        if (invIndex !== -1) {
          const inv = this.dplDetalle[invIndex];
          const nuevaAsig = Math.max(0, inv.cantidadAsignada - det.cantidadAsignada);
          const nuevoSaldo = inv.cantidadTotal - nuevaAsig - inv.cantidadDespachada;
          this.dplDetalle[invIndex] = {
            ...inv,
            cantidadAsignada: nuevaAsig,
            saldoDisponible: nuevoSaldo
          };
        }
      }
    });

    const totalAntes = this.cabeceras.length;
    this.cabeceras = this.cabeceras.filter(c => !setIds.has(c.pedidoId));
    eliminados = totalAntes - this.cabeceras.length;
    this.detalles = this.detalles.filter(d => !setIds.has(d.pedidoId));

    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'MODIFICACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: `LOTE-${eliminados}-PEDIDOS`,
      valoresAnteriores: JSON.stringify(pedidoIds),
      valoresNuevos: 'ELIMINADOS_MASIVO',
      operationId: operationId,
      notas: `Eliminación masiva de ${eliminados} pedidos.`
    });

    this.persistirDatos();
    return { success: true, totalEliminados: eliminados, message: `Se eliminaron ${eliminados} pedidos correctamente.` };
  }

  /**
   * Actualizar Masivamente Pedidos Seleccionados
   */
  public async actualizarPedidosMasivo(
    pedidoIds: string[],
    cambios: {
      estatusGeneral?: string;
      sucursal?: string;
      tipoPedido?: string;
      estadoPago?: string;
      colaborador?: string;
      canal?: string;
    }
  ): Promise<{ success: boolean; totalActualizados: number; error?: string; message?: string }> {
    if (!pedidoIds || pedidoIds.length === 0) {
      return { success: false, totalActualizados: 0, error: 'No se seleccionaron pedidos para actualizar.' };
    }

    const setIds = new Set(pedidoIds);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const operationId = `OP-EDIT-MASIVO-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. Si hay Web App URL configurada, invocar Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulkUpdatePedidos',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidoIds: pedidoIds,
            cambios: cambios
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          console.warn('Apps Script bulkUpdatePedidos error:', resJson.error);
          return { success: false, totalActualizados: 0, error: resJson.error || 'Error al actualizar pedidos en el backend.' };
        }
      } catch (err) {
        console.warn('Fallo llamada a Apps Script bulkUpdatePedidos, aplicando fallback local:', err);
      }
    }

    let count = 0;

    this.cabeceras.forEach((c, idx) => {
      if (setIds.has(c.pedidoId)) {
        count++;
        if (cambios.estatusGeneral && cambios.estatusGeneral !== 'SIN_CAMBIO') {
          this.cabeceras[idx].estatusGeneral = cambios.estatusGeneral as any;
        }
        if (cambios.sucursal && cambios.sucursal !== 'SIN_CAMBIO') {
          this.cabeceras[idx].sucursal = cambios.sucursal;
        }
        if (cambios.tipoPedido && cambios.tipoPedido !== 'SIN_CAMBIO') {
          this.cabeceras[idx].tipoPedido = cambios.tipoPedido as any;
        }
        if (cambios.estadoPago && cambios.estadoPago !== 'SIN_CAMBIO') {
          this.cabeceras[idx].estadoPago = cambios.estadoPago as any;
        }
        if (cambios.colaborador && cambios.colaborador !== 'SIN_CAMBIO') {
          this.cabeceras[idx].colaborador = cambios.colaborador;
        }
        if (cambios.canal && cambios.canal !== 'SIN_CAMBIO') {
          this.cabeceras[idx].canal = cambios.canal;
        }
        this.cabeceras[idx].actualizadoPor = this.usuarioActivo.nombre;
        this.cabeceras[idx].actualizadoEn = ahora;
      }
    });

    // Si cambió estatus general a Despachado, alinear líneas
    if (cambios.estatusGeneral && cambios.estatusGeneral.toUpperCase().includes('DESPACH')) {
      this.detalles.forEach((d, idx) => {
        if (setIds.has(d.pedidoId)) {
          this.detalles[idx].estatusLinea = 'Despachado';
        }
      });
    }

    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'MODIFICACION_PEDIDO',
      entidad: 'Solicitudes_Cabecera',
      identificador: `LOTE-${count}-PEDIDOS`,
      valoresAnteriores: '',
      valoresNuevos: JSON.stringify(cambios),
      operationId: operationId,
      notas: `Edición masiva de ${count} pedidos aplicada.`
    });

    this.persistirDatos();
    return { success: true, totalActualizados: count, message: `${count} pedidos actualizados correctamente.` };
  }

  /**
   * Bitácora de Observaciones por Pedido
   */
  public getNotasPedido(pedidoId: string): BitacoraNota[] {
    try {
      const raw = this.safeGet(`changan_bitacora_${pedidoId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Error leyendo bitácora:', e);
    }
    return [];
  }

  public agregarNotaPedido(
    pedidoId: string,
    texto: string,
    categoria: string = 'Nota General'
  ): BitacoraNota {
    const notas = this.getNotasPedido(pedidoId);
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const nuevaNota: BitacoraNota = {
      id: `NOTA-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pedidoId,
      autor: this.usuarioActivo.nombre,
      sucursal: this.usuarioActivo.sucursal,
      fecha: ahora,
      categoria,
      texto
    };

    notas.unshift(nuevaNota);
    this.safeSet(`changan_bitacora_${pedidoId}`, JSON.stringify(notas));

    // Si hay Web App URL configurada, enviar en background a Google Apps Script
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      const operationId = `OP-NOTA-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      fetch(this.config.webAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addPedidoNota',
          userEmail: this.usuarioActivo.correo,
          operationId: operationId,
          nota: nuevaNota
        })
      }).catch(err => {
        console.warn('Fallo llamada a Apps Script addPedidoNota:', err);
      });
    }

    return nuevaNota;
  }

  /**
   * Consulta remota de bitácora de observaciones desde Google Sheets
   */
  public async fetchNotasPedido(pedidoId: string): Promise<BitacoraNota[]> {
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const url = `${this.config.webAppUrl}?action=getNotasPedido&pedidoId=${encodeURIComponent(pedidoId)}`;
        const resp = await fetch(url);
        const resJson = await resp.json();
        if (resJson.success && Array.isArray(resJson.notas)) {
          this.safeSet(`changan_bitacora_${pedidoId}`, JSON.stringify(resJson.notas));
          return resJson.notas;
        }
      } catch (err) {
        console.warn('Fallo cargando notas remotas de pedido:', err);
      }
    }
    return this.getNotasPedido(pedidoId);
  }

  /**
   * Ajuste de Merma / Daño
   */
  public async ajustarMerma(
    inventarioId: string,
    cantidad: number,
    motivo: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    if (this.usuarioActivo.rol !== 'ADMINISTRADOR_CEDIS' && this.usuarioActivo.rol !== 'OPERADOR_CEDIS') {
      return { success: false, error: 'Permisos insuficientes para ajustes de inventario.' };
    }

    const invIndex = this.dplDetalle.findIndex(i => i.inventarioId === inventarioId);
    if (invIndex === -1) return { success: false, error: 'Lote de inventario no encontrado.' };

    const lote = this.dplDetalle[invIndex];
    const disponible = lote.cantidadTotal - lote.cantidadAsignada - lote.cantidadDespachada;

    if (disponible < cantidad) {
      return { success: false, error: `No se puede mermar más del saldo disponible (${disponible} u.).` };
    }

    const operationId = `OP-MERMA-${Date.now()}`;
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 1. Si hay Web App URL configurada, invocar Apps Script con LockService
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'adjustMerma',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            inventarioId: inventarioId,
            cantidad: cantidad,
            motivo: motivo
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          return { success: false, error: resJson.error || 'Error al procesar merma en el servidor.' };
        }
      } catch (err) {
        console.warn('Fallo llamada remota adjustMerma, aplicando fallback local:', err);
      }
    }

    const nuevoTotal = lote.cantidadTotal - cantidad;
    const nuevoSaldo = nuevoTotal - lote.cantidadAsignada - lote.cantidadDespachada;

    this.dplDetalle[invIndex] = {
      ...lote,
      cantidadTotal: nuevoTotal,
      saldoDisponible: nuevoSaldo
    };

    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'AJUSTE_MERMA',
      entidad: 'DPL_Detalle',
      identificador: inventarioId,
      valoresAnteriores: JSON.stringify({ cantidadTotal: lote.cantidadTotal, saldoDisponible: disponible }),
      valoresNuevos: JSON.stringify({ cantidadTotal: nuevoTotal, saldoDisponible: nuevoSaldo }),
      operationId: operationId,
      notas: motivo || 'Ajuste de merma en bahía CEDIS'
    });

    this.persistirDatos();
    return { success: true, message: `Ajuste de ${cantidad} u. aplicado. Nuevo saldo: ${nuevoSaldo} u.` };
  }

  /**
   * Alias de compatibilidad para ajuste de merma
   */
  public async registrarAjusteMerma(
    inventarioId: string,
    cantidad: number,
    motivo: string
  ): Promise<{ success: boolean; error?: string; message?: string }> {
    return this.ajustarMerma(inventarioId, cantidad, motivo);
  }

  /**
   * Aprobación Idempotente de Registros Conciliados de Staging hacia Producción
   */
  public async confirmarImportacionStaging(
    registrosAprobados: RegistroStaging[],
    operationId: string
  ): Promise<{ success: boolean; pedidosAgregados: number; lineasAgregadas: number; error?: string }> {
    // Control de Rol
    if (this.usuarioActivo.rol !== 'ADMINISTRADOR_CEDIS') {
      return { success: false, pedidosAgregados: 0, lineasAgregadas: 0, error: 'Solo el Administrador CEDIS puede aprobar la conciliación de staging hacia producción.' };
    }

    // 1. Verificación de Idempotencia: ¿Ya se procesó este operationId?
    if (this.auditoria.some(a => a.operationId === operationId)) {
      return {
        success: true,
        pedidosAgregados: 0,
        lineasAgregadas: 0,
        error: 'Operación previamente procesada (Idempotencia garantizada).'
      };
    }

    // 2. Si hay Web App URL configurada, invocar Apps Script con LockService
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'commitImport',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            registros: registrosAprobados
          })
        });
        const resJson = await resp.json();
        if (!resJson.success) {
          return { success: false, pedidosAgregados: 0, lineasAgregadas: 0, error: resJson.error || 'Error al procesar commitImport en el servidor.' };
        }
      } catch (err) {
        console.warn('Fallo llamada remota commitImport, aplicando fallback canónico local:', err);
      }
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const existingPedidos = new Set(this.cabeceras.map(c => c.pedidoId));
    const existingLineas = new Set(this.detalles.map(d => d.lineaId));

    let pedidosAgregados = 0;
    let lineasAgregadas = 0;

    // Agrupar por pedidoId
    const agrupados = new Map<string, RegistroStaging[]>();
    registrosAprobados.forEach(r => {
      const arr = agrupados.get(r.pedidoId) || [];
      arr.push(r);
      agrupados.set(r.pedidoId, arr);
    });

    agrupados.forEach((lineas, pId) => {
      const prim = lineas[0];

      // Insertar Cabecera si es nueva
      if (!existingPedidos.has(pId)) {
        this.cabeceras.push({
          pedidoId: pId,
          fechaCreacion: prim.fechaRegistro || ahora,
          sucursal: prim.sucursal || 'Desconocida',
          colaborador: prim.colaborador || 'Importación Staging',
          canal: 'Conciliación',
          tipoPedido: (prim.tipoPedido as any) || 'Stock Regular',
          cotizacion: prim.cotizacion || '',
          cliente: prim.cliente || '',
          placa: prim.placa || '',
          modeloChangan: prim.modelo || '',
          vin: prim.vin || '',
          numeroOR: prim.numeroOR || '',
          estadoPago: 'Aprobado',
          documentoPagoFactura: '',
          facturadoFinal: 'No',
          estatusGeneral: 'Pendiente',
          estatusFabrica: 'En Proceso CEDIS',
          origen: 'STAGING_MIGRACION',
          version: 1,
          creadoPor: this.usuarioActivo.nombre,
          creadoEn: ahora,
          actualizadoPor: this.usuarioActivo.nombre,
          actualizadoEn: ahora,
          observaciones: `Importado tras resolución de conciliación (Lote ${operationId})`
        });
        existingPedidos.add(pId);
        pedidosAgregados++;
      }

      // Insertar Líneas de Detalle
      lineas.forEach((lin, idx) => {
        const lineaId = `${pId}-L${idx + 1}`;
        if (!existingLineas.has(lineaId)) {
          this.detalles.push({
            lineaId: lineaId,
            pedidoId: pId,
            codigoRepuesto: lin.codigoRepuesto,
            codigoActualizado: lin.codigoRepuesto,
            descripcionOficial: lin.descripcion || '',
            cantidadSolicitada: lin.cantidadSolicitada || 1,
            cantidadAsignada: lin.cantidadAsignada || 0,
            cantidadDespachada: 0,
            contenedorAsignado: lin.contenedor || '',
            palletAsignado: '',
            packageNo: '',
            ubicacionCedis: lin.ubicacion || '',
            estatusLinea: lin.cantidadAsignada > 0 ? 'Asignado' : 'Pendiente'
          });
          existingLineas.add(lineaId);
          lineasAgregadas++;
        }
      });
    });

    // Registrar en Auditoría Inmutable
    this.auditoria.unshift({
      auditoriaId: `AUD-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'IMPORTACION_CONCILIACION',
      entidad: 'Sistema',
      identificador: operationId,
      valoresAnteriores: '{}',
      valoresNuevos: JSON.stringify({ pedidosAgregados, lineasAgregadas, totalRegistros: registrosAprobados.length }),
      operationId: operationId,
      notas: `Aprobación de migración staging ejecutada por ${this.usuarioActivo.nombre}`
    });

    this.persistirDatos();

    return {
      success: true,
      pedidosAgregados,
      lineasAgregadas
    };
  }

  /**
   * Valida si un cliente ya tiene una orden activa para un repuesto específico
   */
  public verificarDuplicadoActivo(
    cliente: string,
    vin: string,
    numeroOR: string,
    codigoOEM: string
  ): { pedidoId: string; cliente: string; vin: string; repuesto: string } | null {
    const cNorm = (cliente || '').trim().toLowerCase();
    const vNorm = (vin || '').trim().toUpperCase();
    const orNorm = (numeroOR || '').trim().toLowerCase();
    const codNorm = (codigoOEM || '').trim().toUpperCase();

    const cabMap = new Map<string, SolicitudCabecera>();
    this.cabeceras.forEach(c => cabMap.set(c.pedidoId, c));

    for (const det of this.detalles) {
      const cab = cabMap.get(det.pedidoId);
      if (!cab) continue;
      if (det.estatusLinea === 'Despachado' || cab.estatusGeneral === 'Despachado Total' || cab.estatusGeneral === 'Cancelado') {
        continue;
      }

      if ((det.codigoRepuesto || '').trim().toUpperCase() === codNorm) {
        const matchVin = vNorm.length >= 8 && (cab.vin || '').trim().toUpperCase() === vNorm;
        const matchCliente = cNorm.length >= 4 && ((cab.cliente || '').toLowerCase().includes(cNorm) || cNorm.includes((cab.cliente || '').toLowerCase()));
        const matchOR = orNorm.length >= 3 && (cab.numeroOR || cab.cotizacion || '').toLowerCase() === orNorm;

        if (matchVin || matchCliente || matchOR) {
          return {
            pedidoId: cab.pedidoId,
            cliente: cab.cliente,
            vin: cab.vin,
            repuesto: `${det.codigoRepuesto} - ${det.descripcionOficial}`
          };
        }
      }
    }
    return null;
  }

  /**
   * Motor Oficial de Conciliación y Matching FIFO Automático con Pallets y Contenedores DPL.
   * Reconoce de forma automática:
   * - En qué contenedor y en qué pallet viene cada repuesto.
   * - El packageNo y la ubicación física en CEDIS.
   * - Las cantidades asignadas y el saldo pendiente.
   * - Asocia todo al cliente, VIN y No. O.R.
   */
  public ejecutarMatchingGlobal(): {
    success: boolean;
    totalLineas: number;
    asignadasTotales: number;
    asignadasParciales: number;
    sinStock: number;
    piezasAsignadas: number;
    coincidencias: number;
    palletsInvolucrados: string[];
    contenedoresInvolucrados: string[];
    detalles: Array<{
      pedidoId: string;
      lineaId: string;
      codigoRepuesto: string;
      cliente: string;
      cantidadSolicitada: number;
      cantidadAsignada: number;
      contenedorAsignado: string;
      palletAsignado: string;
      packageNo: string;
      ubicacionCedis: string;
      estatusLinea: string;
    }>;
    mensaje: string;
  } {
    const jerarquiaPrioridades: Record<string, number> = {
      'VOR / Unidad Parada': 1,
      'VOR': 1,
      'Urgente': 1,
      'Garantía': 2,
      'Garantia': 2,
      'Chapistería y Colisión': 3,
      'Chapisteria y Colision': 3,
      'Colisión': 3,
      'Taller Mecánico': 4,
      'Taller Mecanico': 4,
      'Taller': 4,
      'Stock Regular': 5,
      'Stock': 5
    };

    // 1. Resetear stock comprometido temporal en lotes de inventario DPL (respetando despachos irreversibles)
    this.dplDetalle.forEach(lote => {
      lote.cantidadAsignada = 0;
      const desp = Number(lote.cantidadDespachada) || 0;
      const tot = Number(lote.cantidadTotal) || 0;
      lote.saldoDisponible = Math.max(0, tot - desp);
    });

    const cabMap = new Map<string, SolicitudCabecera>();
    this.cabeceras.forEach(c => cabMap.set(c.pedidoId, c));

    // 2. Extraer líneas pendientes que no hayan sido despachadas en su totalidad
    const lineasEvaluables = this.detalles.map(d => {
      const cab = cabMap.get(d.pedidoId);
      const prioridadStr = cab ? cab.tipoPedido : 'Stock Regular';
      const peso = jerarquiaPrioridades[prioridadStr] || 5;
      const fechaNum = cab && cab.fechaCreacion ? new Date(cab.fechaCreacion).getTime() : 0;
      return {
        detalle: d,
        cabecera: cab,
        peso,
        fechaNum
      };
    }).sort((a, b) => {
      // Prioridad 1° (VOR > Garantía > Chapistería > Taller > Stock)
      if (a.peso !== b.peso) return a.peso - b.peso;
      // FIFO por fecha 2°
      if (a.fechaNum !== b.fechaNum) return a.fechaNum - b.fechaNum;
      return a.detalle.lineaId.localeCompare(b.detalle.lineaId);
    });

    let totalPiezasAsignadas = 0;
    let coincidencias = 0;
    let asignadasTotales = 0;
    let asignadasParciales = 0;
    let sinStock = 0;
    const palletsSet = new Set<string>();
    const contenedoresSet = new Set<string>();
    const resultadoLineas: Array<{
      pedidoId: string;
      lineaId: string;
      codigoRepuesto: string;
      cliente: string;
      cantidadSolicitada: number;
      cantidadAsignada: number;
      contenedorAsignado: string;
      palletAsignado: string;
      packageNo: string;
      ubicacionCedis: string;
      estatusLinea: string;
    }> = [];

    // 3. Ejecutar algoritmo de matching voraz / FIFO
    for (const item of lineasEvaluables) {
      const d = item.detalle;
      const cab = item.cabecera;
      const cantSol = Number(d.cantidadSolicitada) || 1;
      const cantDesp = Number(d.cantidadDespachada) || 0;

      // Si ya está despachada totalmente, mantener asignación de origen
      if (cantDesp >= cantSol) {
        resultadoLineas.push({
          pedidoId: d.pedidoId,
          lineaId: d.lineaId,
          codigoRepuesto: d.codigoRepuesto,
          cliente: cab?.cliente || '',
          cantidadSolicitada: cantSol,
          cantidadAsignada: 0,
          contenedorAsignado: d.contenedorAsignado,
          palletAsignado: d.palletAsignado,
          packageNo: d.packageNo,
          ubicacionCedis: d.ubicacionCedis,
          estatusLinea: 'Despachado'
        });
        continue;
      }

      let faltante = cantSol - cantDesp;
      let asignadoLinea = 0;
      let loteAsignadoPrincipal: DPLDetalle | null = null;
      const codTarget = (d.codigoRepuesto || '').trim().toUpperCase();

      for (const lote of this.dplDetalle) {
        // REGLA CRÍTICA DPL: Solamente los contenedores en estatus RECIBIDO asignan repuestos.
        // Los contenedores en EN TRÁNSITO o ADUANA quedan registrados para rastreo, pero NO asignan piezas.
        const cont = this.manifiestos.find(m => m.contenedorId.trim().toLowerCase() === (lote.contenedorId || '').trim().toLowerCase());
        const estadoNorm = cont ? normalizarEstatusDPL(cont.estado) : 'EN TRÁNSITO';
        if (estadoNorm !== 'RECIBIDO') {
          continue; // No asignar repuestos de contenedores en tránsito o aduana
        }

        const codLote = (lote.codigoRepuesto || '').trim().toUpperCase();
        if (codLote === codTarget && lote.saldoDisponible > 0) {
          const asignar = Math.min(faltante, lote.saldoDisponible);
          lote.cantidadAsignada += asignar;
          lote.saldoDisponible -= asignar;

          asignadoLinea += asignar;
          faltante -= asignar;
          totalPiezasAsignadas += asignar;

          if (!loteAsignadoPrincipal) {
            loteAsignadoPrincipal = lote;
          }

          palletsSet.add(lote.palletCaseNo);
          contenedoresSet.add(lote.contenedorId);
          coincidencias++;

          if (faltante <= 0) break;
        }
      }

      d.cantidadAsignada = asignadoLinea;

      if (loteAsignadoPrincipal && asignadoLinea > 0) {
        d.contenedorAsignado = loteAsignadoPrincipal.contenedorId;
        d.palletAsignado = loteAsignadoPrincipal.palletCaseNo;
        d.packageNo = loteAsignadoPrincipal.packageNo || 'PKG-01';
        d.ubicacionCedis = loteAsignadoPrincipal.ubicacionCedis;

        if (asignadoLinea >= (cantSol - cantDesp)) {
          d.estatusLinea = 'Asignado';
          asignadasTotales++;
        } else {
          d.estatusLinea = 'Asignado Parcial' as any;
          asignadasParciales++;
        }
      } else {
        d.contenedorAsignado = '';
        d.palletAsignado = '';
        d.packageNo = '';
        d.ubicacionCedis = 'Sin Stock en CEDIS • Requiere Fábrica';
        d.estatusLinea = 'Sin Stock';
        sinStock++;
      }

      resultadoLineas.push({
        pedidoId: d.pedidoId,
        lineaId: d.lineaId,
        codigoRepuesto: d.codigoRepuesto,
        cliente: cab?.cliente || 'Consumidor Final',
        cantidadSolicitada: cantSol,
        cantidadAsignada: d.cantidadAsignada,
        contenedorAsignado: d.contenedorAsignado,
        palletAsignado: d.palletAsignado,
        packageNo: d.packageNo,
        ubicacionCedis: d.ubicacionCedis,
        estatusLinea: d.estatusLinea
      });
    }

    // 4. Actualizar Estatus General en Cabeceras
    this.cabeceras.forEach(cab => {
      const lineasCab = this.detalles.filter(x => x.pedidoId === cab.pedidoId);
      if (lineasCab.length === 0) return;

      const todasDespachadas = lineasCab.every(l => l.estatusLinea === 'Despachado');
      const todasAsignadas = lineasCab.every(l => l.estatusLinea === 'Asignado' || l.estatusLinea === 'Despachado');
      const algunaAsignada = lineasCab.some(l => l.cantidadAsignada > 0 || l.cantidadDespachada > 0);

      if (todasDespachadas) {
        cab.estatusGeneral = 'Despachado Total';
      } else if (todasAsignadas) {
        cab.estatusGeneral = 'Asignado Total';
      } else if (algunaAsignada) {
        cab.estatusGeneral = 'Asignado Parcial';
      } else {
        cab.estatusGeneral = 'Pendiente';
      }
    });

    // 5. Registrar en Auditoría
    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    this.auditoria.unshift({
      auditoriaId: `AUD-MATCH-${Date.now()}`,
      timestamp: ahora,
      usuarioId: this.usuarioActivo.usuarioId,
      usuarioNombre: this.usuarioActivo.nombre,
      accion: 'ASIGNACION_STOCK',
      entidad: 'Detalle_Repuestos',
      identificador: 'GLOBAL',
      valoresAnteriores: '{}',
      valoresNuevos: JSON.stringify({
        totalLineas: this.detalles.length,
        piezasAsignadas: totalPiezasAsignadas,
        asignadasTotales,
        asignadasParciales,
        sinStock
      }),
      operationId: `OP-MATCH-${Date.now()}`,
      notas: `Matching automático FIFO ejecutado: ${totalPiezasAsignadas} piezas asignadas en pallets y contenedores de CEDIS.`
    });

    this.persistirDatos();

    return {
      success: true,
      totalLineas: this.detalles.length,
      asignadasTotales,
      asignadasParciales,
      sinStock,
      piezasAsignadas: totalPiezasAsignadas,
      coincidencias,
      palletsInvolucrados: Array.from(palletsSet),
      contenedoresInvolucrados: Array.from(contenedoresSet),
      detalles: resultadoLineas,
      mensaje: `Matching completado: ${totalPiezasAsignadas} repuestos reconocidos y asignados automáticamente en ${palletsSet.size} pallets (${Array.from(contenedoresSet).join(', ') || 'CEDIS Central'}).`
    };
  }

  /**
   * Importación Masiva de Pedidos a Matriz Central con Matching y Sincronización a Google Sheets
   */
  public async importarPedidosMasivos(
    pedidosRaw: Array<{
      pedidoId?: string;
      lineaId?: string;
      prioridad?: string;
      fecha?: string;
      sucursal?: string;
      asesor?: string;
      cliente?: string;
      placa?: string;
      modelo?: string;
      vin?: string;
      numeroOR?: string;
      cotizacion?: string;
      codigoRepuesto: string;
      codigoActualizado?: string;
      descripcion?: string;
      cantidadSolicitada: number;
      cantidadAsignada?: number;
      cantidadDespachada?: number;
      contenedorAsignado?: string;
      palletAsignado?: string;
      packageNo?: string;
      ubicacionCedis?: string;
      estatusLinea?: string;
      observaciones?: string;
    }>,
    opciones: {
      ejecutarMatching?: boolean;
      sincronizarGoogleSheets?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    pedidosCreados: number;
    lineasCreadas: number;
    duplicadosOmitidos: number;
    reporteMatching?: any;
    syncSheets?: { ok: boolean; mensaje: string };
    error?: string;
  }> {
    if (!pedidosRaw || pedidosRaw.length === 0) {
      return { success: false, pedidosCreados: 0, lineasCreadas: 0, duplicadosOmitidos: 0, error: 'No se recibieron pedidos para importar.' };
    }

    const ahora = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const prefijos: Record<string, string> = {
      'Costa Verde': 'CV',
      'Villa Lucre': 'VL',
      'Calle 50': 'C50',
      'Tumba Muerto': 'TM',
      'Chiriquí': 'CH',
      'Santa María': 'SM',
      'Bodega Central': 'CED'
    };

    let consecutivoBase = 2200 + this.cabeceras.length + 1;
    const pedidosMap = new Map<string, { 
      cabecera: SolicitudCabecera; 
      items: Array<{ 
        lineaId?: string;
        codigo: string; 
        codigoActualizado?: string;
        descripcion: string; 
        cantidad: number;
        cantidadAsignada?: number;
        cantidadDespachada?: number;
        contenedorAsignado?: string;
        palletAsignado?: string;
        packageNo?: string;
        ubicacionCedis?: string;
        estatusLinea?: string;
      }> 
    }>();
    let duplicadosOmitidos = 0;

    for (const raw of pedidosRaw) {
      const codRep = (raw.codigoRepuesto || '').trim().toUpperCase();
      if (!codRep) continue;

      const cliente = (raw.cliente || 'Consumidor Final').trim();
      const vin = (raw.vin || '').trim().toUpperCase();
      const numOR = (raw.numeroOR || '').trim();

      // Chequeo de duplicados activos si aplica
      const dup = this.verificarDuplicadoActivo(cliente, vin, numOR, codRep);
      if (dup) {
        duplicadosOmitidos++;
        // Continuamos con el siguiente para evitar duplicar pedidos activos
        continue;
      }

      const sucursal = (raw.sucursal || 'Villa Lucre').trim();
      const pref = prefijos[sucursal] || 'SUC';

      // Agrupar por pedidoId si viene especificado, o por cliente + VIN + OR
      const claveAgrupacion = raw.pedidoId ? raw.pedidoId.trim() : `${cliente}__${vin}__${numOR}`;
      
      if (!pedidosMap.has(claveAgrupacion)) {
        const nuevoId = raw.pedidoId ? raw.pedidoId.trim() : `PED-${pref}-${consecutivoBase++}`;
        const tipoPed = (raw.prioridad as any) || 'Stock Regular';

        pedidosMap.set(claveAgrupacion, {
          cabecera: {
            pedidoId: nuevoId,
            fechaCreacion: raw.fecha ? raw.fecha.substring(0, 19) : ahora,
            sucursal,
            colaborador: raw.asesor || this.usuarioActivo.nombre,
            canal: 'Carga Masiva',
            tipoPedido: tipoPed,
            cotizacion: raw.cotizacion || numOR,
            cliente,
            placa: raw.placa || '',
            modeloChangan: raw.modelo || 'General Changan',
            vin,
            numeroOR: numOR,
            estadoPago: 'Aprobado',
            documentoPagoFactura: '',
            facturadoFinal: 'No',
            estatusGeneral: 'Pendiente',
            estatusFabrica: 'En Proceso CEDIS',
            origen: 'EXCEL',
            version: 1,
            creadoPor: this.usuarioActivo.nombre,
            creadoEn: ahora,
            actualizadoPor: this.usuarioActivo.nombre,
            actualizadoEn: ahora,
            observaciones: raw.observaciones || 'Importado masivamente vía Excel/CSV'
          },
          items: []
        });
      }

      const grupo = pedidosMap.get(claveAgrupacion)!;
      grupo.items.push({
        lineaId: raw.lineaId,
        codigo: codRep,
        codigoActualizado: raw.codigoActualizado || codRep,
        descripcion: (raw.descripcion || 'Repuesto Genuino Changan').trim(),
        cantidad: Math.max(1, Number(raw.cantidadSolicitada) || 1),
        cantidadAsignada: raw.cantidadAsignada,
        cantidadDespachada: raw.cantidadDespachada,
        contenedorAsignado: raw.contenedorAsignado,
        palletAsignado: raw.palletAsignado,
        packageNo: raw.packageNo,
        ubicacionCedis: raw.ubicacionCedis,
        estatusLinea: raw.estatusLinea
      });
    }

    if (pedidosMap.size === 0) {
      return {
        success: false,
        pedidosCreados: 0,
        lineasCreadas: 0,
        duplicadosOmitidos,
        error: duplicadosOmitidos > 0
          ? `Todos los registros (${duplicadosOmitidos}) fueron omitidos porque ya tienen pedidos activos en seguimiento.`
          : 'No se encontraron registros válidos de repuestos con código OEM.'
      };
    }

    const nuevasCabeceras: SolicitudCabecera[] = [];
    const nuevosDetalles: DetalleRepuesto[] = [];

    pedidosMap.forEach(grupo => {
      nuevasCabeceras.push(grupo.cabecera);
      grupo.items.forEach((it, idx) => {
        const cantAsig = Number(it.cantidadAsignada) || 0;
        const cantDesp = Number(it.cantidadDespachada) || 0;
        let estatusL: any = it.estatusLinea || 'Pendiente';
        if (!it.estatusLinea) {
          if (cantDesp >= it.cantidad) estatusL = 'Despachado';
          else if (cantAsig > 0) estatusL = 'Asignado';
        }

        nuevosDetalles.push({
          lineaId: it.lineaId || `${grupo.cabecera.pedidoId}-L${idx + 1}`,
          pedidoId: grupo.cabecera.pedidoId,
          codigoRepuesto: it.codigo,
          codigoActualizado: it.codigoActualizado || it.codigo,
          descripcionOficial: it.descripcion,
          cantidadSolicitada: it.cantidad,
          cantidadAsignada: cantAsig,
          cantidadDespachada: cantDesp,
          contenedorAsignado: it.contenedorAsignado || '',
          palletAsignado: it.palletAsignado || '',
          packageNo: it.packageNo || '',
          ubicacionCedis: it.ubicacionCedis || '',
          estatusLinea: estatusL
        });
      });
    });

    this.cabeceras.unshift(...nuevasCabeceras);
    this.detalles.unshift(...nuevosDetalles);

    // 2. Ejecutar matching automático FIFO si está habilitado
    let reporteMatching: any = null;
    if (opciones.ejecutarMatching !== false) {
      reporteMatching = this.ejecutarMatchingGlobal();
    }

    // 3. Sincronizar con Google Sheets (Solicitudes_Cabecera y Detalle_Repuestos)
    if (this.config.webAppUrl && !this.config.modoOfflineSimulado) {
      const operationId = `OP-BULK-IMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      try {
        const payloadPedidos = Array.from(pedidosMap.values()).map(g => ({
          cabecera: g.cabecera,
          items: g.items.map(it => ({
            lineaId: it.lineaId,
            codigoRepuesto: it.codigo,
            codigoActualizado: it.codigoActualizado,
            descripcionOficial: it.descripcion,
            cantidadSolicitada: it.cantidad,
            cantidadAsignada: it.cantidadAsignada,
            cantidadDespachada: it.cantidadDespachada,
            contenedorAsignado: it.contenedorAsignado,
            palletAsignado: it.palletAsignado,
            packageNo: it.packageNo,
            ubicacionCedis: it.ubicacionCedis,
            estatusLinea: it.estatusLinea
          }))
        }));

        await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulkImportPedidos',
            userEmail: this.usuarioActivo.correo,
            operationId: operationId,
            pedidos: payloadPedidos
          })
        });
      } catch (err) {
        console.warn('Fallo llamada a Apps Script bulkImportPedidos, aplicando fallback local:', err);
      }
    }

    // 4. Sincronizar Matriz Central completa si fue solicitado explícitamente
    let syncSheetsResult: { ok: boolean; mensaje: string } | undefined;
    if (opciones.sincronizarGoogleSheets) {
      syncSheetsResult = await this.sincronizarMatrizConGoogleSheets();
    }

    this.persistirDatos();

    return {
      success: true,
      pedidosCreados: nuevasCabeceras.length,
      lineasCreadas: nuevosDetalles.length,
      duplicadosOmitidos,
      reporteMatching,
      syncSheets: syncSheetsResult
    };
  }

  /**
   * Sincroniza la Matriz Central completa o incremental hacia Google Sheets (Pestaña Matriz_Central)
   */
  public async sincronizarMatrizConGoogleSheets(): Promise<{ ok: boolean; mensaje: string }> {
    const filas = this.getMatrizCentral();
    if (filas.length === 0) {
      return { ok: true, mensaje: 'No hay filas en Matriz Central para sincronizar.' };
    }

    // 18 Columnas Canónicas de Matriz_Central
    const filasArray = filas.map(f => [
      f.pedidoId,
      f.tipoPedido,
      f.fechaCreacion,
      f.sucursal,
      f.colaborador,
      f.cliente,
      f.modeloChangan,
      f.vin,
      f.cotizacion || f.numeroOR,
      f.codigoRepuesto,
      f.descripcionOficial,
      f.cantidadSolicitada,
      f.cantidadAsignada,
      f.estatusLinea === 'Asignado'
        ? (f.cantidadAsignada < f.cantidadSolicitada
            ? `PARCIAL (${f.cantidadAsignada}u) en ${f.contenedorAsignado} • Pallet ${f.palletAsignado}`
            : `COMPROMETIDO en ${f.contenedorAsignado} • Pallet ${f.palletAsignado}`)
        : f.estatusLinea === 'Despachado'
        ? 'DESPACHADO FÍSICAMENTE'
        : 'Pendiente Fábrica • Sin arribo en CEDIS (0 stock)',
      f.contenedorAsignado || '',
      f.palletAsignado || '',
      f.packageNo || '',
      f.observaciones || ''
    ]);

    // Si hay Web App URL configurada, enviar vía Apps Script
    if (this.config.webAppUrl) {
      try {
        const resp = await fetch(this.config.webAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'bulkUploadMatriz',
            userEmail: this.usuarioActivo.correo,
            operationId: `OP-SYNC-MATRIZ-${Date.now()}`,
            rows: filasArray
          })
        });
        const resJson = await resp.json();
        if (resJson.success) {
          return {
            ok: true,
            mensaje: `Sincronización en Google Sheets completada exitosamente (${filasArray.length} registros en Matriz_Central).`
          };
        }
      } catch (err: any) {
        console.warn('Fallo sync directo a Web App, guardado local seguro:', err);
      }
    }

    return {
      ok: true,
      mensaje: `Matriz Central sincronizada localmente (${filasArray.length} registros). Puedes conectar la Web App en el modal API Sheets para escribir directamente en la nube.`
    };
  }
}

export const appsScriptClient = new AppsScriptClientService();


/**
 * Función de diagnóstico integral para Google Apps Script.
 * Realiza una verificación de preflight OPTIONS y una solicitud GET con CORS a la URL
 * para validar que el CORS esté configurado correctamente y que la API esté accesible,
 * notificando cualquier error de conexión específico con diagnóstico técnico y recomendaciones.
 */
export async function diagnosticarConexionAppsScript(
  urlCustom?: string,
  timeoutMs: number = 8000
): Promise<ResultadoDiagnosticoCORS> {
  const url = (urlCustom || '').trim();

  // 1. Validación de URL vacía (Modo local)
  if (!url) {
    return {
      ok: false,
      corsHabilitado: false,
      apiAccesible: false,
      urlEvaluada: '',
      latenciaMs: 0,
      tipoError: 'URL_VACIA',
      mensaje: 'No se ha configurado ninguna URL de Google Apps Script.',
      diagnosticoTecnico: 'Modo local seguro activo. La aplicación opera con persistencia local y emulación exacta de las reglas canónicas.',
      pasosSugeridos: [
        'Ingresa la URL pública de la Web App generada en Apps Script si deseas sincronizar en la nube.',
        'La URL debe iniciar con https://script.google.com/macros/s/ y finalizar en /exec.'
      ]
    };
  }

  // 2. Validación de URLs erróneas comunes
  if (url.includes('docs.google.com/spreadsheets')) {
    return {
      ok: false,
      corsHabilitado: false,
      apiAccesible: false,
      urlEvaluada: url,
      latenciaMs: 0,
      tipoError: 'ES_SPREADSHEET_NO_WEBAPP',
      mensaje: 'La URL corresponde a la hoja de cálculo (Google Spreadsheet), no a la Aplicación Web.',
      diagnosticoTecnico: 'Los endpoints de Google Sheets directos no son APIs REST públicas ni permiten CORS directo desde el navegador.',
      pasosSugeridos: [
        'Abre tu Google Spreadsheet.',
        'Haz clic en "Extensiones" > "Apps Script".',
        'Haz clic en el botón azul "Implementar" > "Nueva implementación" > Tipo: "Aplicación web".',
        'Configura "Quién tiene acceso" como "Cualquier persona" (Anyone).',
        'Copia la URL pública generada que finaliza en /exec.'
      ]
    };
  }

  if (url.includes('/edit') || url.includes('/dev')) {
    return {
      ok: false,
      corsHabilitado: false,
      apiAccesible: false,
      urlEvaluada: url,
      latenciaMs: 0,
      tipoError: 'TERMINA_EN_EDIT_O_DEV',
      mensaje: 'La URL ingresada es del editor o del entorno de desarrollo (/edit o /dev).',
      diagnosticoTecnico: 'Las URLs que terminan en /edit o /dev exigen inicio de sesión interactivo de desarrollador de Google Workspace y no admiten llamadas CORS de aplicaciones web externas.',
      pasosSugeridos: [
        'En Apps Script, ve a "Implementar" > "Gestionar implementaciones".',
        'Copia la URL de producción que termina exactamente en /exec.'
      ]
    };
  }

  if (!url.startsWith('https://script.google.com/macros/s/') || !url.includes('/exec')) {
    return {
      ok: false,
      corsHabilitado: false,
      apiAccesible: false,
      urlEvaluada: url,
      latenciaMs: 0,
      tipoError: 'FORMATO_URL_INVALIDO',
      mensaje: 'El formato de la URL de Google Apps Script es inválido.',
      diagnosticoTecnico: 'La URL no cumple con el patrón canónico https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec',
      pasosSugeridos: [
        'Verifica que la URL empiece con https://script.google.com/macros/s/',
        'Asegúrate de que no contenga espacios ni caracteres adicionales.',
        'Verifica que finalice en /exec.'
      ]
    };
  }

  // 3. Ejecutar solicitud OPTIONS de prueba (Preflight check)
  const optionsRespuesta: ResultadoDiagnosticoCORS['optionsRespuesta'] = {
    probado: true,
    corsHeadersPresentes: false
  };

  try {
    const controllerOptions = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutOptions = controllerOptions ? setTimeout(() => controllerOptions.abort(), 3500) : null;

    const optResp = await fetch(url, {
      method: 'OPTIONS',
      mode: 'cors',
      signal: controllerOptions ? controllerOptions.signal : undefined
    });

    if (timeoutOptions) clearTimeout(timeoutOptions);
    optionsRespuesta.status = optResp.status;
    const allowOrigin = optResp.headers?.get('access-control-allow-origin');
    optionsRespuesta.corsHeadersPresentes = !!allowOrigin;
    optionsRespuesta.nota = `OPTIONS HTTP ${optResp.status} - Access-Control-Allow-Origin: ${allowOrigin || 'no expuesto'}`;
  } catch (optErr: any) {
    optionsRespuesta.nota = `OPTIONS preflight no concluyente: ${optErr?.message || 'Rechazado o no implementado por el proxy de Google'}`;
  }

  // 4. Ejecutar solicitud de prueba GET con CORS ('action=ping' y timestamp anti-cache)
  const testUrl = `${url}${url.includes('?') ? '&' : '?'}action=ping&_t=${Date.now()}`;
  const startPing = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const resp = await fetch(testUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);
    const latenciaMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startPing);

    // Verificar Códigos de Estado Específicos
    if (resp.status === 403) {
      return {
        ok: false,
        corsHabilitado: true,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        statusCode: 403,
        optionsRespuesta,
        getRespuesta: { status: 403, statusText: resp.statusText, esJson: true },
        tipoError: 'NO_AUTORIZADO_403',
        mensaje: 'Acceso Prohibido (HTTP 403): Usuario no autorizado en la hoja.',
        diagnosticoTecnico: 'CORS está habilitado, pero la regla de validación de Apps Script rechazó el correo porque no existe en la pestaña BD_Encargados.',
        pasosSugeridos: [
          'Verifica que el correo con el que iniciaste sesión esté en la pestaña "BD_Encargados" de tu Google Sheet.',
          'Revisa que la columna "activo" esté en "TRUE" o "Sí".'
        ]
      };
    }

    if (resp.status === 404) {
      return {
        ok: false,
        corsHabilitado: true,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        statusCode: 404,
        optionsRespuesta,
        getRespuesta: { status: 404, statusText: resp.statusText, esJson: false },
        tipoError: 'NO_ENCONTRADO_404',
        mensaje: 'Implementación No Encontrada (HTTP 404).',
        diagnosticoTecnico: 'La URL no apunta a un Deployment ID activo en Google Apps Script.',
        pasosSugeridos: [
          'En el editor de Apps Script, haz clic en "Implementar" > "Gestionar implementaciones".',
          'Verifica que la implementación de tipo "Aplicación web" esté activa y copia su URL actual.'
        ]
      };
    }

    if (resp.status >= 500) {
      return {
        ok: false,
        corsHabilitado: true,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        statusCode: resp.status,
        optionsRespuesta,
        getRespuesta: { status: resp.status, statusText: resp.statusText, esJson: false },
        tipoError: 'ERROR_SERVIDOR_500',
        mensaje: `Error interno de ejecución en Google Apps Script (HTTP ${resp.status}).`,
        diagnosticoTecnico: 'El script arrojó una excepción no capturada en doGet(). Posible falta de autorización de la hoja o error de sintaxis.',
        pasosSugeridos: [
          'En Apps Script, abre el menú izquierdo "Ejecuciones" (Executions) para ver el registro exacto del error.',
          'Ejecuta la función setupSpreadsheetCanonica manualmente en el editor para otorgar permisos.'
        ]
      };
    }

    // Procesar JSON de respuesta
    let data: any = null;
    try {
      data = await resp.json();
    } catch (jsonErr) {
      return {
        ok: false,
        corsHabilitado: true,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        statusCode: resp.status,
        optionsRespuesta,
        getRespuesta: { status: resp.status, statusText: resp.statusText, esJson: false },
        tipoError: 'RESPUESTA_INVALIDA',
        mensaje: 'La API respondió pero el cuerpo no es un JSON válido.',
        diagnosticoTecnico: 'La respuesta no pudo ser parseada con JSON.parse. Es probable que se haya devuelto HTML de error o redirección.',
        pasosSugeridos: [
          'Abre la URL directamente en el navegador agregando ?action=ping para inspeccionar la salida directa.',
          'Asegúrate de que doGet() retorne ContentService.createTextOutput con MimeType.JSON.'
        ]
      };
    }

    if (data && (data.status === 'OK' || data.success)) {
      const tabs = data.pestanasDetectadas || [];
      return {
        ok: true,
        corsHabilitado: true,
        apiAccesible: true,
        urlEvaluada: url,
        latenciaMs,
        statusCode: 200,
        optionsRespuesta,
        getRespuesta: { status: 200, statusText: 'OK', esJson: true },
        spreadsheetName: data.spreadsheetName || 'CEDIS_DB',
        spreadsheetId: data.spreadsheetId,
        totalPestanas: data.totalPestanas || (tabs.length > 0 ? tabs.length : undefined),
        pestanasDetectadas: tabs,
        mensaje: `¡CORS válido y API accesible! Hoja vinculada: "${data.spreadsheetName || 'CEDIS_DB'}".`,
        diagnosticoTecnico: `Conexión HTTP 200 exitosa. Cabeceras CORS aceptadas por el navegador en ${latenciaMs} ms.`,
        pasosSugeridos: [
          'La conexión canónica está lista para sincronizar pedidos, asignaciones de stock e importaciones.'
        ]
      };
    }

    return {
      ok: false,
      corsHabilitado: true,
      apiAccesible: false,
      urlEvaluada: url,
      latenciaMs,
      statusCode: 200,
      optionsRespuesta,
      getRespuesta: { status: 200, statusText: 'OK', esJson: true },
      tipoError: 'RESPUESTA_INVALIDA',
      mensaje: data?.error || 'La API respondió con formato no reconocido.',
      diagnosticoTecnico: `Respuesta recibida: ${JSON.stringify(data).substring(0, 150)}`,
      pasosSugeridos: [
        'Verifica que la función doGet() en Code.gs maneje la acción "ping" retornando { success: true, status: "OK" }.'
      ]
    };

  } catch (fetchErr: any) {
    if (timeoutId) clearTimeout(timeoutId);
    const latenciaMs = Math.round((typeof performance !== 'undefined' ? performance.now() : Date.now()) - startPing);

    // Detección de Timeout
    if (fetchErr?.name === 'AbortError' || (fetchErr?.message && fetchErr.message.includes('abort'))) {
      return {
        ok: false,
        corsHabilitado: false,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        tipoError: 'TIMEOUT',
        mensaje: `Tiempo de espera agotado (${timeoutMs} ms) esperando respuesta de Google Apps Script.`,
        diagnosticoTecnico: 'La petición fue abortada tras superar el límite de tiempo. Google Apps Script puede estar experimentando un cold-start o esperando autorización interactiva.',
        pasosSugeridos: [
          'Prueba abrir la URL en una pestaña del navegador para calentar el contenedor de Google Apps Script.',
          'Revisa en el editor de Apps Script que la función doGet() no tenga demoras excesivas.'
        ]
      };
    }

    // Detección de Bloqueo CORS / Failed to fetch
    // Realizamos una verificación auxiliar JSONP si estamos en el navegador para saber si el script está activo en los servidores de Google
    let scriptActivoConJsonp = false;
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      try {
        await new Promise((resolve, reject) => {
          const cbName = 'cedis_cors_diag_' + Math.round(Math.random() * 100000);
          const s = document.createElement('script');
          const t = setTimeout(() => {
            cleanup();
            reject(new Error('timeout'));
          }, 3500);

          const cleanup = () => {
            clearTimeout(t);
            if (s.parentNode) s.parentNode.removeChild(s);
            delete (window as any)[cbName];
          };

          (window as any)[cbName] = () => {
            cleanup();
            resolve(true);
          };
          s.onerror = () => {
            cleanup();
            reject(new Error('error'));
          };
          s.src = `${url}${url.includes('?') ? '&' : '?'}action=ping&callback=${cbName}`;
          document.body.appendChild(s);
        });
        scriptActivoConJsonp = true;
      } catch (e) {
        scriptActivoConJsonp = false;
      }
    }

    if (scriptActivoConJsonp) {
      return {
        ok: false,
        corsHabilitado: false,
        apiAccesible: false,
        urlEvaluada: url,
        latenciaMs,
        optionsRespuesta,
        tipoError: 'CORS_BLOQUEADO_LOGIN_GOOGLE',
        mensaje: 'CORS Bloqueado: La Web App está activa pero Google bloquea solicitudes web externas.',
        diagnosticoTecnico: 'El script responde a través de etiquetas <script> (JSONP), pero las peticiones fetch/XHR son bloqueadas por políticas de CORS del navegador. Esto ocurre cuando "Quién tiene acceso" (Who has access) está configurado como "Solo yo" o "Usuarios con cuenta Google", lo cual redirige a la pantalla de login que rechaza orígenes cruzados.',
        pasosSugeridos: [
          'En el editor de Apps Script, haz clic en "Implementar" > "Gestionar implementaciones".',
          'Haz clic en el icono de lápiz (Editar) de tu implementación.',
          'Cambia "Quién tiene acceso" (Who has access) a "Cualquier persona" (Anyone).',
          'En Versión, selecciona "Nueva versión".',
          'Haz clic en "Implementar".'
        ]
      };
    }

    return {
      ok: false,
      corsHabilitado: false,
      apiAccesible: false,
      urlEvaluada: url,
      latenciaMs,
      optionsRespuesta,
      tipoError: 'ERROR_RED_O_CORS',
      mensaje: 'Fallo de conexión o CORS bloqueado (Failed to fetch).',
      diagnosticoTecnico: `El navegador bloqueó la conexión: ${fetchErr?.message || 'TypeError: Failed to fetch'}. En Google Apps Script esto ocurre principalmente cuando "Quién tiene acceso" no es "Cualquier persona" o cuando la hoja aún no ha sido autorizada por el propietario.`,
      pasosSugeridos: [
        'En Apps Script, ve a "Gestionar implementaciones" > Editar y cambia "Quién tiene acceso" a "Cualquier persona" (Anyone).',
        'En el editor de Apps Script, selecciona la función setupSpreadsheetCanonica y haz clic en "Ejecutar" para autorizar permisos.',
        'Abre la URL en una nueva pestaña del navegador agregando ?action=ping para confirmar si Google solicita autorización.'
      ]
    };
  }
}
