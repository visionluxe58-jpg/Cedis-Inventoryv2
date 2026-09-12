import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, QrCode } from 'lucide-react';
import { Asesor } from '../types/cedis';

interface ModalCompartirProps {
  isOpen: boolean;
  onClose: () => void;
  asesores?: Asesor[];
}

export const ModalCompartir: React.FC<ModalCompartirProps> = ({ isOpen, onClose, asesores = [] }) => {
  const [copiado, setCopiado] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentUrl = window.location.origin + window.location.pathname;
  const urlSucursales = `${currentUrl}?portal=sucursales`;

  const handleCopiar = () => {
    navigator.clipboard.writeText(urlSucursales);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const whatsappGroupUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `🚗 *CHANGAN PANAMÁ - PORTAL DE PEDIDOS A CEDIS*\nEstimado asesor, ingresa tus solicitudes de repuestos, colisión y garantías en el siguiente enlace:\n${urlSucursales}`
  )}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-5 shadow-2xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-purple-900/50 text-purple-400 p-2 rounded-lg border border-purple-500/40">
              <Share2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">Difusión del Portal de Sucursales</h3>
              <p className="text-[11px] text-slate-400">
                Enlace oficial para que los asesores hagan requisiciones directas a CEDIS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input con Botón Copiar */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
            Enlace Oficial para Asesores
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urlSucursales}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-blue-400 font-mono select-all"
            />
            <button
              type="button"
              onClick={handleCopiar}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow transition whitespace-nowrap cursor-pointer"
            >
              {copiado ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Grid QR & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
          <div className="flex flex-col items-center justify-center text-center p-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                urlSucursales
              )}`}
              alt="Código QR Portal Sucursales"
              className="w-28 h-28 rounded-lg bg-white p-1.5 shadow"
            />
            <span className="text-[10px] text-slate-400 mt-2">
              Escanear con la cámara del celular
            </span>
          </div>

          <div className="flex flex-col justify-center space-y-2.5">
            <span className="text-xs font-bold text-white">Difusión Inmediata por WhatsApp</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Envía el enlace oficial junto con el formato de requisición directamente al grupo operativo de sucursales.
            </p>
            <a
              href={whatsappGroupUrl}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs p-2.5 rounded-lg flex items-center justify-center gap-2 shadow transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Compartir al Grupo</span>
            </a>
          </div>
        </div>

        {/* Directorio de Contactos Rápidos */}
        <div>
          <span className="text-xs font-bold text-slate-300 uppercase block mb-2">
            Enviar Directamente a un Asesor
          </span>
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-lg p-2">
            {asesores.map((a) => {
              const numLimpio = (a.contacto || '').replace(/[^0-9]/g, '');
              const msg = encodeURIComponent(
                `Hola ${a.nombre}, aquí tienes el portal oficial de requisición de repuestos a CEDIS:\n${urlSucursales}`
              );
              const waLink = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${msg}`;

              return (
                <div
                  key={a.nombre}
                  className="flex items-center justify-between p-2 rounded bg-slate-900 text-xs border border-slate-800"
                >
                  <div>
                    <span className="font-bold text-white block">{a.nombre}</span>
                    <span className="text-slate-400 text-[11px]">
                      {a.sucursal} - {a.cargo}
                    </span>
                  </div>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-950 border border-emerald-700 hover:bg-emerald-900 text-emerald-300 px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                  >
                    <MessageSquare className="w-3 h-3 text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs px-4 py-2 rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
