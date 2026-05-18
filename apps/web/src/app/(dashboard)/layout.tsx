import { AdminSidebar } from "@/components/layout/admin-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen pt-16">
      <AdminSidebar />
      <main className="flex-1 pl-64">{children}</main>
    </div>
  );
}
