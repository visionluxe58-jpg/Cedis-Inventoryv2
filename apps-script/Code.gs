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
    var action = params.action || (params.userEmail ? 'getInitialData' : 'healthCheck');
    var userEmail = (params.userEmail || params.correo || params.email || 'visionluxe58@gmail.com').trim().toLowerCase();
    var callback = params.callback;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetsList = ss.getSheets().map(function(s) { return s.getName(); });

    if (action === 'healthCheck' || action === 'ping') {
      return jsonResponse({
        success: true,
        status: 'OK',
        mensaje: 'API Google Apps Script CEDIS Changan operativa y conectada a Google Sheets.',
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
      var auditoria = getSheetObjects(getSheetSmart(ss, 'AUDITORIA'), 150);
      var shMatriz = getSheetSmart(ss, 'MATRIZ');
      var matriz = shMatriz ? getSheetObjects(shMatriz) : [];

      // Si no existen cabeceras separadas pero existe Matriz_Central poblada:
      if ((!cabeceras || cabeceras.length === 0) && matriz && matriz.length > 0) {
        var mapCab = {};
        var arrDet = [];
        for (var m = 0; m < matriz.length; m++) {
          var r = matriz[m];
                    var pId = r.pedidoId || r['Pedido_ID'] || r['ID Pedido'] || r['pedidoId'] || ('PED-' + (m + 1));
          var linId = r.lineaId || r['Linea_ID'] || ('LIN-' + (m + 1));
          var cli = r.cliente || r['Cliente'] || r['cliente'] || '';
          var suc = r.sucursal || r['Sucursal'] || r['Sucursal Solicitante'] || 'Bodega Central';
          var col = r.colaborador || r['Colaborador_Asesor'] || r['Colaborador'] || 'Usuario CEDIS';
          var tip = r.tipoPedido || r['Tipo_Solicitud_Prioridad'] || r['Tipo Pedido'] || 'Especial';
          var fch = r.fechaCreacion || r['Fecha_Creacion'] || r['Fecha Registro'] || r['fechaRegistro'] || new Date().toISOString();
          var mod = r.modeloChangan || r['Modelo_Changan'] || r['Modelo Changan'] || r['modelo'] || '';
          var vinVal = r.vin || r['VIN_Chasis'] || r['VIN'] || '';
          var plc = r.placa || r['Placa'] || '';
          var nor = r.numeroOR || r['Numero_OR'] || r['N° OR'] || '';
          var cot = r.cotizacion || r['Cotizacion'] || r['Cotización'] || nor || '';
          var codRep = r.codigoRepuesto || r['Codigo_Repuesto_OEM'] || r['Código Repuesto'] || r['Codigo Repuesto'] || '';
          var codAct = r.codigoActualizado || r['Codigo_Actualizado'] || r['Código Actualizado'] || codRep;
          var descOf = r.descripcionOficial || r['Descripcion_Oficial'] || r['Descripción Oficial'] || r['Descripcion Oficial'] || '';
          var cSol = Number(r.cantidadSolicitada || r['Cantidad_Solicitada'] || r['Cant Solicitada'] || r['Cantidad Solicitada']) || 1;
          var cAsig = Number(r.cantidadAsignada || r['Cantidad_Asignada'] || r['Cant Asignada'] || r['Cantidad Asignada']) || 0;
          var cDesp = Number(r.cantidadDespachada || r['Cantidad_Despachada'] || r['Cant Despachada'] || r['Cantidad Despachada']) || 0;
          var sPend = Number(r.saldoPendiente || r['Saldo_Pendiente'] || r['Saldo Pendiente']) || Math.max(0, cSol - cAsig - cDesp);
          var estL = r.estatusLinea || r['Estatus_Linea'] || r['Estatus Línea'] || r['Estatus Linea'] || 'PENDIENTE';
          var estG = r.estatusGeneral || r['Estatus General'] || r['Estado General'] || estL;
          var cAsignado = r.contenedorAsignado || r['Contenedor_Asignado'] || r['Contenedor Asignado'] || '';
          var pAsignado = r.palletAsignado || r['Pallet_Asignado'] || r['Pallet Asignado'] || '';
          var pkgNo = r.packageNo || r['Package_No'] || r['N° Paquete'] || r['Package No'] || '';
          var ubi = r.ubicacionCedis || r['Ubicacion_CEDIS'] || r['Ubicación CEDIS'] || r['Ubicacion CEDIS'] || '';

          if (!mapCab[pId]) {
            mapCab[pId] = {
              pedidoId: pId,
              tipoPedido: tip,
              fechaCreacion: fch,
              sucursal: suc,
              colaborador: col,
              cliente: cli,
              modeloChangan: mod,
              vin: vinVal,
              placa: plc,
              cotizacion: cot,
              estatusGeneral: estG,
              version: 1
            };
          }
          arrDet.push({
            lineaId: r.lineaId || ('LIN-' + (m + 1)),
            pedidoId: pId,
            codigoRepuesto: codRep,
            codigoActualizado: codAct,
            descripcionOficial: descOf,
            cantidadSolicitada: cSol,
            cantidadAsignada: cAsig,
            cantidadDespachada: cDesp,
            saldoPendiente: sPend,
            estatusLinea: estL,
            contenedorAsignado: cAsignado,
            palletAsignado: pAsignado,
            packageNo: pkgNo,
            ubicacionCedis: ubi
          });
        }
        cabeceras = [];
        for (var k in mapCab) {
          if (mapCab.hasOwnProperty(k)) cabeceras.push(mapCab[k]);
        }
        detalles = arrDet;
      }

      return jsonResponse({
        success: true,
        data: {
          cabeceras: cabeceras,
          detalles: detalles,
          matriz: matriz,
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

    if (action === 'getNotasPedido') {
      var pedidoId = params.pedidoId;
      if (!pedidoId) {
        return jsonResponse({ success: false, error: 'Parámetro pedidoId es obligatorio' }, 400);
      }
      var audAll = getSheetObjects(getSheetSmart(ss, 'AUDITORIA'), 500);
      var notas = [];
      for (var a = 0; a < audAll.length; a++) {
        if (audAll[a].identificador === pedidoId && audAll[a].accion === 'NOTA_PEDIDO') {
          var payloadVal = {};
          try { payloadVal = JSON.parse(audAll[a].valoresNuevos || '{}'); } catch(e) {}
          notas.push({
            id: audAll[a].auditoriaId,
            pedidoId: pedidoId,
            autor: audAll[a].usuarioNombre,
            fecha: audAll[a].timestamp,
            categoria: payloadVal.categoria || 'Nota General',
            texto: payloadVal.texto || audAll[a].notas || ''
          });
        }
      }
      return jsonResponse({ success: true, data: notas });
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
    var userEmail = (payload.userEmail || payload.correo || payload.email || 'visionluxe58@gmail.com').trim().toLowerCase();
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
    else if (action === 'updatePedido') {
      return handleUpdatePedido(ss, payload, user, operationId);
    }
    else if (action === 'changePedidoStatus') {
      return handleChangePedidoStatus(ss, payload, user, operationId);
    }
    else if (action === 'deletePedido') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para eliminar pedidos.' }, 403);
      }
      return handleDeletePedido(ss, payload, user, operationId);
    }
    else if (action === 'bulkDeletePedidos') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para eliminar pedidos masivos.' }, 403);
      }
      return handleBulkDeletePedidos(ss, payload, user, operationId);
    }
    else if (action === 'bulkUpdatePedidos') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para actualizar pedidos masivos.' }, 403);
      }
      return handleBulkUpdatePedidos(ss, payload, user, operationId);
    }
    else if (action === 'importManifiestoDPL') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para importar manifiesto DPL.' }, 403);
      }
      return handleImportManifiestoDPL(ss, payload, user, operationId);
    }
    else if (action === 'updateManifiestoStatus') {
      if (user.rol !== ROLES.ADMIN && user.rol !== ROLES.OPERADOR) {
        return jsonResponse({ success: false, error: 'Permisos insuficientes para cambiar estatus de contenedor DPL.' }, 403);
      }
      return handleUpdateManifiestoStatus(ss, payload, user, operationId);
    }
    else if (action === 'bulkImportPedidos') {
      return handleBulkImportPedidos(ss, payload, user, operationId);
    }
    else if (action === 'bulkUploadMatriz') {
      return handleBulkUploadMatriz(ss, payload, user, operationId);
    }
    else if (action === 'addPedidoNota') {
      return handleAddPedidoNota(ss, payload, user, operationId);
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
 * Actualiza un pedido en Solicitudes_Cabecera y sus líneas en Detalle_Repuestos
 */
function handleUpdatePedido(ss, payload, user, operationId) {
  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var pedidoId = payload.pedidoId;
  var cab = payload.datosCabecera || payload.cabecera || {};
  var repuestos = payload.repuestos || payload.items;
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  if (!pedidoId) {
    return jsonResponse({ success: false, error: 'pedidoId es obligatorio.' }, 400);
  }

  var cabData = cabeceraSheet.getDataRange().getValues();
  var cabRowIndex = -1;
  for (var r = 1; r < cabData.length; r++) {
    if (cabData[r][0] === pedidoId) {
      cabRowIndex = r + 1;
      break;
    }
  }
  if (cabRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Pedido ' + pedidoId + ' no encontrado en cabecera.' }, 404);
  }

  var oldRow = cabData[cabRowIndex - 1];
  var prevVersion = parseInt(oldRow[18] || 1, 10);

  // Actualizar columnas de cabecera
  if (cab.sucursal !== undefined) cabeceraSheet.getRange(cabRowIndex, 3).setValue(cab.sucursal);
  if (cab.colaborador !== undefined) cabeceraSheet.getRange(cabRowIndex, 4).setValue(cab.colaborador);
  if (cab.canal !== undefined) cabeceraSheet.getRange(cabRowIndex, 5).setValue(cab.canal);
  if (cab.tipoPedido !== undefined) cabeceraSheet.getRange(cabRowIndex, 6).setValue(cab.tipoPedido);
  if (cab.cotizacion !== undefined) cabeceraSheet.getRange(cabRowIndex, 7).setValue(cab.cotizacion);
  if (cab.cliente !== undefined) cabeceraSheet.getRange(cabRowIndex, 8).setValue(cab.cliente);
  if (cab.placa !== undefined) cabeceraSheet.getRange(cabRowIndex, 9).setValue(cab.placa);
  if (cab.modeloChangan !== undefined) cabeceraSheet.getRange(cabRowIndex, 10).setValue(cab.modeloChangan);
  if (cab.vin !== undefined) cabeceraSheet.getRange(cabRowIndex, 11).setValue(cab.vin);
  if (cab.numeroOR !== undefined) cabeceraSheet.getRange(cabRowIndex, 12).setValue(cab.numeroOR);
  if (cab.estadoPago !== undefined) cabeceraSheet.getRange(cabRowIndex, 13).setValue(cab.estadoPago);
  if (cab.documentoPagoFactura !== undefined) cabeceraSheet.getRange(cabRowIndex, 14).setValue(cab.documentoPagoFactura);
  if (cab.facturadoFinal !== undefined) cabeceraSheet.getRange(cabRowIndex, 15).setValue(cab.facturadoFinal);
  if (cab.estatusGeneral !== undefined) cabeceraSheet.getRange(cabRowIndex, 16).setValue(cab.estatusGeneral);
  if (cab.observaciones !== undefined) cabeceraSheet.getRange(cabRowIndex, 24).setValue(cab.observaciones);

  cabeceraSheet.getRange(cabRowIndex, 19).setValue(prevVersion + 1);
  cabeceraSheet.getRange(cabRowIndex, 22).setValue(user.nombre);
  cabeceraSheet.getRange(cabRowIndex, 23).setValue(now);

  // Si se enviaron repuestos, reemplazar las líneas de detalle
  if (repuestos && repuestos.length > 0) {
    var detData = detalleSheet.getDataRange().getValues();
    for (var d = detData.length - 1; d >= 1; d--) {
      if (detData[d][1] === pedidoId) {
        detalleSheet.deleteRow(d + 1);
      }
    }
    for (var i = 0; i < repuestos.length; i++) {
      var rep = repuestos[i];
      var lineaId = rep.lineaId || (pedidoId + '-L' + (i + 1));
      detalleSheet.appendRow([
        lineaId,
        pedidoId,
        (rep.codigoRepuesto || '').toString().trim().toUpperCase(),
        (rep.codigoActualizado || rep.codigoRepuesto || '').toString().trim().toUpperCase(),
        rep.descripcionOficial || 'Repuesto genuino Changan',
        parseInt(rep.cantidadSolicitada || 1, 10),
        parseInt(rep.cantidadAsignada || 0, 10),
        parseInt(rep.cantidadDespachada || 0, 10),
        rep.contenedorAsignado || '',
        rep.palletAsignado || '',
        rep.packageNo || '',
        rep.ubicacionCedis || '',
        rep.estatusLinea || (parseInt(rep.cantidadAsignada || 0, 10) > 0 ? 'Asignado' : 'Pendiente')
      ]);
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'MODIFICACION_PEDIDO',
    entidad: 'Solicitudes_Cabecera',
    identificador: pedidoId,
    valoresAnteriores: JSON.stringify(oldRow),
    valoresNuevos: JSON.stringify(cab),
    operationId: operationId,
    notas: 'Pedido ' + pedidoId + ' actualizado por ' + user.nombre
  });

  return jsonResponse({
    success: true,
    pedidoId: pedidoId,
    message: 'Pedido ' + pedidoId + ' actualizado canónicamente.'
  });
}

/**
 * Cambia el estatus general de un pedido y alinea el detalle de repuestos
 */
function handleChangePedidoStatus(ss, payload, user, operationId) {
  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var pedidoId = payload.pedidoId;
  var nuevoEstatus = payload.nuevoEstatus || payload.estatus;
  var nota = payload.notaBitacora || payload.nota;
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  if (!pedidoId || !nuevoEstatus) {
    return jsonResponse({ success: false, error: 'pedidoId y nuevoEstatus son requeridos.' }, 400);
  }

  var cabData = cabeceraSheet.getDataRange().getValues();
  var cabRowIndex = -1;
  for (var r = 1; r < cabData.length; r++) {
    if (cabData[r][0] === pedidoId) {
      cabRowIndex = r + 1;
      break;
    }
  }
  if (cabRowIndex === -1) {
    return jsonResponse({ success: false, error: 'Pedido ' + pedidoId + ' no encontrado.' }, 404);
  }

  var anterior = cabData[cabRowIndex - 1][15];
  cabeceraSheet.getRange(cabRowIndex, 16).setValue(nuevoEstatus);
  cabeceraSheet.getRange(cabRowIndex, 22).setValue(user.nombre);
  cabeceraSheet.getRange(cabRowIndex, 23).setValue(now);

  if (nuevoEstatus.toUpperCase().indexOf('DESPACH') !== -1) {
    var detData = detalleSheet.getDataRange().getValues();
    for (var d = 1; d < detData.length; d++) {
      if (detData[d][1] === pedidoId) {
        detalleSheet.getRange(d + 1, 13).setValue('Despachado');
      }
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'CAMBIO_ESTATUS',
    entidad: 'Solicitudes_Cabecera',
    identificador: pedidoId,
    valoresAnteriores: JSON.stringify({ estatusGeneral: anterior }),
    valoresNuevos: JSON.stringify({ estatusGeneral: nuevoEstatus }),
    operationId: operationId,
    notas: nota || ('Cambio de estatus de ' + anterior + ' a ' + nuevoEstatus)
  });

  return jsonResponse({
    success: true,
    pedidoId: pedidoId,
    nuevoEstatus: nuevoEstatus,
    message: 'Estatus de pedido ' + pedidoId + ' actualizado a ' + nuevoEstatus
  });
}

/**
 * Elimina un pedido individual y libera el stock asignado en DPL_Detalle
 */
function handleDeletePedido(ss, payload, user, operationId) {
  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var pedidoId = payload.pedidoId;

  if (!pedidoId) {
    return jsonResponse({ success: false, error: 'pedidoId es requerido.' }, 400);
  }

  var detData = detalleSheet.getDataRange().getValues();
  var dplData = dplSheet.getDataRange().getValues();

  for (var d = detData.length - 1; d >= 1; d--) {
    if (detData[d][1] === pedidoId) {
      var cantAsig = parseInt(detData[d][6] || 0, 10);
      var contenedor = detData[d][8];
      var pallet = detData[d][9];
      var cod = detData[d][2];

      if (cantAsig > 0 && contenedor && pallet) {
        for (var r = 1; r < dplData.length; r++) {
          if (dplData[r][1] === contenedor && dplData[r][2] === pallet && dplData[r][4] === cod) {
            var curTot = parseInt(dplData[r][6] || 0, 10);
            var curAsig = parseInt(dplData[r][7] || 0, 10);
            var curDesp = parseInt(dplData[r][8] || 0, 10);
            var nuevaAsig = Math.max(0, curAsig - cantAsig);
            var nuevoSaldo = curTot - nuevaAsig - curDesp;
            dplSheet.getRange(r + 1, 8).setValue(nuevaAsig);
            dplSheet.getRange(r + 1, 10).setValue(nuevoSaldo);
            dplData[r][7] = nuevaAsig;
            dplData[r][9] = nuevoSaldo;
            break;
          }
        }
      }
      detalleSheet.deleteRow(d + 1);
    }
  }

  var cabData = cabeceraSheet.getDataRange().getValues();
  for (var c = cabData.length - 1; c >= 1; c--) {
    if (cabData[c][0] === pedidoId) {
      cabeceraSheet.deleteRow(c + 1);
      break;
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'ELIMINACION_PEDIDO',
    entidad: 'Solicitudes_Cabecera',
    identificador: pedidoId,
    valoresAnteriores: JSON.stringify({ pedidoId: pedidoId }),
    valoresNuevos: 'ELIMINADO',
    operationId: operationId,
    notas: 'Pedido ' + pedidoId + ' eliminado permanentemente y stock liberado.'
  });

  return jsonResponse({
    success: true,
    pedidoId: pedidoId,
    message: 'Pedido ' + pedidoId + ' eliminado y stock liberado correctamente.'
  });
}

/**
 * Eliminación Masiva de Pedidos con liberación de stock
 */
function handleBulkDeletePedidos(ss, payload, user, operationId) {
  var pedidoIds = payload.pedidoIds || [];
  if (!pedidoIds || pedidoIds.length === 0) {
    return jsonResponse({ success: false, error: 'Lista de pedidoIds vacía.' }, 400);
  }

  var idSet = {};
  for (var i = 0; i < pedidoIds.length; i++) {
    idSet[pedidoIds[i]] = true;
  }

  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');

  var detData = detalleSheet.getDataRange().getValues();
  var dplData = dplSheet.getDataRange().getValues();

  for (var d = detData.length - 1; d >= 1; d--) {
    if (idSet[detData[d][1]]) {
      var cantAsig = parseInt(detData[d][6] || 0, 10);
      var contenedor = detData[d][8];
      var pallet = detData[d][9];
      var cod = detData[d][2];

      if (cantAsig > 0 && contenedor && pallet) {
        for (var r = 1; r < dplData.length; r++) {
          if (dplData[r][1] === contenedor && dplData[r][2] === pallet && dplData[r][4] === cod) {
            var curTot = parseInt(dplData[r][6] || 0, 10);
            var curAsig = parseInt(dplData[r][7] || 0, 10);
            var curDesp = parseInt(dplData[r][8] || 0, 10);
            var nuevaAsig = Math.max(0, curAsig - cantAsig);
            var nuevoSaldo = curTot - nuevaAsig - curDesp;
            dplSheet.getRange(r + 1, 8).setValue(nuevaAsig);
            dplSheet.getRange(r + 1, 10).setValue(nuevoSaldo);
            dplData[r][7] = nuevaAsig;
            dplData[r][9] = nuevoSaldo;
            break;
          }
        }
      }
      detalleSheet.deleteRow(d + 1);
    }
  }

  var cabData = cabeceraSheet.getDataRange().getValues();
  var eliminados = 0;
  for (var c = cabData.length - 1; c >= 1; c--) {
    if (idSet[cabData[c][0]]) {
      cabeceraSheet.deleteRow(c + 1);
      eliminados++;
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'ELIMINACION_MASIVA',
    entidad: 'Solicitudes_Cabecera',
    identificador: 'LOTE-' + eliminados + '-PEDIDOS',
    valoresAnteriores: JSON.stringify(pedidoIds),
    valoresNuevos: 'ELIMINADOS_MASIVO',
    operationId: operationId,
    notas: 'Eliminación masiva de ' + eliminados + ' pedidos ejecutada por ' + user.nombre
  });

  return jsonResponse({
    success: true,
    totalEliminados: eliminados,
    message: 'Se eliminaron ' + eliminados + ' pedidos y se liberó el stock comprometido.'
  });
}

/**
 * Edición Masiva de Pedidos Seleccionados
 */
function handleBulkUpdatePedidos(ss, payload, user, operationId) {
  var pedidoIds = payload.pedidoIds || [];
  var cambios = payload.cambios || {};
  if (!pedidoIds || pedidoIds.length === 0) {
    return jsonResponse({ success: false, error: 'Lista de pedidoIds vacía.' }, 400);
  }

  var idSet = {};
  for (var i = 0; i < pedidoIds.length; i++) {
    idSet[pedidoIds[i]] = true;
  }

  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');
  var cabData = cabeceraSheet.getDataRange().getValues();
  var count = 0;

  for (var r = 1; r < cabData.length; r++) {
    var pId = cabData[r][0];
    if (idSet[pId]) {
      count++;
      var rowIdx = r + 1;
      if (cambios.estatusGeneral && cambios.estatusGeneral !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 16).setValue(cambios.estatusGeneral);
      }
      if (cambios.sucursal && cambios.sucursal !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 3).setValue(cambios.sucursal);
      }
      if (cambios.tipoPedido && cambios.tipoPedido !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 6).setValue(cambios.tipoPedido);
      }
      if (cambios.estadoPago && cambios.estadoPago !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 13).setValue(cambios.estadoPago);
      }
      if (cambios.colaborador && cambios.colaborador !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 4).setValue(cambios.colaborador);
      }
      if (cambios.canal && cambios.canal !== 'SIN_CAMBIO') {
        cabeceraSheet.getRange(rowIdx, 5).setValue(cambios.canal);
      }
      cabeceraSheet.getRange(rowIdx, 22).setValue(user.nombre);
      cabeceraSheet.getRange(rowIdx, 23).setValue(now);
    }
  }

  if (cambios.estatusGeneral && cambios.estatusGeneral.toUpperCase().indexOf('DESPACH') !== -1) {
    var detData = detalleSheet.getDataRange().getValues();
    for (var d = 1; d < detData.length; d++) {
      if (idSet[detData[d][1]]) {
        detalleSheet.getRange(d + 1, 13).setValue('Despachado');
      }
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'MODIFICACION_MASIVA',
    entidad: 'Solicitudes_Cabecera',
    identificador: 'LOTE-' + count + '-PEDIDOS',
    valoresAnteriores: '',
    valoresNuevos: JSON.stringify(cambios),
    operationId: operationId,
    notas: 'Edición masiva de ' + count + ' pedidos.'
  });

  return jsonResponse({
    success: true,
    totalActualizados: count,
    message: count + ' pedidos actualizados correctamente.'
  });
}

/**
 * Importación de Manifiesto DPL con lotes de inventario
 */
function handleImportManifiestoDPL(ss, payload, user, operationId) {
  var manSheet = getSheetSmart(ss, 'MANIFIESTOS');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  var manifiesto = payload.manifiesto || payload;
  var items = payload.items || payload.filas || [];
  var contId = (manifiesto.contenedorId || '').trim().toUpperCase();

  if (!contId || items.length === 0) {
    return jsonResponse({ success: false, error: 'contenedorId e items son obligatorios.' }, 400);
  }

  var manData = manSheet.getDataRange().getValues();
  var manRowIndex = -1;
  for (var m = 1; m < manData.length; m++) {
    if ((manData[m][0] || '').toString().trim().toUpperCase() === contId) {
      manRowIndex = m + 1;
      break;
    }
  }

  var estado = (manifiesto.estado || 'EN TRÁNSITO').trim().toUpperCase();
  var totalPiezas = items.reduce(function(acc, it) { return acc + (parseInt(it.cantidadTotal || it.qty || 1, 10)); }, 0);
  var skus = {};
  var pallets = {};
  for (var k = 0; k < items.length; k++) {
    skus[(items[k].codigoRepuesto || '').toUpperCase()] = true;
    pallets[items[k].palletCaseNo || items[k].pallet || 'P001'] = true;
  }

  if (manRowIndex !== -1) {
    manSheet.getRange(manRowIndex, 2).setValue(manifiesto.proveedor || 'Mobitech Changan China Co., Ltd');
    manSheet.getRange(manRowIndex, 3).setValue(manifiesto.fechaArribo || now.split(' ')[0]);
    manSheet.getRange(manRowIndex, 6).setValue(totalPiezas);
    manSheet.getRange(manRowIndex, 7).setValue(Object.keys(skus).length);
    manSheet.getRange(manRowIndex, 8).setValue(Object.keys(pallets).length);
    manSheet.getRange(manRowIndex, 9).setValue(estado);
  } else {
    manSheet.appendRow([
      contId,
      manifiesto.proveedor || 'Mobitech Changan China Co., Ltd',
      manifiesto.fechaArribo || now.split(' ')[0],
      manifiesto.poReferencia || ('PO-' + contId),
      manifiesto.tipoTransporte || 'Marítimo 40HQ',
      totalPiezas,
      Object.keys(skus).length,
      Object.keys(pallets).length,
      estado,
      user.nombre,
      now
    ]);
  }

  // Sobrescribir lotes anteriores de este contenedor en DPL_Detalle
  var dplData = dplSheet.getDataRange().getValues();
  for (var d = dplData.length - 1; d >= 1; d--) {
    if ((dplData[d][1] || '').toString().trim().toUpperCase() === contId) {
      dplSheet.deleteRow(d + 1);
    }
  }

  // Insertar nuevos lotes
  for (var j = 0; j < items.length; j++) {
    var it = items[j];
    var cantTot = parseInt(it.cantidadTotal || it.qty || 1, 10);
    var invId = it.inventarioId || ('INV-' + contId + '-' + (j + 1));
    dplSheet.appendRow([
      invId,
      contId,
      it.palletCaseNo || it.pallet || 'P001',
      it.packageNo || 'PKG-01',
      (it.codigoRepuesto || '').toString().trim().toUpperCase(),
      it.descripcion || 'Repuesto Genuino Changan',
      cantTot,
      0, // cantAsignada
      0, // cantDespachada
      cantTot, // saldoDisponible
      it.ubicacionCedis || (estado === 'RECIBIDO' ? 'Bahía Central CEDIS' : 'En Tránsito Marítimo')
    ]);
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'IMPORTACION_DPL',
    entidad: 'DPL_Manifiestos',
    identificador: contId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ contenedorId: contId, lineas: items.length, totalPiezas: totalPiezas }),
    operationId: operationId,
    notas: 'Importación de contenedor DPL ' + contId + ' (' + estado + ')'
  });

  return jsonResponse({
    success: true,
    contenedorId: contId,
    totalLineas: items.length,
    totalPiezas: totalPiezas,
    message: 'Manifiesto DPL ' + contId + ' importado con éxito.'
  });
}

/**
 * Actualiza el estatus de un contenedor DPL (EN TRÁNSITO, ADUANA, RECIBIDO)
 */
function handleUpdateManifiestoStatus(ss, payload, user, operationId) {
  var manSheet = getSheetSmart(ss, 'MANIFIESTOS');
  var dplSheet = getSheetSmart(ss, 'DPL_DETALLE');
  var contId = (payload.contenedorId || '').trim().toUpperCase();
  var nuevoEstado = (payload.nuevoEstado || payload.estado || '').trim().toUpperCase();

  if (!contId || !nuevoEstado) {
    return jsonResponse({ success: false, error: 'contenedorId y nuevoEstado son requeridos.' }, 400);
  }

  var manData = manSheet.getDataRange().getValues();
  var manRowIndex = -1;
  for (var m = 1; m < manData.length; m++) {
    if ((manData[m][0] || '').toString().trim().toUpperCase() === contId) {
      manRowIndex = m + 1;
      break;
    }
  }

  if (manRowIndex !== -1) {
    manSheet.getRange(manRowIndex, 9).setValue(nuevoEstado);
  }

  // Actualizar descripciones de ubicación en DPL_Detalle
  var dplData = dplSheet.getDataRange().getValues();
  for (var d = 1; d < dplData.length; d++) {
    if ((dplData[d][1] || '').toString().trim().toUpperCase() === contId) {
      var ubi = 'Bahía Central CEDIS';
      if (nuevoEstado === 'EN TRÁNSITO') ubi = 'En Tránsito Marítimo / Altamar';
      else if (nuevoEstado === 'ADUANA') ubi = 'Aduana / Puerto Balboa';
      dplSheet.getRange(d + 1, 11).setValue(ubi);
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'CAMBIO_ESTATUS_DPL',
    entidad: 'DPL_Manifiestos',
    identificador: contId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ estado: nuevoEstado }),
    operationId: operationId,
    notas: 'Estatus de contenedor ' + contId + ' cambiado a ' + nuevoEstado
  });

  return jsonResponse({
    success: true,
    contenedorId: contId,
    nuevoEstado: nuevoEstado,
    message: 'Estatus de contenedor ' + contId + ' actualizado a ' + nuevoEstado
  });
}

/**
 * Importación Masiva de Pedidos desde plantilla Excel/CSV
 */
function handleBulkImportPedidos(ss, payload, user, operationId) {
  var cabeceraSheet = getSheetSmart(ss, 'CABECERA');
  var detalleSheet = getSheetSmart(ss, 'DETALLE');
  var pedidos = payload.pedidos || [];
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  if (!pedidos || pedidos.length === 0) {
    return jsonResponse({ success: false, error: 'No se enviaron pedidos para importar.' }, 400);
  }

  var existingIds = getColumnValues(cabeceraSheet, 1);
  var agregados = 0;
  var lineasCount = 0;

  for (var i = 0; i < pedidos.length; i++) {
    var p = pedidos[i];
    var cab = p.cabecera || p;
    var items = p.items || [];

    if (existingIds.indexOf(cab.pedidoId) !== -1) {
      continue;
    }

    cabeceraSheet.appendRow([
      cab.pedidoId,
      cab.fechaCreacion || now,
      cab.sucursal || user.sucursal,
      cab.colaborador || user.nombre,
      cab.canal || 'Mostrador',
      cab.tipoPedido || 'Stock Regular',
      cab.cotizacion || '',
      cab.cliente || '',
      cab.placa || '',
      cab.modeloChangan || '',
      cab.vin || '',
      cab.numeroOR || '',
      cab.estadoPago || 'Pendiente',
      cab.documentoPagoFactura || '',
      cab.facturadoFinal || 'No',
      cab.estatusGeneral || 'Pendiente',
      cab.estatusFabrica || 'En Proceso CEDIS',
      cab.origen || 'EXCEL',
      1,
      user.nombre,
      now,
      user.nombre,
      now,
      cab.observaciones || 'Importado masivamente vía Excel'
    ]);
    existingIds.push(cab.pedidoId);
    agregados++;

    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var lineaId = it.lineaId || (cab.pedidoId + '-L' + (j + 1));
      detalleSheet.appendRow([
        lineaId,
        cab.pedidoId,
        (it.codigoRepuesto || it.codigo || '').toString().trim().toUpperCase(),
        (it.codigoActualizado || it.codigoRepuesto || it.codigo || '').toString().trim().toUpperCase(),
        it.descripcionOficial || it.descripcion || 'Repuesto Genuino Changan',
        parseInt(it.cantidadSolicitada || it.cantidad || 1, 10),
        parseInt(it.cantidadAsignada || 0, 10),
        parseInt(it.cantidadDespachada || 0, 10),
        it.contenedorAsignado || '',
        it.palletAsignado || '',
        it.packageNo || '',
        it.ubicacionCedis || '',
        it.estatusLinea || 'Pendiente'
      ]);
      lineasCount++;
    }
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'IMPORTACION_MASIVA_PEDIDOS',
    entidad: 'Solicitudes_Cabecera',
    identificador: 'LOTE-' + agregados + '-PEDIDOS',
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ pedidosAgregados: agregados, lineasAgregadas: lineasCount }),
    operationId: operationId,
    notas: 'Importación masiva de ' + agregados + ' pedidos y ' + lineasCount + ' líneas.'
  });

  return jsonResponse({
    success: true,
    pedidosCreados: agregados,
    lineasCreadas: lineasCount,
    message: 'Se importaron ' + agregados + ' pedidos con ' + lineasCount + ' líneas exitosamente.'
  });
}

/**
 * Carga directa y actualización de la pestaña derivada Matriz_Central
 */
function handleBulkUploadMatriz(ss, payload, user, operationId) {
  var rows = payload.rows || [];
  var shMatriz = ss.getSheetByName(SHEETS.MATRIZ);
  if (!shMatriz) {
    shMatriz = ss.insertSheet(SHEETS.MATRIZ);
  }

  var matrizHeaders = [
    'pedidoId', 'tipoPedido', 'fechaCreacion', 'sucursal', 'colaborador',
    'cliente', 'modeloChangan', 'vin', 'cotizacion/numeroOR', 'codigoRepuesto',
    'descripcionOficial', 'cantidadSolicitada', 'cantidadAsignada', 'estatusDetallado',
    'contenedorAsignado', 'palletAsignado', 'packageNo', 'observaciones'
  ];

  shMatriz.clearContents();
  shMatriz.appendRow(matrizHeaders);
  shMatriz.getRange(1, 1, 1, matrizHeaders.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');

  if (rows.length > 0) {
    shMatriz.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'SINCRONIZACION_MATRIZ',
    entidad: 'Matriz_Central',
    identificador: operationId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({ totalFilas: rows.length }),
    operationId: operationId,
    notas: 'Sincronización de ' + rows.length + ' filas en Matriz_Central.'
  });

  return jsonResponse({
    success: true,
    totalFilas: rows.length,
    message: 'Matriz_Central actualizada con ' + rows.length + ' filas.'
  });
}

/**
 * Registra una nota de bitácora para un expediente de pedido
 */
function handleAddPedidoNota(ss, payload, user, operationId) {
  var pedidoId = payload.pedidoId;
  var texto = payload.texto;
  var categoria = payload.categoria || 'Nota General';
  var now = Utilities.formatDate(new Date(), 'GMT-5', 'yyyy-MM-dd HH:mm:ss');

  if (!pedidoId || !texto) {
    return jsonResponse({ success: false, error: 'pedidoId y texto son requeridos.' }, 400);
  }

  var notaId = 'NOTA-' + Utilities.getUuid();

  registrarAuditoria(ss, {
    usuarioId: user.usuarioId,
    usuarioNombre: user.nombre,
    accion: 'NOTA_PEDIDO',
    entidad: 'Bitacora_Notas',
    identificador: pedidoId,
    valoresAnteriores: '{}',
    valoresNuevos: JSON.stringify({
      id: notaId,
      texto: texto,
      categoria: categoria,
      autor: user.nombre,
      sucursal: user.sucursal,
      fecha: now
    }),
    operationId: operationId,
    notas: texto
  });

  return jsonResponse({
    success: true,
    notaId: notaId,
    message: 'Nota agregada exitosamente a la bitácora canónica.'
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
  var emailNorm = email.toString().trim().toLowerCase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSheetSmart(ss, 'ENCARGADOS');
  if (sheet) {
    var data = sheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      var rowEmail = (data[r][2] || '').toString().trim().toLowerCase();
      var activo = data[r][6];
      if (rowEmail === emailNorm && (activo === true || activo === 'Activo' || activo === 'SI' || activo === 'Sí' || activo === 'Activa' || activo === 1)) {
        return {
          usuarioId: data[r][0] || ('USR-' + r),
          nombre: data[r][1] || 'Usuario CEDIS',
          correo: rowEmail,
          sucursal: data[r][3] || 'Bodega Central',
          canal: data[r][4] || 'CEDIS',
          rol: data[r][5] || 'ADMINISTRADOR_CEDIS',
          activo: true
        };
      }
    }
  }

  // Fallback de contingencia para usuarios y administradores oficiales del sistema
  var oficiales = [
    { usuarioId: 'USR-001', nombre: 'Administrador CEDIS', correo: 'visionluxe58@gmail.com', sucursal: 'Bodega Central', canal: 'CEDIS Central', rol: 'ADMINISTRADOR_CEDIS', activo: true },
    { usuarioId: 'USR-002', nombre: 'Operador Bodega CEDIS', correo: 'operaciones.cedis@changanpanama.com', sucursal: 'Bodega Central', canal: 'CEDIS Operativo', rol: 'OPERADOR_CEDIS', activo: true },
    { usuarioId: 'USR-003', nombre: 'Leidys Perez', correo: 'repuestos@changanpanama.com', sucursal: 'Villa Lucre', canal: 'Mostrador', rol: 'SUCURSAL_ASESOR', activo: true },
    { usuarioId: 'USR-004', nombre: 'Edwin Blanco', correo: 'repuestos.vl@changanpanama.com', sucursal: 'Villa Lucre', canal: 'Chapistería', rol: 'SUCURSAL_ASESOR', activo: true },
    { usuarioId: 'USR-005', nombre: 'Carlos Mendoza', correo: 'taller.costaverde@changanpanama.com', sucursal: 'Costa Verde', canal: 'Taller', rol: 'SUCURSAL_ASESOR', activo: true },
    { usuarioId: 'USR-006', nombre: 'Valeria Castillo', correo: 'garantias@changanpanama.com', sucursal: 'Calle 50', canal: 'Garantías', rol: 'SUCURSAL_ASESOR', activo: true },
    { usuarioId: 'USR-007', nombre: 'Alexis Rios', correo: 'repuestos.tm@changanpanama.com', sucursal: 'Tumba Muerto', canal: 'Colisión', rol: 'SUCURSAL_ASESOR', activo: true }
  ];

  for (var i = 0; i < oficiales.length; i++) {
    if (oficiales[i].correo.toLowerCase() === emailNorm) {
      return oficiales[i];
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
