import { getCustomers } from "@/lib/actions/customers";
import { CustomersContent } from "@/components/customers/CustomersContent";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

export default async function ClientesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.q ?? "";
  const page = parseInt(params.page ?? "1", 10);

  const result = await getCustomers({
    search: search || undefined,
    page,
    per_page: 20,
  });

  const customers = result.data?.customers ?? [];
  const totalCount = result.data?.count ?? 0;

  return (
    <CustomersContent
      customers={customers}
      totalCount={totalCount}
      currentSearch={search}
      currentPage={page}
    />
  );
}
