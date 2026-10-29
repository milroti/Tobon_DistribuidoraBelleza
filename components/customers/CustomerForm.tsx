"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ConsentCheckbox } from "@/components/customers/ConsentCheckbox";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/lib/actions/customers";
import type { Customer, UserRole } from "@/lib/types/database";

interface CustomerFormProps {
  customer?: Customer;
  userRole?: UserRole;
}

export function CustomerForm({
  customer,
  userRole = "vendor",
}: CustomerFormProps) {
  const router = useRouter();
  const isEditing = Boolean(customer);
  const canEditExisting = !isEditing || userRole === "admin";

  const [firstName, setFirstName] = useState(customer?.first_name ?? "");
  const [lastName, setLastName] = useState(customer?.last_name ?? "");
  const [cedula, setCedula] = useState(customer?.cedula ?? "");
  const [phone, setPhone] = useState(
    customer?.phone ? customer.phone.replace(/^\+?57\s*/, "") : ""
  );
  const [email, setEmail] = useState(customer?.email ?? "");
  const [consentAccepted, setConsentAccepted] = useState(Boolean(customer));

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading || !canEditExisting) return;

    setError(null);
    setSuccessMessage(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedCedula = cedula.trim();
    const cleanPhone = phone.replace(/\s+/g, "").trim();

    if (!trimmedFirst || !trimmedLast || !trimmedCedula || !cleanPhone) {
      setError(
        "Por favor completa los campos obligatorios marcados con asterisco (*)"
      );
      return;
    }

    if (!isEditing && !consentAccepted) {
      setError(
        "Debes aceptar la autorización de tratamiento de datos personales (Ley 1581 de 2012)"
      );
      return;
    }

    const formattedPhone = cleanPhone.startsWith("+57")
      ? cleanPhone
      : `+57 ${cleanPhone}`;

    setLoading(true);

    try {
      if (isEditing && customer) {
        const res = await updateCustomer(customer.id, {
          first_name: trimmedFirst,
          last_name: trimmedLast,
          cedula: trimmedCedula,
          phone: formattedPhone,
          email: email.trim() || null,
        });

        if (!res.success) {
          setError(res.error ?? "Error al actualizar el cliente");
          setLoading(false);
          return;
        }

        setSuccessMessage("Datos del cliente actualizados correctamente");
        router.refresh();
        setTimeout(() => {
          router.push("/clientes");
        }, 700);
      } else {
        const res = await createCustomer({
          first_name: trimmedFirst,
          last_name: trimmedLast,
          cedula: trimmedCedula,
          phone: formattedPhone,
          email: email.trim() || null,
          consent_accepted: consentAccepted,
        });

        if (!res.success) {
          setError(res.error ?? "Error al registrar el cliente");
          setLoading(false);
          return;
        }

        setSuccessMessage("Cliente registrado con éxito en el sistema");
        router.refresh();
        setTimeout(() => {
          router.push("/clientes");
        }, 700);
      }
    } catch {
      setError("Ocurrió un error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customer || deleting || userRole !== "admin") return;
    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar al cliente ${customer.first_name} ${customer.last_name}?`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError(null);

    const res = await deleteCustomer(customer.id);
    if (!res.success) {
      setError(res.error ?? "Error al eliminar el cliente");
      setDeleting(false);
      return;
    }

    router.push("/clientes");
    router.refresh();
  };

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-5 pb-10">
      {/* Top Banner Card (Stitch style) */}
      <div className="bg-surface-container-low rounded-xl p-4 flex items-center justify-between shadow-xs border border-outline-variant/30 relative overflow-hidden">
        <div className="flex items-center gap-3.5 min-w-0 z-10">
          <div className="w-13 h-13 rounded-full bg-surface-container-highest flex items-center justify-center text-primary shrink-0">
            <Icon name={isEditing ? "person" : "person_add"} size={26} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <Icon name="verified" size={15} className="text-secondary" />
              <span className="font-heading text-[11px] font-bold text-secondary uppercase tracking-wider">
                {isEditing ? "Ficha de cliente" : "Alta comercial"}
              </span>
            </div>
            <p className="font-heading text-base font-bold text-on-surface truncate">
              {isEditing
                ? `${customer?.first_name} ${customer?.last_name}`
                : "Cliente / Salón de Belleza"}
            </p>
            <p className="text-xs text-on-surface-variant truncate">
              {isEditing
                ? `Consentimiento registrado el ${new Date(
                    customer!.consent_at
                  ).toLocaleDateString("es-CO")}`
                : "Registra los datos para compras y comprobantes"}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1.5 bg-surface-container-highest px-2.5 py-1 rounded-full text-on-surface-variant">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span className="font-heading text-[11px] font-bold">
            {isEditing ? "Activo" : "Nuevo"}
          </span>
        </div>
      </div>

      {/* Feedback Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium flex items-center gap-2">
          <Icon name="error" size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-success-light text-success-text text-xs font-semibold flex items-center gap-2">
          <Icon name="check_circle" size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Nombre */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="clienteNombre"
            className="font-heading text-xs font-semibold text-on-surface flex items-center gap-1"
          >
            <span>Nombre</span>
            <span className="text-primary font-bold">*</span>
          </label>
          <input
            id="clienteNombre"
            name="first_name"
            type="text"
            required
            disabled={!canEditExisting}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ej. Carolina"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface shadow-xs focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
          />
        </div>

        {/* Apellido */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="clienteApellido"
            className="font-heading text-xs font-semibold text-on-surface flex items-center gap-1"
          >
            <span>Apellido</span>
            <span className="text-primary font-bold">*</span>
          </label>
          <input
            id="clienteApellido"
            name="last_name"
            type="text"
            required
            disabled={!canEditExisting}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Ej. Restrepo Montoya"
            className="w-full h-11 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface shadow-xs focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
          />
        </div>

        {/* Cédula de Ciudadanía */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="clienteCedula"
              className="font-heading text-xs font-semibold text-on-surface flex items-center gap-1"
            >
              <span>Cédula de Ciudadanía (CC)</span>
              <span className="text-primary font-bold">*</span>
            </label>
            <span className="font-heading text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
              <Icon
                name="verified_user"
                size={14}
                className="text-secondary"
              />
              Documento único
            </span>
          </div>

          <div className="relative flex items-center w-full">
            <span className="absolute left-3 text-on-surface-variant pointer-events-none flex items-center">
              <Icon name="badge" size={20} />
            </span>
            <input
              id="clienteCedula"
              name="cedula"
              type="tel"
              inputMode="numeric"
              required
              disabled={!canEditExisting}
              value={cedula}
              onChange={(e) =>
                setCedula(e.target.value.replace(/[^0-9.\-]/g, ""))
              }
              placeholder="1.020.345.678"
              className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface shadow-xs focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
            />
          </div>
          <p className="text-xs text-on-surface-variant pl-1">
            Documento de identificación para comprobantes de venta.
          </p>
        </div>

        {/* Teléfono celular (+57) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="clienteTelefono"
            className="font-heading text-xs font-semibold text-on-surface flex items-center gap-1"
          >
            <span>Teléfono celular</span>
            <span className="text-primary font-bold">*</span>
          </label>
          <div className="flex items-center gap-2 w-full">
            <div className="h-11 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 flex items-center gap-1.5 shadow-xs shrink-0">
              <span
                aria-label="Colombia"
                role="img"
                className="text-base leading-none"
              >
                🇨🇴
              </span>
              <span className="font-heading text-xs text-on-surface font-bold">
                +57
              </span>
            </div>
            <div className="relative flex-1 min-w-0">
              <input
                id="clienteTelefono"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                disabled={!canEditExisting}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^0-9\s\-]/g, ""))
                }
                placeholder="300 123 4567"
                className="w-full h-11 pl-3.5 pr-9 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface shadow-xs focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary flex items-center pointer-events-none">
                <Icon name="chat" size={18} />
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 pl-1">
            <Icon
              name="notifications_active"
              size={14}
              className="text-primary"
            />
            <span className="text-xs text-on-surface-variant">
              Habilitado para envío de comprobantes por WhatsApp.
            </span>
          </div>
        </div>

        {/* Correo electrónico (Opcional) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="clienteEmail"
            className="font-heading text-xs font-semibold text-on-surface flex items-center justify-between"
          >
            <div className="flex items-center gap-1">
              <span>Correo electrónico</span>
              <span className="font-body text-xs font-normal text-on-surface-variant">
                (Opcional)
              </span>
            </div>
            <span className="font-heading text-[11px] text-primary font-semibold">
              Recibo digital
            </span>
          </label>
          <div className="relative flex items-center w-full">
            <span className="absolute left-3 text-on-surface-variant pointer-events-none flex items-center">
              <Icon name="alternate_email" size={20} />
            </span>
            <input
              id="clienteEmail"
              name="email"
              type="email"
              disabled={!canEditExisting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@salondebelleza.com"
              className="w-full h-11 pl-10 pr-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-sm text-on-surface shadow-xs focus:border-primary focus:outline-none transition-all placeholder:text-on-surface-variant/40 disabled:opacity-60"
            />
          </div>
        </div>

        {/* Consent Section (Required on Create) */}
        {!isEditing && (
          <ConsentCheckbox
            checked={consentAccepted}
            onChange={setConsentAccepted}
          />
        )}

        {/* Submit & Cancel Actions */}
        <div className="flex flex-col gap-2 pt-1">
          {canEditExisting ? (
            <>
              <button
                type="submit"
                disabled={(!isEditing && !consentAccepted) || loading}
                className={`w-full h-12 rounded-xl font-heading text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  (!isEditing && !consentAccepted) || loading
                    ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed shadow-none"
                    : "bg-primary text-on-primary shadow-md hover:bg-primary-container active:scale-[0.99] cursor-pointer"
                }`}
              >
                {loading ? (
                  <>
                    <Icon
                      name="progress_activity"
                      size={20}
                      className="animate-spin"
                    />
                    <span>
                      {isEditing ? "Guardando cambios..." : "Registrando..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Icon
                      name={isEditing ? "save" : "how_to_reg"}
                      size={20}
                    />
                    <span>
                      {isEditing ? "Guardar cambios" : "Registrar cliente"}
                    </span>
                  </>
                )}
              </button>

              {!isEditing && (
                <p
                  className={`text-xs text-center font-medium ${
                    consentAccepted ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  {consentAccepted
                    ? "Listo para dar de alta en el sistema"
                    : "Se activará al aceptar los términos de Habeas Data"}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-center text-on-surface-variant bg-surface-container-low p-3 rounded-lg">
              Solo los administradores pueden editar o eliminar clientes
              registrados (Ley 1581 de 2012).
            </p>
          )}

          {isEditing && userRole === "admin" && (
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="w-full h-11 rounded-xl bg-error-container/50 text-on-error-container hover:bg-error-container font-heading text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Icon name="delete" size={18} />
              <span>
                {deleting ? "Eliminando cliente..." : "Eliminar cliente"}
              </span>
            </button>
          )}

          <Link
            href="/clientes"
            className="w-full h-11 rounded-xl bg-transparent text-primary hover:bg-primary-fixed/20 font-heading text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Icon name="arrow_back" size={18} />
            <span>Cancelar y regresar</span>
          </Link>
        </div>
      </form>
    </div>
  );
}

