"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
}

const BARCODE_FORMATS = [
  "EAN_13",
  "EAN_8",
  "UPC_A",
  "UPC_E",
  "CODE_128",
] as const;

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [mode, setMode] = useState<"loading" | "camera" | "manual">("loading");
  const [error, setError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<unknown>(null);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current as {
      isScanning?: boolean;
      stop?: () => Promise<void>;
      clear?: () => void;
    } | null;
    if (scanner?.isScanning) {
      try {
        await scanner.stop?.();
      } catch {
        // ignore
      }
    }
    try {
      scanner?.clear?.();
    } catch {
      // ignore
    }
    html5QrCodeRef.current = null;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");

        // Detect camera availability before attempting to start
        const cameras = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (!cameras || cameras.length === 0) {
          setMode("manual");
          setError("No se detectó cámara. Ingresa el código manualmente.");
          return;
        }

        if (!scannerRef.current) return;

        const scannerId = "barcode-scanner-region";
        scannerRef.current.id = scannerId;

        const formatsToSupport = BARCODE_FORMATS.map(
          (f) => Html5QrcodeSupportedFormats[f]
        );

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (mounted) {
              onScan(decodedText);
              stopScanner();
            }
          },
          () => {
            // per-frame failure — ignore (scanning in progress)
          }
        );

        if (mounted) setMode("camera");
      } catch (err) {
        if (!mounted) return;
        console.error("BarcodeScanner init error:", err);
        setMode("manual");
        setError("No se pudo acceder a la cámara. Ingresa el código manualmente.");
      }
    }

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [onScan, stopScanner]);

  const handleManualSubmit = () => {
    const trimmed = manualValue.trim();
    if (trimmed) onScan(trimmed);
  };

  const switchToManual = async () => {
    await stopScanner();
    setMode("manual");
    setError(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-on-surface">
          Escanear código de barras
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-surface-container transition-colors"
          >
            <Icon name="close" size={20} className="text-on-surface-variant" />
          </button>
        )}
      </div>

      {mode === "loading" && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Icon name="progress_activity" size={32} className="text-primary animate-spin" />
          <p className="text-sm text-on-surface-variant">Activando cámara...</p>
        </div>
      )}

      {mode === "camera" && (
        <>
          <div
            ref={scannerRef}
            className="w-full rounded-xl overflow-hidden bg-black"
          />
          <p className="text-xs text-on-surface-variant text-center">
            Apunta al código de barras del producto
          </p>
          <Button variant="ghost" size="sm" onClick={switchToManual} icon="keyboard">
            Ingresar manualmente
          </Button>
        </>
      )}

      {mode === "manual" && (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-warning-light text-warning-text text-sm">
              <Icon name="info" size={18} />
              {error}
            </div>
          )}
          <div ref={scannerRef} className="hidden" />
          <Input
            label="Código de barras"
            icon="barcode_scanner"
            placeholder="Escanea o escribe el código"
            value={manualValue}
            onChange={(e) => setManualValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleManualSubmit();
              }
            }}
            autoFocus
          />
          <Button
            onClick={handleManualSubmit}
            disabled={!manualValue.trim()}
            fullWidth
          >
            Usar este código
          </Button>
        </>
      )}

      <p className="text-xs text-outline text-center">
        Formatos: EAN-13, EAN-8, UPC-A, UPC-E, CODE-128
      </p>
    </div>
  );
}
