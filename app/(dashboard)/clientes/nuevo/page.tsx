import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { CustomerForm } from "@/components/customers/CustomerForm";

export default function NuevoClientePage() {
  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/clientes"
          aria-label="Volver a clientes"
          className="p-2 -ml-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
        >
          <Icon name="arrow_back" size={22} />
        </Link>
        <h1 className="font-heading text-xl font-bold text-on-surface">
          Nuevo Cliente
        </h1>
      </div>

      <CustomerForm />
    </div>
  );
}

