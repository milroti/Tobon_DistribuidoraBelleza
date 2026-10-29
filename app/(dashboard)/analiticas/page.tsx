import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAnalyticsDashboard,
  type AnalyticsPeriod,
} from "@/lib/actions/analytics";
import { AnalyticsContent } from "@/components/analytics/AnalyticsContent";

interface PageProps {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
}

const VALID_PERIODS: AnalyticsPeriod[] = ["today", "week", "month", "custom"];

export default async function AnaliticasPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    redirect("/pos");
  }

  const params = await searchParams;
  const rawPeriod = (params.period ?? "month") as AnalyticsPeriod;
  const period: AnalyticsPeriod = VALID_PERIODS.includes(rawPeriod)
    ? rawPeriod
    : "month";

  const data = await getAnalyticsDashboard({
    period,
    from: params.from,
    to: params.to,
  });

  return (
    <AnalyticsContent
      data={data}
      customFrom={params.from ?? ""}
      customTo={params.to ?? ""}
    />
  );
}
