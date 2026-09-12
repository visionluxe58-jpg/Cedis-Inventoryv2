/**
 * =========================================================================================
 * SISTEMA CANÓNICO CEDIS CHANGAN PANAMÁ - API GOOGLE APPS SCRIPT
 * Fuente Canónica Única: Google Sheets
 * Control de Concurrencia: LockService.getScriptLock()
 * Bitácora Inmutable: Auditoria_Kardex
 * Idempotencia: Verificación estricta de operationId
 * =========================================================================================
 */

var SHEETS = {
  CABECERA: 'Solicitudes_Cabecera',
  DETALLE: 'Detalle_Repuestos',
  MANIFIESTOS: 'DPL_Manifiestos',
  DPL_DETALLE: 'DPL_Detalle',
  MODELOS: 'Modelos',
  ENCARGADOS: 'BD_Encargados',
  AUDITORIA: 'Auditoria_Kardex',
  MATRIZ: 'Matriz_Central'
};

var SHEET_ALIASES = {
  CABECERA: ['Solicitudes_Cabecera', 'Solicitudes', 'BD_Solicitudes', 'Cabecera', 'Pedidos', 'Requisiciones'],
  DETALLE: ['Detalle_Repuestos', 'Detalle', 'Repuestos_Detalle', 'Repuestos', 'Lineas_Repuestos'],
  MANIFIESTOS: ['DPL_Manifiestos', 'Manifiestos_DPL', 'Manifiestos', 'Contenedores', 'Embarques'],
  DPL_DETALLE: ['DPL_Detalle', 'DPL', 'Inventario_DPL', 'Stock_DPL', 'Inventario'],
  MODELOS: ['Modelos', 'Modelos_Oficiales', 'Catalogo_Modelos', 'Vehiculos'],
  ENCARGADOS: ['BD_Encargados', 'Encargados_Sucursales', 'Encargados', 'Usuarios', 'Asesores'],
  AUDITORIA: ['Auditoria_Kardex', 'Auditoria', 'Kardex', 'Bitacora', 'Historial'],
  MATRIZ: ['Matriz_Central', 'Matriz', 'Consolidado']
};

/**
 * Obtiene una hoja por clave canónica o alias flexible
 */
function getSheetSmart(ss, key) {
  if (!ss) return null;
  var exactName = SHEETS[key];
  if (exactName) {
    var exact = ss.getSheetByName(exactName);
    if (exact) return exact;
  }
  
  var aliases = SHEET_ALIASES[key] || [];
  for (var i = 0; i < aliases.length; i++) {
    var found = ss.getSheetByName(aliases[i]);
    if (found) return found;
  }
  
  // Búsqueda insensible a mayúsculas/minúsculas y símbolos
  var allSheets = ss.getSheets();
  for (var j = 0; j < allSheets.length; j++) {
    var sNorm = allSheets[j].getName().trim().toLowerCase().replace(/[\s_-]+/g, '');
    for (var k = 0; k < aliases.length; k++) {
      var aNorm = aliases[k].trim().toLowerCase().replace(/[\s_-]+/g, '');
      if (sNorm === aNorm) return allSheets[j];
    }
  }
  return null;
}

var ROLES = {
  ADMIN: 'ADMINISTRADOR_CEDIS',
  OPERADOR: 'OPERADOR_CEDIS',
  SUCURSAL: 'SUCURSAL_ASESOR',
  CONSULTA: 'CONSULTA'
};

/**
 * Endpoint GET para lectura autorizada
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action || 'getInitialData';
    var userEmail = (params.userEmail || '').trim().toLowerCase();
    var callback = params.callback;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetsList = ss.getSheets().map(function(s) { return s.getName(); });

    if (action === 'healthCheck' || action === 'ping') {
      return jsonResponse({
        success: true,
        status: 'OK',
        spreadsheetId: ss.getId(),
        spreadsheetName: ss.getName(),
        pestanasDetectadas: sheetsList,
        totalPestanas: sheetsList.length,
        timestamp: new Date().toISOString()
      }, 200, callback);
    }
    
    var user = verificarUsuario(userEmail);
    if (!user) {
      return jsonResponse({ success: false, error: 'Usuario no autorizado en BD_Encargados: ' + userEmail }, 403, callback);
    }

    if (action === 'getInitialData') {
      var cabeceras = getSheetObjects(getSheetSmart(ss, 'CABECERA'));
      var detalles = getSheetObjects(getSheetSmart(ss, 'DETALLE'));
      var manifiestos = getSheetObjects(getSheetSmart(ss, 'MANIFIESTOS'));
      var dplDetalle = getSheetObjects(getSheetSmart(ss, 'DPL_DETALLE'));
      var modelos = getSheetObjects(getSheetSmart(ss, 'MODELOS'));
      var encargados = getSheetObjects(getSheetSmart(ss, 'ENCARGADOS'));
      var auditoria = getSheetObjects(getSheetSmart(ss, 'AUDITORIA'), 150); // Últimos 150 eventos

      return jsonResponse({
        success: true,
        data: {
          cabeceras: cabeceras,
          detalles: detalles,
          manifiestos: manifiestos,
          dplDetalle: dplDetalle,
          modelos: modelos,
          encargados: encargados,
          auditoria: auditoria,
          currentUser: user
        }
      });
    }

    if (action === 'getAuditoria') {
      var limit = parseInt(params.limit || '200', 10);
      var aud = getSheetObjects(getSheetSmart(ss, 'AUDITORIA'), limit);
      return jsonResponse({ success: true, data: aud });
    }

    return jsonResponse({ success: false, error: 'Acción GET desconocida: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() }, 500);
  }
}

/**
 * Endpoint POST para mutaciones seguras con LockService y Auditoría
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  var lockAcquired = false;

  try {
    var rawBody = e.postData ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var action = payload.action;
    var userEmail = (payload.userEmail || '').trim().toLowerCase();
    var operationId = payload.operationId;

    if (!operationId) {
      return jsonResponse({ success: false, error: 'El campo operationId es obligatorio para garantizar idempotencia.' }, 400);
    }

    var user = verificarUsuario(userEmail);
    if (!user) {
      return jsonResponse({ success: false, error: 'Acceso denegado. Correo no registrado o inactivo en BD_Encargados: ' + userEmail }, 403);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Verificación de Idempotencia en Auditoria_Kardex
    if (fueOperacionProcesada(ss, operationId)) {
      return jsonResponse({
        success: true,
        idempotent: true,
        message: 'Operación previamente procesada con éxito (idempotencia confirmada).',
        operationId: operationId
      });
    }

    // 2. Adquirir Bloqueo de Concurrencia (LockService)
    lockAcquired = lock.tryLock(15000); // 15 segundos max
    if (!lockAcquired) {
      return jsonResponse({
        success: false,
        error: 'El almacén central está siendo actualizado por otra transacción concurrente. Por favor reintente en unos momentos.'
      }, 429);
    }

    // 3. Enrutamiento de Mutaciones según Rol
    if (action === 'createPedido') {
      return handleCreatePedido(ss, payload, user, operationId);
    } 
    else if (action === 'assignStock') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes. Solo CEDIS puede asignar repuestos de inventario.' }, 403);
      }
      return handleAssignStock(ss, payload, user, operationId);
    } 
    else if (action === 'dispatchItem') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes. Solo CEDIS puede ejecutar despachos físicos de repuestos.' }, 403);
      }
      return handleDispatchItem(ss, payload, user, operationId);
    }
    else if (action === 'commitImport') {
      if (user.rol !== ROLES.ADMIN) {
        return jsonResponse({ success: false, error: 'Solo el Administrador CEDIS puede aprobar la conciliación de staging hacia producción.' }, 403);
      }
      return handleCommitImport(ss, payload, user, operationId);
    }
    else if (action === 'adjustMerma') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para ajustes de inventario o merma.' }, 403);
      }
      return handleAdjustMerma(ss, payload, user, operationId);
    }

    return jsonResponse({ success: false, error: 'Acción POST no reconocida: ' + action }, 400);

  } catch (err) {
    return jsonResponse({ success: false, error: 'Error del servidor: ' + err.toString() }, 500);
  } finally {
    if (lockAcquired) {
      lock.releaseLock();
    }
  }
}

/**
 * Crea un pedido dividiéndolo en Cabecera y Detalle_Repuestos
 */
function handleCreatePedido(ss, payload, user, operationId) {
  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  var pedido = payload.pedido;
  if (!pedido || !pedido.pedidoId || !pedido.items || pedido.items.length === 0) {
    return jsonResponse({ success: false, error: 'Datos de pedido incompletos o sin líneas de repuestos.' }, 400);
  }

  // Verificar que el pedidoId no exista ya
  var existingIds = getColumnValues(cabeceraSheet, 1);
  if (existingIds.indexOf(pedido.pedidoId) !== -1) {
    return jsonResponse({ success: false, error: 'El identificador ' + pedido.pedidoId + ' ya existe en el sistema.' }, 409);
  }

  // 1. Insertar Cabecera
  var filaCabecera = [
    pedido.pedidoId,
    now,
    pedido.sucursal || user.sucursal,
    pedido.colaborador || user.nombre,
    pedido.canal || user.canal || 'Mostrador',
    pedido.tipoPedido || 'Stock Regular',
    pedido.cotizacion || '',
    pedido.cliente || '',
    pedido.placa || '',
    pedido.modeloChangan || '',
    pedido.vin || '',
    pedido.numeroOR || '',
    pedido.estadoPago || 'Pendiente',
    pedido.documentoPagoFactura || '',
    'No',
    'Pendiente',
    'Pendiente de Despacho',
    'PORTAL_CEDIS',
    1,
    user.nombre,
    now,
    user.nombre,
    now,
    pedido.observaciones || ''
  ];
  cabeceraSheet.appendRow(filaCabecera);

  // 2. Insertar Detalle de Repuestos
  var lineasInsertadas = [];
  for (var i = 0; i < pedido.items.length; i++) {
    var item = pedido.items[i];
    var lineaId = pedido.pedidoId + '-L' + (i + 1);
    var filaDetalle = [
      lineaId,
      pedido.pedidoId,
      item.codigoRepuesto,
      item.codigoRepuesto,
      item.descripcionOficial || '',
      item.cantidadSolicitada || 1,
      0, // Asignada inicial
      0, // Despachada inicial
      '', // Contenedor
      '', // Pallet
      '', // Package
      '', // Ubicación
      'Pendiente'
    ];
    detalleSheet.appendRow(filaDetalle);
    lineasInsertadas.push(lineaId);
  }

  // 3. Registrar en Auditoria_Kardex
  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'CREACION_PEDIDO',
    entidad: 'Solicitudes_Cabecera',
    identificador: pedido.pedidoId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ pedidoId: pedido.pedidoId, lineas: lineasInsertadas.length, cliente: pedido.cliente }),
    operationId: operationId,
    notas: 'Requisición registrada desde sucursal ' + (pedido.sucursal || user.sucursal)
  });

  return jsonResponse({
    success: true,
    pedidoId: pedido.pedidoId,
    totalLineas: lineasInsertadas.length,
    message: 'Pedido ' + pedido.pedidoId + ' registrado canónicamente con éxito.'
  });
}

/**
 * Asignación Atómica de Stock Físico a una Línea de Pedido
 */
function handleAssignStock(ss, payload, user, operationId) {
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var lineaId = payload.lineaId;
  var inventarioId = payload.inventarioId;
  var cantidadAsignar = parseInt(payload.cantidad || 0, 10);

  if (!lineaId || !inventarioId || cantidadAsignar <= 0) {
    return jsonResponse({ success: false, error: 'Parámetros de asignación inválidos.' }, 400);
  }

  // 1. Localizar y validar fila en DPL_Detalle
  var dplData = dplSheet.getDataRange().getValues();
  var dplRowIndex = -1;
  for (var r = 1; r < dplData.length; r++) {
    if (dplData[r][0] === inventarioId) {
      dplRowIndex = r + 1; // 1-based sheet row
      break;
    }
  }
  if (dplRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Lote de inventario no encontrado: ' + inventarioId }, 404);
  }

  var rowDpl = dplData[dplRowIndex - 1];
  var cantTotal = parseInt(rowDpl[6] || 0, 10);
  var cantAsignadaAct = parseInt(rowDpl[7] || 0, 10);
  var cantDespachadaAct = parseInt(rowDpl[8] || 0, 10);
  var saldoDisponible = cantTotal - cantAsignadaAct - cantDespachadaAct;

  if (saldoDisponible < cantidadAsignar) {
    return jsonResponse({
      success: false,
      error: 'Stock insuficiente en pallet ' + rowDpl[2] + '. Saldo disponible: ' + saldoDisponible + ', Solicitado: ' + cantidadAsignar
    }, 409);
  }

  // 2. Localizar y actualizar fila en Detalle_Repuestos
  var detData = detalleSheet.getDataRange().getValues();
  var detRowIndex = -1;
  for (var d = 1; d < detData.length; d++) {
    if (detData[d][0] === lineaId) {
      detRowIndex = d + 1;
      break;
    }
  }
  if (detRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Línea de pedido no encontrada: ' + lineaId }, 404);
  }

  var detRow = detData[detRowIndex - 1];
  var prevAsig = parseInt(detRow[6] || 0, 10);
  var nuevaAsig = prevAsig + cantidadAsignar;

  // Actualizar Detalle_Repuestos
  detalleSheet.getRange(detRowIndex, 7).setValue(nuevaAsig); // cantAsignada
  detalleSheet.getRange(detRowIndex, 9).setValue(rowDpl[1]); // contenedorAsignado
  detalleSheet.getRange(detRowIndex, 10).setValue(rowDpl[2]); // palletAsignado
  detalleSheet.getRange(detRowIndex, 11).setValue(rowDpl[3]); // packageNo
  detalleSheet.getRange(detRowIndex, 12).setValue(rowDpl[10] || ''); // ubicacionCedis
  detalleSheet.getRange(detRowIndex, 13).setValue('Asignado');

  // Actualizar DPL_Detalle (saldoDisponible = total - asignada - despachada)
  var nuevoDplAsig = cantAsignadaAct + cantidadAsignar;
  var nuevoSaldo = cantTotal - nuevoDplAsig - cantDespachadaAct;
  dplSheet.getRange(dplRowIndex, 8).setValue(nuevoDplAsig);
  dplSheet.getRange(dplRowIndex, 10).setValue(nuevoSaldo);

  // Registrar Auditoría
  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'ASIGNACION_STOCK',
    entidad: 'Detalle_Repuestos',
    identificador: lineaId,
    valoresAnteriores: JSON.stringify({ cantAsignada: prevAsig }),
    valoresNuevos: JSON.stringify({ cantAsignada: nuevaAsig, contenedor: rowDpl[1], pallet: rowDpl[2], inventarioId: inventarioId }),
    operationId: operationId,
    notas: 'Asignación de ' + cantidadAsignar + ' u. desde pallet ' + rowDpl[2]
  });

  return jsonResponse({
    success: true,
    message: 'Stock asignado exitosamente.',
    lineaId: lineaId,
    nuevaAsignada: nuevaAsig,
    saldoRestanteLote: nuevoSaldo
  });
}

/**
 * Despacho Físico Irreversible de Repuesto a Sucursal
 */
function handleDispatchItem(ss, payload, user, operationId) {
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var lineaId = payload.lineaId;
  var cantidadDespachar = parseInt(payload.cantidad || 0, 10);

  if (!lineaId || cantidadDespachar <= 0) {
    return jsonResponse({ success: false, error: 'Parámetros de despacho inválidos.' }, 400);
  }

  // 1. Localizar Detalle_Repuestos
  var detData = detalleSheet.getDataRange().getValues();
  var detRowIndex = -1;
  for (var d = 1; d < detData.length; d++) {
    if (detData[d][0] === lineaId) {
      detRowIndex = d + 1;
      break;
    }
  }
  if (detRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Línea de pedido no encontrada: ' + lineaId }, 404);
  }

  var detRow = detData[detRowIndex - 1];
  var cantAsig = parseInt(detRow[6] || 0, 10);
  var cantDesp = parseInt(detRow[7] || 0, 10);
  var contenedor = detRow[8];
  var pallet = detRow[9];

  if (cantidadDespachar > cantAsig) {
    return jsonResponse({ success: false, error: 'No se puede despachar más de lo asignado (' + cantAsig + ' u.).' }, 400);
  }

  // 2. Localizar DPL_Detalle correspondiente
  var dplData = dplSheet.getDataRange().getValues();
  var dplRowIndex = -1;
  for (var r = 1; r < dplData.length; r++) {
    if (dplData[r][1] === contenedor && dplData[r][2] === pallet && dplData[r][4] === detRow[2]) {
      dplRowIndex = r + 1;
      break;
    }
  }

  // Actualizar Detalle_Repuestos
  var nuevaDesp = cantDesp + cantidadDespachar;
  var remAsig = cantAsig - cantidadDespachar;
  detalleSheet.getRange(detRowIndex, 7).setValue(remAsig);
  detalleSheet.getRange(detRowIndex, 8).setValue(nuevaDesp);
  detalleSheet.getRange(detRowIndex, 13).setValue(remAsig === 0 ? 'Despachado' : 'Asignado Parcial');

  // Si existe en DPL_Detalle, descontar de asignado y sumar a despachado
  if (dplRowIndex !== -1) {
    var rowDpl = dplData[dplRowIndex - 1];
    var tot = parseInt(rowDpl[6] || 0, 10);
    var asigActual = parseInt(rowDpl[7] || 0, 10);
    var despActual = parseInt(rowDpl[8] || 0, 10);

    var nuevoAsig = Math.max(0, asigActual - cantidadDespachar);
    var nuevoDesp = despActual + cantidadDespachar;
    var nuevoSaldo = tot - nuevoAsig - nuevoDesp;

    dplSheet.getRange(dplRowIndex, 8).setValue(nuevoAsig);
    dplSheet.getRange(dplRowIndex, 9).setValue(nuevoDesp);
    dplSheet.getRange(dplRowIndex, 10).setValue(nuevoSaldo);
  }

  // Registrar Auditoría Inmutable
  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'DESPACHO_FISICO',
    entidad: 'Detalle_Repuestos',
    identificador: lineaId,
    valoresAnteriores: JSON.stringify({ cantDespachada: cantDesp, cantAsignada: cantAsig }),
    valoresNuevos: JSON.stringify({ cantDespachada: nuevaDesp, cantAsignada: remAsig, contenedor: contenedor, pallet: pallet }),
    operationId: operationId,
    notas: 'Despacho físico completado hacia sucursal. Responsable: ' + user.nombre
  });

  return jsonResponse({
    success: true,
    message: 'Despacho irreversible registrado en Kardex.',
    lineaId: lineaId,
    cantDespachada: nuevaDesp
  });
}

/**
 * Ajuste de Inventario por Merma, Daño o Rotura en Bahía/Rack
 */
function handleAdjustMerma(ss, payload, user, operationId) {
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var inventarioId = payload.inventarioId;
  var cantidadMerma = parseInt(payload.cantidad || 0, 10);
  var motivo = payload.motivo || 'Deterioro / Merma en almacenamiento';

  if (!inventarioId || cantidadMerma <= 0) {
    return jsonResponse({ success: false, error: 'Parámetros de ajuste inválidos.' }, 400);
  }

  var dplData = dplSheet.getDataRange().getValues();
  var dplRowIndex = -1;
  for (var r = 1; r < dplData.length; r++) {
    if (dplData[r][0] === inventarioId) {
      dplRowIndex = r + 1;
      break;
    }
  }
  if (dplRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Registro de inventario no encontrado.' }, 404);
  }

  var row = dplData[dplRowIndex - 1];
  var total = parseInt(row[6] || 0, 10);
  var asig = parseInt(row[7] || 0, 10);
  var desp = parseInt(row[8] || 0, 10);
  var disponible = total - asig - desp;

  if (disponible < cantidadMerma) {
    return jsonResponse({ success: false, error: 'No se puede mermar más del saldo disponible (' + disponible + ' u.).' }, 409);
  }

  var nuevoTotal = total - cantidadMerma;
  var nuevoSaldo = nuevoTotal - asig - desp;

  dplSheet.getRange(dplRowIndex, 7).setValue(nuevoTotal);
  dplSheet.getRange(dplRowIndex, 10).setValue(nuevoSaldo);

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'AJUSTE_MERMA',
    entidad: 'DPL_Detalle',
    identificador: inventarioId,
    valoresAnteriores: JSON.stringify({ cantidadTotal: total, saldoDisponible: disponible }),
    valoresNuevos: JSON.stringify({ cantidadTotal: nuevoTotal, saldoDisponible: nuevoSaldo }),
    operationId: operationId,
    notas: motivo
  });

  return jsonResponse({
    success: true,
    message: 'Ajuste de merma registrado en Kardex.',
    nuevoSaldo: nuevoSaldo
  });
}

/**
 * Aprobación de Lote Conciliado de Staging hacia Producción
 */
function handleCommitImport(ss, payload, user, operationId) {
  var registrosAprobados = payload.registros || [];
  if (registrosAprobados.length === 0) {
    return jsonResponse({ success: false, error: 'No se proporcionaron registros para importar.' }, 400);
  }

  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var existingPedidos = getColumnValues(cabeceraSheet, 1);
  var existingLineas = getColumnValues(detalleSheet, 1);

  var pedidosAgregados = 0;
  var lineasAgregadas = 0;
  var ahora = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  // Agrupar por pedidoId
  var pedidosMap = {};
  for (var i = 0; i < registrosAprobados.length; i++) {
    var reg = registrosAprobados[i];
    if (!pedidosMap[reg.pedidoId]) {
      pedidosMap[reg.pedidoId] = {
        cabecera: reg,
        lineas: []
      };
    }
    pedidosMap[reg.pedidoId].lineas.push(reg);
  }

  for (var pId in pedidosMap) {
    var item = pedidosMap[pId];
    var cab = item.cabecera;

    // 1. Insertar Cabecera si no existe
    if (existingPedidos.indexOf(pId) === -1) {
      cabeceraSheet.appendRow([
        pId,
        cab.fechaRegistro || ahora,
        cab.sucursal || 'Desconocida',
        cab.colaborador || 'Importación Staging',
        'Conciliación',
        cab.tipoPedido || 'Stock Regular',
        cab.cotizacion || '',
        cab.cliente || '',
        cab.placa || '',
        cab.modelo || '',
        cab.vin || '',
        cab.numeroOR || '',
        'Aprobado',
        '',
        'No',
        'Pendiente',
        'En Proceso CEDIS',
        cab.origenDetectado || 'STAGING_MIGRACION',
        1,
        user.nombre,
        ahora,
        user.nombre,
        ahora,
        'Importado tras resolución de conciliación (Lote ' + operationId + ')'
      ]);
      existingPedidos.push(pId);
      pedidosAgregados++;
    }

    // 2. Insertar Líneas de Detalle
    for (var l = 0; l < item.lineas.length; l++) {
      var lin = item.lineas[l];
      var lineaId = pId + '-L' + (l + 1);

      if (existingLineas.indexOf(lineaId) === -1) {
        detalleSheet.appendRow([
          lineaId,
          pId,
          lin.codigoRepuesto,
          lin.codigoRepuesto,
          lin.descripcion || '',
          parseInt(lin.cantidadSolicitada || 1, 10),
          parseInt(lin.cantidadAsignada || 0, 10),
          0,
          lin.contenedor || '',
          '',
          '',
          lin.ubicacion || '',
          lin.cantidadAsignada > 0 ? 'Asignado' : 'Pendiente'
        ]);
        existingLineas.push(lineaId);
        lineasAgregadas++;
      }
    }
  }

  // Registrar Auditoría Inmutable
  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'IMPORTACION_CONCILIACION',
    entidad: 'Sistema',
    identificador: operationId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ pedidosAgregados: pedidosAgregados, lineasAgregadas: lineasAgregadas }),
    operationId: operationId,
    notas: 'Aprobación de migración staging ejecutada por ' + user.nombre
  });

  return jsonResponse({
    success: true,
    message: 'Conciliación aplicada canónicamente: ' + pedidosAgregados + ' pedidos y ' + lineasAgregadas + ' líneas.',
    pedidosAgregados: pedidosAgregados,
    lineasAgregadas: lineasAgregadas,
    operationId: operationId
  });
}

/**
 * =========================================================================================
 * FUNCIONES AUXILIARES DE BASE DE DATOS Y AUDITORÍA
 * =========================================================================================
 */

function registrarAuditoria(ss, evento) {
  var sheet = getSheetSmart(ss, 'AUDITORIA');
  if (!sheet) {
    sheet = ss.insertSheet('Auditoria_Kardex');
    sheet.appendRow([
      'auditoriaId', 'timestamp', 'usuarioId', 'usuarioNombre', 'accion', 'entidad',
      'identificador', 'valoresAnteriores', 'valoresNuevos', 'operationId', 'notas'
    ]);
    sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
  }
  var auditoriaId = 'AUD-' + Utilities.getUuid();
  var timestamp = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  sheet.appendRow([
    auditoriaId,
    timestamp,
    evento.usuarioId,
    evento.usuarioNombre,
    evento.accion,
    evento.entidad,
    evento.identificador,
    evento.valoresAnteriores || '{}',
    evento.valoresNuevos || '{}',
    evento.operationId,
    evento.notas || ''
  ]);
}

function fueOperacionProcesada(ss, operationId) {
  var sheet = getSheetSmart(ss, 'AUDITORIA');
  if (!sheet) return false;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return false;
  
  // Columna 10 es operationId
  var opValues = sheet.getRange(2, 10, lastRow - 1, 1).getValues();
  for (var i = 0; i < opValues.length; i++) {
    if (opValues[i][0] === operationId) {
      return true;
    }
  }
  return false;
}

function verificarUsuario(email) {
  if (!email) return null;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSmart(ss, 'ENCARGADOS');
  if (!sheet) return null;

  var data = sheet.getDataRange().getValues();
  for (var r = 1; r < data.length; r++) {
    var rowEmail = (data[r][2] || '').toString().trim().toLowerCase();
    var activo = data[r][6];
    if (rowEmail === email && (activo === true || activo === 'Activo' || activo === 'SI' || activo === 'Sí')) {
      return {
        usuarioId: data[r][0],
        nombre: data[r][1],
        correo: rowEmail,
        sucursal: data[r][3],
        canal: data[r][4],
        rol: data[r][5],
        activo: true
      };
    }
  }
  return null;
}

function getColumnValues(sheet, colIndex) {
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  var vals = sheet.getRange(2, colIndex, lastRow - 1, 1).getValues();
  var res = [];
  for (var i = 0; i < vals.length; i++) {
    if (vals[i][0]) res.push(vals[i][0].toString());
  }
  return res;
}

function getSheetObjects(sheet, limit) {
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  var headers = data[0];
  var startRow = 1;
  if (limit && data.length - 1 > limit) {
    startRow = data.length - limit;
  }

  var list = [];
  for (var r = startRow; r < data.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) {
      var val = data[r][c];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, 'GMT-5', 'yyyy-MM-dd HH:mm:ss');
      }
      obj[headers[c]] = val;
    }
    list.push(obj);
  }
  return list;
}

function jsonResponse(obj, statusCode, callback) {
  var output = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + output + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================================
 * INICIALIZADOR AUTOMÁTICO DE HOJA DE CÁLCULO
 * Ejecutar una vez en el editor de Apps Script para crear las 8 pestañas con formato canónico.
 * =========================================================================================
 */
function setupSpreadsheetCanonica() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var headersConfig = [
    {
      sheet: SHEETS.CABECERA,
      headers: [
        'pedidoId', 'fechaCreacion', 'sucursal', 'colaborador', 'canal', 'tipoPedido',
        'cotizacion', 'cliente', 'placa', 'modeloChangan', 'vin', 'numeroOR',
        'estadoPago', 'documentoPagoFactura', 'facturadoFinal', 'estatusGeneral',
        'estatusFabrica', 'origen', 'version', 'creadoPor', 'creadoEn',
        'actualizadoPor', 'actualizadoEn', 'observaciones'
      ]
    },
    {
      sheet: SHEETS.DETALLE,
      headers: [
        'lineaId', 'pedidoId', 'codigoRepuesto', 'codigoActualizado', 'descripcionOficial',
        'cantidadSolicitada', 'cantidadAsignada', 'cantidadDespachada', 'contenedorAsignado',
        'palletAsignado', 'packageNo', 'ubicacionCedis', 'estatusLinea'
      ]
    },
    {
      sheet: SHEETS.MANIFIESTOS,
      headers: [
        'contenedorId', 'proveedor', 'fechaArribo', 'poReferencia', 'tipoTransporte',
        'totalPiezas', 'skusUnicos', 'totalPallets', 'estado', 'creadoPor', 'creadoEn'
      ]
    },
    {
      sheet: SHEETS.DPL_DETALLE,
      headers: [
        'inventarioId', 'contenedorId', 'palletCaseNo', 'packageNo', 'codigoRepuesto',
        'descripcion', 'cantidadTotal', 'cantidadAsignada', 'cantidadDespachada',
        'saldoDisponible', 'ubicacionCedis'
      ]
    },
    {
      sheet: SHEETS.MODELOS,
      headers: [
        'modeloId', 'nombre', 'categoria', 'rangoAnio', 'motor', 'activo', 'notas'
      ]
    },
    {
      sheet: SHEETS.ENCARGADOS,
      headers: [
        'usuarioId', 'nombre', 'correo', 'sucursal', 'canal', 'rol', 'activo', 'movilHabilitado'
      ]
    },
    {
      sheet: SHEETS.AUDITORIA,
      headers: [
        'auditoriaId', 'timestamp', 'usuarioId', 'usuarioNombre', 'accion', 'entidad',
        'identificador', 'valoresAnteriores', 'valoresNuevos', 'operationId', 'notas'
      ]
    }
  ];

  headersConfig.forEach(function(cfg) {
    var sh = ss.getSheetByName(cfg.sheet);
    if (!sh) {
      sh = ss.insertSheet(cfg.sheet);
    }
    if (sh.getLastRow() === 0) {
      sh.appendRow(cfg.headers);
      sh.getRange(1, 1, 1, cfg.headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });

  // Pestaña Derivada Matriz_Central
  var shMatriz = ss.getSheetByName(SHEETS.MATRIZ);
  if (!shMatriz) {
    shMatriz = ss.insertSheet(SHEETS.MATRIZ);
    var matrizHeaders = [
      'pedidoId', 'lineaId', 'fechaCreacion', 'sucursal', 'colaborador', 'tipoPedido',
      'cotizacion', 'cliente', 'modeloChangan', 'vin', 'numeroOR', 'codigoRepuesto',
      'descripcionOficial', 'cantidadSolicitada', 'cantidadAsignada', 'cantidadDespachada',
      'saldoPendiente', 'contenedorAsignado', 'palletAsignado', 'ubicacionCedis',
      'estatusLinea', 'estatusGeneral'
    ];
    shMatriz.appendRow(matrizHeaders);
    shMatriz.getRange(1, 1, 1, matrizHeaders.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#38bdf8');
    shMatriz.setFrozenRows(1);
  }

  // Sembrar Encargados base
  var shEncargados = ss.getSheetByName(SHEETS.ENCARGADOS);
  if (shEncargados.getLastRow() === 1) {
    shEncargados.appendRow(['USR-001', 'Administrador CEDIS', 'visionluxe58@gmail.com', 'Bodega Central', 'CEDIS', 'ADMINISTRADOR_CEDIS', true, true]);
    shEncargados.appendRow(['USR-002', 'Operador Bodega CEDIS', 'operaciones.cedis@changanpanama.com', 'Bodega Central', 'CEDIS', 'OPERADOR_CEDIS', true, true]);
    shEncargados.appendRow(['USR-003', 'Leidys Perez', 'repuestos@changanpanama.com', 'Villa Lucre', 'Mostrador', 'SUCURSAL_ASESOR', true, true]);
    shEncargados.appendRow(['USR-004', 'Edwin Blanco', 'repuestos.vl@changanpanama.com', 'Villa Lucre', 'Chapistería', 'SUCURSAL_ASESOR', true, true]);
    shEncargados.appendRow(['USR-005', 'Carlos Mendoza', 'taller.costaverde@changanpanama.com', 'Costa Verde', 'Taller', 'SUCURSAL_ASESOR', true, true]);
    shEncargados.appendRow(['USR-006', 'Valeria Castillo', 'garantias@changanpanama.com', 'Calle 50', 'Garantías', 'SUCURSAL_ASESOR', true, true]);
    shEncargados.appendRow(['USR-007', 'Alexis Rios', 'repuestos.tm@changanpanama.com', 'Tumba Muerto', 'Colisión', 'SUCURSAL_ASESOR', true, true]);
  }

  Logger.log('Configuración de Google Sheets CEDIS Changan finalizada con éxito.');
}
