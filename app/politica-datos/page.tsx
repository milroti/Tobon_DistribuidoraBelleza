import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title:
    "Política de Tratamiento de Datos Personales | Tobón Distribuidora de Belleza",
  description:
    "Política de Tratamiento y Protección de Datos Personales conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
};

export default function PoliticaDatosPage() {
  return (
    <div className="min-h-dvh bg-background text-on-background flex flex-col">
      {/* Top Brand Header */}
      <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/40">
        <div className="max-w-3xl mx-auto h-16 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary text-on-primary font-heading font-bold text-lg flex items-center justify-center shadow-xs">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-sm font-bold text-primary leading-tight">
                Tobón
              </span>
              <span className="font-heading text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Distribuidora de Belleza
              </span>
            </div>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-primary hover:underline"
          >
            <Icon name="arrow_back" size={16} />
            <span>Volver al sistema</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_-2px_rgba(181,51,107,0.06)] border border-outline-variant/40 overflow-hidden">
          {/* Decorative Top Accent */}
          <div className="h-2 w-full bg-gradient-to-r from-primary via-primary-container to-secondary-container" />

          <div className="p-6 sm:p-10 flex flex-col gap-8">
            {/* Title Banner */}
            <div className="flex flex-col gap-3 border-b border-outline-variant/30 pb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-heading text-xs font-bold w-fit">
                <Icon name="shield" size={15} />
                <span>Ley Estatutaria 1581 de 2012 • Habeas Data</span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                Política de Tratamiento y Protección de Datos Personales
              </h1>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                En cumplimiento de lo dispuesto por la{" "}
                <strong>Ley Estatutaria 1581 de 2012</strong>, el{" "}
                <strong>Decreto Reglamentario 1377 de 2013</strong> (compilado
                en el Decreto 1074 de 2015) y demás normas concordantes,{" "}
                <strong>Tobón Distribuidora de Belleza</strong> adopta la
                presente Política de Tratamiento de Datos Personales.
              </p>
            </div>

            {/* 1. Identificación del Responsable */}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  1
                </span>
                <span>Identificación del Responsable del Tratamiento</span>
              </h2>

              <div className="bg-surface-container-low rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs font-heading font-semibold text-outline block">
                    Razón social / Nombre comercial:
                  </span>
                  <span className="font-semibold text-on-surface">
                    Tobón Distribuidora de Belleza
                  </span>
                </div>
                <div>
                  <span className="text-xs font-heading font-semibold text-outline block">
                    NIT:
                  </span>
                  <span className="font-mono text-xs bg-warning-light text-warning-text px-2 py-0.5 rounded font-semibold">
                    [POR CONFIRMAR]
                  </span>
                </div>
                <div>
                  <span className="text-xs font-heading font-semibold text-outline block">
                    Dirección física / Domicilio:
                  </span>
                  <span className="font-mono text-xs bg-warning-light text-warning-text px-2 py-0.5 rounded font-semibold">
                    [POR CONFIRMAR]
                  </span>
                </div>
                <div>
                  <span className="text-xs font-heading font-semibold text-outline block">
                    Correo de protección de datos:
                  </span>
                  <span className="font-mono text-xs bg-warning-light text-warning-text px-2 py-0.5 rounded font-semibold">
                    [POR CONFIRMAR]
                  </span>
                </div>
              </div>
            </section>

            {/* 2. Finalidades del Tratamiento */}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  2
                </span>
                <span>Finalidades del Tratamiento de los Datos</span>
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                Los datos personales recolectados por{" "}
                <strong>Tobón Distribuidora de Belleza</strong> (tales como
                nombres, apellidos, número de cédula, teléfono celular y correo
                electrónico) serán utilizados exclusivamente para las siguientes
                finalidades:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-sm text-on-surface-variant">
                <li>
                  <strong>Registro de compras y comprobantes:</strong> asociar
                  las compras realizadas en el punto de venta y emitir los
                  respectivos recibos digitales o impresos (por WhatsApp, PDF o
                  correo electrónico).
                </li>
                <li>
                  <strong>Comunicación comercial y fidelización:</strong>{" "}
                  informar sobre nuevos productos de belleza profesional,
                  promociones, eventos y futuros programas de beneficios o
                  fidelización para clientes y salones.
                </li>
                <li>
                  <strong>Mejora del servicio:</strong> analizar el historial de
                  compras para optimizar la disponibilidad de inventario y la
                  atención al cliente.
                </li>
                <li>
                  <strong>Cumplimiento legal y atención de garantías:</strong>{" "}
                  dar trámite a solicitudes de garantía, cambios de productos y
                  obligaciones administrativas o contables.
                </li>
              </ul>
            </section>

            {/* 3. Derechos de los Titulares */}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Derechos de los Titulares (Artículo 8, Ley 1581 de 2012)
                </span>
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                Como titular de sus datos personales, usted tiene derecho a:
              </p>

              <ul className="list-disc pl-6 space-y-2 text-sm text-on-surface-variant">
                <li>
                  <strong>Acceder</strong> en forma gratuita a sus datos
                  personales que hayan sido objeto de tratamiento.
                </li>
                <li>
                  <strong>Conocer, actualizar y rectificar</strong> sus datos
                  personales frente a Tobón Distribuidora de Belleza cuando
                  sean parciales, inexactos, incompletos o induzcan a error.
                </li>
                <li>
                  <strong>Solicitar prueba de la autorización</strong> otorgada
                  para el tratamiento de sus datos personales.
                </li>
                <li>
                  <strong>Ser informado</strong>, previa solicitud, respecto del
                  uso que se le ha dado a sus datos personales.
                </li>
                <li>
                  <strong>Revocar la autorización y/o solicitar la supresión</strong>{" "}
                  del dato cuando en el tratamiento no se respeten los
                  principios, derechos y garantías constitucionales y legales, o
                  cuando no exista un deber legal o contractual de permanecer en
                  la base de datos.
                </li>
                <li>
                  <strong>Presentar quejas ante la SIC:</strong> acudir ante la
                  Superintendencia de Industria y Comercio por infracciones a lo
                  dispuesto en la Ley 1581 de 2012 y las demás normas que la
                  modifiquen, adicionen o complementen.
                </li>
              </ul>
            </section>

            {/* 4. Procedimiento para Consultas y Reclamos */}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  4
                </span>
                <span>Procedimiento para Consultas y Reclamos</span>
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                Los titulares o sus causahabientes podrán ejercer sus derechos
                de consulta, actualización, rectificación, supresión o
                revocatoria enviando una solicitud al correo electrónico{" "}
                <span className="font-mono text-xs bg-warning-light text-warning-text px-2 py-0.5 rounded font-semibold">
                  [POR CONFIRMAR]
                </span>{" "}
                o de manera presencial en nuestra sede ubicada en{" "}
                <span className="font-mono text-xs bg-warning-light text-warning-text px-2 py-0.5 rounded font-semibold">
                  [POR CONFIRMAR]
                </span>
                :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center gap-1.5 text-primary font-heading text-sm font-bold">
                    <Icon name="schedule" size={18} />
                    <span>Consultas (Art. 14)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Serán atendidas en un término máximo de{" "}
                    <strong>diez (10) días hábiles</strong> contados a partir de
                    la fecha de recibo. Si no fuere posible atenderla dentro de
                    dicho término, se informará al interesado antes del
                    vencimiento, sin que la prórroga supere{" "}
                    <strong>cinco (5) días hábiles</strong> adicionales.
                  </p>
                </div>

                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5 border border-outline-variant/30">
                  <div className="flex items-center gap-1.5 text-primary font-heading text-sm font-bold">
                    <Icon name="edit_document" size={18} />
                    <span>Reclamos (Art. 15)</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    El término máximo para atender el reclamo será de{" "}
                    <strong>quince (15) días hábiles</strong> contados a partir
                    del día siguiente a la fecha de su recibo. Cuando no fuere
                    posible atenderlo dentro de dicho término, la prórroga no
                    podrá superar <strong>ocho (8) días hábiles</strong>{" "}
                    adicionales.
                  </p>
                </div>
              </div>
            </section>

            {/* 5. Carácter Facultativo */}
            <section className="flex flex-col gap-3">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  5
                </span>
                <span>Carácter Facultativo de Datos Sensibles</span>
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                Tobón Distribuidora de Belleza no recolecta de manera ordinaria
                datos sensibles ni datos de menores de edad. En cualquier caso,
                se informa a los titulares que el suministro de datos personales
                sensibles o de niñas, niños y adolescentes tiene carácter{" "}
                <strong>estrictamente facultativo</strong>, y ninguna venta o
                prestación de servicio estará condicionada a la entrega de datos
                sensibles.
              </p>
            </section>

            {/* 6. Vigencia */}
            <section className="flex flex-col gap-3 border-t border-outline-variant/30 pt-6">
              <h2 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  6
                </span>
                <span>Vigencia de la Política y de la Base de Datos</span>
              </h2>

              <p className="text-sm text-on-surface-variant leading-relaxed">
                La presente Política de Tratamiento de Datos Personales rige a
                partir de su publicación. Las bases de datos tendrán una
                vigencia igual al período en que se mantenga la finalidad del
                tratamiento o el tiempo exigido por la ley colombiana.
              </p>

              <p className="text-xs text-outline font-medium">
                Última actualización: Octubre de 2026 — Tobón Distribuidora de
                Belleza.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

