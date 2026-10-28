import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { QrCode, Printer, Smartphone } from 'lucide-react';

export function QRScannerModal({ isOpen, onClose, resource }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (resource?.qr_token) {
      // Generate QR data url
      const checkinUrl = `${window.location.origin}/explore?qr=${resource.qr_token}`;
      QRCode.toDataURL(checkinUrl, { width: 280, margin: 2 }, (err, url) => {
        if (!err && url) setQrUrl(url);
      });
    }
  }, [resource?.qr_token]);

  if (!resource) return null;

  function handlePrintBadge() {
    window.print();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Equipment QR Handover Tag"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrintBadge}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print QR Bench Tag</span>
          </Button>
        </>
      }
    >
      <div className="text-center py-3 space-y-4">
        <div className="bg-white p-4 inline-block rounded-2xl border-2 border-slate-200 shadow-sm">
          {qrUrl ? (
            <img src={qrUrl} alt="Equipment QR Token" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-slate-400">
              Generating QR...
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-slate-900">{resource.name}</h4>
          <p className="text-xs text-slate-500">{resource.location}</p>
          <span className="text-[11px] font-mono text-slate-400 mt-1 block">
            Token: {resource.qr_token}
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-center gap-2">
          <Smartphone className="w-4 h-4 text-brand-600" />
          <span>Scan on mobile at the lab bench to check in or confirm return.</span>
        </div>
      </div>
    </Modal>
  );
}
