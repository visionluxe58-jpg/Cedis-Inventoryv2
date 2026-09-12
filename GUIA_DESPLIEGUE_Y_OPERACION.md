# Guía de Despliegue y Operación Diaria — CEDIS Changan Auto Panamá

Esta guía documenta la puesta en marcha, configuración técnica de Google Apps Script y el protocolo de operación diaria para el sistema de pedidos y repuestos de CEDIS Changan Panamá.

---

## 1. Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada y segura:
- **Frontend Operativo:** Aplicación web moderna (React + Tailwind CSS) ejecutada en navegador para CEDIS y Sucursales.
- **Capa API y Concurrencia:** Google Apps Script (`apps-script/Code.gs`), intermediario seguro con `LockService` y control de idempotencia (`operationId`).
- **Base de Datos Canónica:** Hoja de cálculo de Google Sheets estructurada en 8 pestañas con validación de tipos y bitácora inmutable.

```
[ Frontend Web ]  ──(JSON via HTTPS)──>  [ Google Apps Script (API) ]  ──(LockService)──>  [ Google Sheets Canónica ]
  (CEDIS / Sucursal)                       - Control de Roles & Token                          - Solicitudes_Cabecera
                                           - Validación de Saldo Libre                         - Detalle_Repuestos
                                           - Idempotencia (operationId)                        - DPL_Detalle
                                           - Auditoría Inmutable                               - Auditoria_Kardex
```

---

## 2. Configuración Canónica en Google Sheets

1. Crear una nueva hoja de cálculo en Google Drive con el nombre:
   `CEDIS_Changan_Panama_DB`
2. Copiar el ID de la hoja desde la URL del navegador:
   `https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit`
3. La hoja canónica cuenta con las siguientes 8 pestañas:
   - `Solicitudes_Cabecera`: Datos generales del pedido (pedidoId, sucursal, asesor, VIN, modelo, etc.).
   - `Detalle_Repuestos`: Líneas de repuestos solicitadas (relación 1 a N con Cabecera).
   - `DPL_Detalle`: Inventario físico recibido por contenedor, pallet y repuesto.
   - `Manifiestos_DPL`: Embarques de contenedores, fechas de arribo y estado de aduanas.
   - `Modelos_Oficiales`: Catálogo oficial de vehículos Changan (UNI-T, CS55 Plus, Hunter, Alsvin, etc.).
   - `Encargados_Sucursales`: Catálogo de usuarios, correos institucionales, sucursal y rol RBAC.
   - `Auditoria_Kardex`: Registro inmutable (append-only) de cada operación con fecha, usuario y valores.
   - `Matriz_Central`: Vista consolidada de seguimiento operativo.

> **Nota:** Al ejecutar la función `inicializarEstructuraHojas()` en el script de Apps Script, todas las pestañas y sus encabezados son creados automáticamente.

---

## 3. Despliegue de Google Apps Script

1. En la hoja de Google Sheets, abrir el menú superior: **Extensiones** > **Apps Script**.
2. Eliminar el código por defecto y pegar el contenido completo del archivo:
   `apps-script/Code.gs`
3. En la barra de herramientas del editor de Apps Script, seleccionar la función `inicializarEstructuraHojas` y hacer clic en **Ejecutar**. Conceder los permisos solicitados de lectura y escritura a Google Drive y Sheets.
4. Para publicar como API:
   - Clic en el botón azul **Implementar** (Deploy) > **Nueva implementación**.
   - Seleccionar tipo: **Aplicación web**.
   - **Descripción:** `API CEDIS Changan v1.0`.
   - **Ejecutar como:** `Yo` (tu cuenta de correo corporativa o de servicio).
   - **Quién tiene acceso:** `Cualquier persona` (permite que la aplicación web envíe peticiones POST/GET con token de autenticación).
   - Clic en **Implementar**.
5. Copiar la **URL de la aplicación web** resultante (terminada en `/exec`).

---

## 4. Conexión de la Aplicación Web

1. En la aplicación web de CEDIS Changan, hacer clic en el botón **API Sheets** en la barra superior.
2. Pegar la URL de la aplicación web (`.../exec`).
3. Hacer clic en **Guardar y Probar Conexión**. La aplicación enviará un ping (`?action=ping`) y confirmará el enlace seguro.

---

## 5. Control de Acceso Basado en Roles (RBAC)

El sistema valida roles en cada operación sensible:

| Rol | Permisos Principales |
| :--- | :--- |
| **Administrador CEDIS** | Acceso total: creación de pedidos, asignación de inventario, despacho físico, ajuste de mermas, conciliación de staging y auditoría. |
| **Operador CEDIS** | Consulta general, asignación física y ejecución de despachos en almacén central. No puede modificar configuraciones críticas ni autorizar lotes de staging sin visto bueno. |
| **Sucursal / Asesor** | Creación de requisiciones de repuestos para su sucursal, consulta de estado de pedidos y seguimiento de entregas. **Bloqueado:** No puede asignar stock ni despachar pallets de CEDIS. |
| **Consulta / Auditoría** | Lectura sin permisos de escritura ni despacho. Ideal para gerencia, control financiero o peritaje. |

---

## 6. Procedimiento del Incidente de Septiembre (Staging & Conciliación)

Para resolver la discrepancia de 900 pedidos del 9 de septiembre frente a los 1,486 pedidos del 10 de septiembre:

1. Abrir la pestaña **Conciliación & Staging** en la barra de navegación.
2. El sistema clasifica automáticamente los registros bajo la jerarquía de confianza:
   - **5 Ausentes Preservados:** Pedidos presentes el 9-sep pero no el 10-sep. Se mantienen protegidos contra borrado automático.
   - **Lote Histórico de Excel:** 567 registros (565 fechados 31-ago). No se marcan como pedidos nuevos del 10-sep; requieren confirmación humana.
   - **Semánticos Detectados:** 274 casos con similitud de cliente/vehículo para verificación de reemplazo.
   - **Nuevos Confirmados:** Pedidos legítimos creados con posterioridad.
3. El Administrador CEDIS revisa la tabla y aplica decisiones:
   - `Aprobar`: Incorpora el pedido a la base canónica.
   - `Conservar Ambos`: Mantiene ambos pedidos como transacciones independientes válidas.
   - `Descartar`: Marca como duplicado sin alterar datos de auditoría.
4. Hacer clic en **Aprobar Migración**. Se generará un `operationId` único y se grabará en la bitácora inmutable.

---

## 7. Operación Diaria de CEDIS

### A. Registro de Requisición por Sucursales
1. Asesor ingresa al módulo **+ Requisición**.
2. Selecciona sucursal, asesor, prioridad (VOR / Taller / Colisión / Garantía), VIN del auto y cliente.
3. Agrega las líneas de repuesto requeridas. El sistema indica si existe saldo disponible en tiempo real en CEDIS.
4. Clic en **Enviar y Registrar Pedido Canónico**.

### B. Asignación y Despacho en Almacén Central
1. El personal de CEDIS abre la **Matriz Central** o **Stock & Kardex**.
2. Localiza la solicitud por código OEM, VIN o sucursal.
3. Asigna repuestos desde el contenedor y pallet correspondiente según la fórmula canónica:
   $$\text{Saldo Disponible} = \text{Cantidad Total} - \text{Cantidad Asignada} - \text{Cantidad Despachada}$$
4. Al momento del embarque físico al camión de sucursal, se pulsa **Despachar**. El sistema descuenta el stock de manera irreversible y genera el registro en `Auditoria_Kardex`.

### C. Mermas o Daños en Desempaque
1. En **Stock & Kardex**, el Administrador pulsa **Ajuste Merma** en la línea afectada.
2. Ingresa la cantidad no apta y la justificación.
3. El saldo disponible se recalcula y se genera un comprobante inmutable en auditoría.
