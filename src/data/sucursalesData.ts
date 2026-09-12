export interface PersonalSucursal {
  id: string;
  nombre: string;
  cargo: string;
  area: 'Mostrador' | 'Chapistería' | 'Taller' | 'Repuestos' | 'Garantías';
  correo?: string;
}

export interface ConfiguracionSucursal {
  id: string;
  nombre: string;
  prefijo: string;
  tipoEquipo: 'INDIVIDUAL' | 'MULTIPLE';
  badge: string;
  canalDefecto: string;
  // Para sucursales individuales
  asesorFijo?: PersonalSucursal;
  // Para sucursales con equipo múltiple
  equipo?: PersonalSucursal[];
  descripcionEquipo?: string;
}

export const SUCURSALES_PORTAL: ConfiguracionSucursal[] = [
  {
    id: 'costa_verde',
    nombre: 'Costa Verde',
    prefijo: 'CV',
    tipoEquipo: 'INDIVIDUAL',
    badge: 'Más alto',
    canalDefecto: 'Taller',
    asesorFijo: {
      id: 'usr_cv_01',
      nombre: 'Arquímedes Jordan',
      cargo: 'Asesor Técnico de Servicio',
      area: 'Taller',
      correo: 'taller.costaverde@changanpanama.com'
    }
  },
  {
    id: 'calle_50',
    nombre: 'Calle 50',
    prefijo: 'C50',
    tipoEquipo: 'MULTIPLE',
    badge: 'Equipo Múltiple',
    canalDefecto: 'Taller',
    descripcionEquipo: 'Edilson, Valeria, Carlos, Roberto. Te preguntará quién eres para reconocer tu área',
    equipo: [
      {
        id: 'usr_c50_01',
        nombre: 'Edilson Uribe',
        cargo: 'Asesor Senior de Servicio',
        area: 'Taller',
        correo: 'servicio.c50@changanpanama.com'
      },
      {
        id: 'usr_c50_02',
        nombre: 'Valeria Castillo',
        cargo: 'Especialista en Garantías Oficiales',
        area: 'Garantías',
        correo: 'garantias.c50@changanpanama.com'
      },
      {
        id: 'usr_c50_03',
        nombre: 'Carlos Mendoza',
        cargo: 'Ventas de Mostrador y Flotas',
        area: 'Mostrador',
        correo: 'repuestos.c50@changanpanama.com'
      },
      {
        id: 'usr_c50_04',
        nombre: 'Roberto González',
        cargo: 'Facturador y Supervisor de Taller',
        area: 'Taller',
        correo: 'taller.c50@changanpanama.com'
      }
    ]
  },
  {
    id: 'tumba_muerto',
    nombre: 'Tumba Muerto',
    prefijo: 'TM',
    tipoEquipo: 'INDIVIDUAL',
    badge: 'Más alto',
    canalDefecto: 'Taller',
    asesorFijo: {
      id: 'usr_tm_01',
      nombre: 'Ulises Barría',
      cargo: 'Asesor de Servicio y Colisión',
      area: 'Taller',
      correo: 'repuestos.tm@changanpanama.com'
    }
  },
  {
    id: 'chiriqui',
    nombre: 'Chiriquí',
    prefijo: 'CH',
    tipoEquipo: 'INDIVIDUAL',
    badge: 'Más alto',
    canalDefecto: 'Taller',
    asesorFijo: {
      id: 'usr_ch_01',
      nombre: 'Nivardo Gutiérrez',
      cargo: 'Asesor Integral Chiriquí',
      area: 'Taller',
      correo: 'sucursal.chiriqui@changanpanama.com'
    }
  },
  {
    id: 'santa_maria',
    nombre: 'Santa María',
    prefijo: 'SM',
    tipoEquipo: 'INDIVIDUAL',
    badge: 'Mostrador',
    canalDefecto: 'Mostrador',
    asesorFijo: {
      id: 'usr_sm_01',
      nombre: 'Marcos Vega',
      cargo: 'Asesor de Mostrador y Repuestos',
      area: 'Mostrador',
      correo: 'mostrador.santamaria@changanpanama.com'
    }
  },
  {
    id: 'villa_lucre',
    nombre: 'Villa Lucre',
    prefijo: 'VL',
    tipoEquipo: 'MULTIPLE',
    badge: 'Equipo Múltiple',
    canalDefecto: 'Mostrador',
    descripcionEquipo: 'Leidys, Edwin, Pedro, Luis, Daniel. Te preguntará quién eres para reconocer tu área',
    equipo: [
      {
        id: 'usr_vl_01',
        nombre: 'Leidys Pérez',
        cargo: 'Ventas Mostrador',
        area: 'Mostrador',
        correo: 'repuestos.vl@changanpanama.com'
      },
      {
        id: 'usr_vl_02',
        nombre: 'Edwin Blanco',
        cargo: 'Consultor de estructuras metálicas',
        area: 'Chapistería',
        correo: 'chapisteria.vl@changanpanama.com'
      },
      {
        id: 'usr_vl_03',
        nombre: 'Pedro',
        cargo: 'Facturador de Taller',
        area: 'Taller',
        correo: 'taller.vl@changanpanama.com'
      },
      {
        id: 'usr_vl_04',
        nombre: 'Luis Rodríguez',
        cargo: 'Supervisor de Repuestos',
        area: 'Repuestos',
        correo: 'supervisor.repuestos@changanpanama.com'
      },
      {
        id: 'usr_vl_05',
        nombre: 'Daniel Saldaña',
        cargo: 'Gerente de Repuestos',
        area: 'Repuestos',
        correo: 'gerencia.repuestos@changanpanama.com'
      }
    ]
  }
];

export interface ModeloVehiculoChangan {
  nombre: string;
  categoria: 'SUV' | 'Sedán' | 'Eléctrico / Híbrido' | 'Pickup' | 'Comercial';
  anosCompatibles: string;
}

export const CATALOGO_MODELOS_CHANGAN: ModeloVehiculoChangan[] = [
  { nombre: 'CS15', categoria: 'SUV', anosCompatibles: '2018-2026' },
  { nombre: 'CS35 Plus', categoria: 'SUV', anosCompatibles: '2019-2026' },
  { nombre: 'CS35 Plus Turbo', categoria: 'SUV', anosCompatibles: '2021-2026' },
  { nombre: 'CS55 Plus', categoria: 'SUV', anosCompatibles: '2021-2026' },
  { nombre: 'CS55 Plus 2da Gen', categoria: 'SUV', anosCompatibles: '2022-2026' },
  { nombre: 'CS75 Plus', categoria: 'SUV', anosCompatibles: '2020-2026' },
  { nombre: 'Oshan X7 Plus', categoria: 'SUV', anosCompatibles: '2021-2025' },
  { nombre: 'UNI-T', categoria: 'SUV', anosCompatibles: '2021-2026' },
  { nombre: 'UNI-K', categoria: 'SUV', anosCompatibles: '2021-2026' },
  { nombre: 'Alsvin', categoria: 'Sedán', anosCompatibles: '2020-2026' },
  { nombre: 'Eado EV460', categoria: 'Eléctrico / Híbrido', anosCompatibles: '2021-2026' },
  { nombre: 'Hunter Pickup (4x2 / 4x4)', categoria: 'Pickup', anosCompatibles: '2020-2026' },
  { nombre: 'Hunter REEV / Híbrido', categoria: 'Eléctrico / Híbrido', anosCompatibles: '2024-2026' },
  { nombre: 'Deepal S07', categoria: 'Eléctrico / Híbrido', anosCompatibles: '2023-2026' },
  { nombre: 'Deepal L07', categoria: 'Eléctrico / Híbrido', anosCompatibles: '2023-2026' },
  { nombre: 'Avatr 11', categoria: 'Eléctrico / Híbrido', anosCompatibles: '2024-2026' },
  { nombre: 'Honor S', categoria: 'Comercial', anosCompatibles: '2018-2025' },
  { nombre: 'Star Truck / M201', categoria: 'Comercial', anosCompatibles: '2017-2026' }
];

export const CATEGORIAS_MODELOS: Array<'SUV' | 'Sedán' | 'Eléctrico / Híbrido' | 'Pickup' | 'Comercial'> = [
  'SUV',
  'Sedán',
  'Eléctrico / Híbrido',
  'Pickup',
  'Comercial'
];

export const MODELOS_VEHICULOS_CHANGAN = CATALOGO_MODELOS_CHANGAN.map(m => m.nombre);
