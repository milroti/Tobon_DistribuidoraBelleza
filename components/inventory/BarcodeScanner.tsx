"use client";

import { useEffect, useRef, useState, useCallback, useId } from "react";
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
  const onScanRef = useRef(onScan);
  const hasScannedRef = useRef(false);
  const reactId = useId().replace(/:/g, "");
  const scannerId = `barcode-scanner-region-${reactId}`;

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    const scanner = html5QrCodeRef.current as {
      isScanning?: boolean;
      stop?: () => Promise<void>;
      clear?: () => void;
    } | null;
    html5QrCodeRef.current = null;
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
  }, []);

  useEffect(() => {
    let mounted = true;
    hasScannedRef.current = false;

    async function initScanner() {
      try {
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
          "html5-qrcode"
        );

        if (!mounted || !scannerRef.current) return;

        const formatsToSupport = BARCODE_FORMATS.map(
          (f) => Html5QrcodeSupportedFormats[f]
        );

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport,
          verbose: false,
        });
        html5QrCodeRef.current = html5QrCode;

        const scanConfig = {
          fps: 10,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(280, Math.max(180, Math.floor(viewfinderWidth * 0.8)));
            const height = Math.min(160, Math.max(100, Math.floor(viewfinderHeight * 0.5)));
            return { width, height };
          },
          aspectRatio: 1.5,
        };

        const onScanSuccess = (decodedText: string) => {
          if (!mounted || hasScannedRef.current) return;
          hasScannedRef.current = true;
          stopScanner().finally(() => {
            if (mounted) {
              onScanRef.current(decodedText);
            }
          });
        };

        try {
          // Intentar primero con la cámara trasera directamente (evita doble solicitud en móviles)
          await html5QrCode.start(
            { facingMode: "environment" },
            scanConfig,
            onScanSuccess,
            () => {}
          );
        } catch {
          // Fallback: buscar cámaras disponibles (útil en portátiles/PC sin cámara environment)
          const cameras = await Html5Qrcode.getCameras();
          if (!mounted) return;
          if (!cameras || cameras.length === 0) {
            setMode("manual");
            setError("No se detectó cámara. Ingresa el código manualmente.");
            return;
          }
          const backCamera =
            cameras.find((c) =>
              /back|trasera|rear|environment/i.test(c.label)
            ) ?? cameras[cameras.length - 1];

          await html5QrCode.start(
            backCamera.id,
            scanConfig,
            onScanSuccess,
            () => {}
          );
        }

        if (mounted) {
          setMode("camera");
        } else {
          await stopScanner();
        }
      } catch (err) {
        if (!mounted) return;
        console.error("BarcodeScanner init error:", err);
        setMode("manual");
        setError(
          "No se pudo acceder a la cámara. Ingresa el código manualmente."
        );
      }
    }

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [scannerId, stopScanner]);

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

      {/* El contenedor del visor SIEMPRE está montado mientras mode !== "manual" para que html5-qrcode pueda inyectar el <video> */}
      {mode !== "manual" && (
        <>
          <div className="relative w-full min-h-56 rounded-xl overflow-hidden bg-black flex items-center justify-center">
            <div
              id={scannerId}
              ref={scannerRef}
              className="w-full"
            />
            {mode === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-low/95 gap-3 z-10">
                <Icon
                  name="progress_activity"
                  size={32}
                  className="text-primary animate-spin"
                />
                <p className="text-sm text-on-surface-variant">
                  Activando cámara...
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-on-surface-variant text-center">
            Apunta al código de barras del producto
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={switchToManual}
            icon="keyboard"
          >
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
