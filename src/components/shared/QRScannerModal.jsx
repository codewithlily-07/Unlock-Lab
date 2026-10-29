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
          <Button onClick={handlePrintBadge} variant="primary" className="font-bold">
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print QR Bench Tag</span>
          </Button>
        </>
      }
    >
      <div className="text-center py-3 space-y-4">
        <div className="bg-white p-4 inline-block rounded-3xl border-2 border-[#E8E2D2] shadow-soft-sm">
          {qrUrl ? (
            <img src={qrUrl} alt="Equipment QR Token" className="w-48 h-48 mx-auto" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-[#798C82]">
              Generating QR...
            </div>
          )}
        </div>

        <div>
          <h4 className="text-sm font-bold text-[#17231E] font-sans">{resource.name}</h4>
          <p className="text-xs text-[#4A5B53] mt-0.5">{resource.location}</p>
          <span className="text-[11px] font-mono text-[#798C82] mt-1 block">
            Token: {resource.qr_token}
          </span>
        </div>

        <div className="p-3.5 bg-[#f0f7f4] border border-[#126B4F]/25 rounded-2xl text-xs text-[#073D2D] flex items-center justify-center gap-2">
          <Smartphone className="w-4 h-4 text-[#126B4F]" />
          <span>Scan on mobile at the lab bench to check in or confirm return.</span>
        </div>
      </div>
    </Modal>
  );
}

export default QRScannerModal;
