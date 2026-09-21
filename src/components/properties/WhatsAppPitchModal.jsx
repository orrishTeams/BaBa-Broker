import React, { useState } from 'react';
import { buildWhatsAppPitch } from '../../utils/propertyConstants';

/**
 * Reusable WhatsApp Pitch Studio Modal
 * Allows salesman / employee to generate personalized property flyers with video tour links and send directly to customer.
 */
export default function WhatsAppPitchModal({
  property,
  onClose,
  senderName = 'Baba Broker Advisory Team',
}) {
  const [pitchClientName, setPitchClientName] = useState('');
  const [pitchClientPhone, setPitchClientPhone] = useState('');

  if (!property) return null;

  const pitchText = buildWhatsAppPitch(property, pitchClientName, senderName);

  const cleanPhone = pitchClientPhone.replace(/\D/g, '');
  const phoneParam = cleanPhone
    ? cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone
    : '';
  const textParam = encodeURIComponent(pitchText);
  const waUrl = phoneParam
    ? `https://api.whatsapp.com/send?phone=${phoneParam}&text=${textParam}`
    : `https://api.whatsapp.com/send?text=${textParam}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 shadow-2xl space-y-3">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-base">
              <i className="ri-whatsapp-line" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900">WhatsApp Client Pitch Studio</h3>
              <p className="text-[10px] text-slate-400">Generate personalized property flyer with video tour</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Client Name & Phone Input */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">Client Name (Optional)</label>
            <input
              type="text"
              value={pitchClientName}
              onChange={(e) => setPitchClientName(e.target.value)}
              placeholder="e.g. Rahul Sharma, Amit Ji"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 block mb-1">
              Client Phone Number (WhatsApp) <span className="text-slate-400 font-normal">(10 digits)</span>
            </label>
            <div className="relative">
              <i className="ri-phone-fill absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={pitchClientPhone}
                onChange={(e) => {
                  const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPitchClientPhone(onlyDigits);
                }}
                placeholder="e.g. 9876543210"
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-mono font-bold text-emerald-800"
              />
            </div>
          </div>
        </div>

        {/* Generated WhatsApp Message Preview */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] font-mono whitespace-pre-line text-slate-800 max-h-56 overflow-y-auto leading-relaxed">
          {pitchText}
        </div>

        {/* Direct Send Action Button */}
        <div className="pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="ri-whatsapp-fill text-base" />
            <span>
              {pitchClientPhone
                ? `Send to WhatsApp (${pitchClientPhone.trim()})`
                : 'Send on WhatsApp'}
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
