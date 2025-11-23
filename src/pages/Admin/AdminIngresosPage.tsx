import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Ingresos from "@/components/Ingresos";

export default function AdminIngresosPage({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarProvider>
                <AdminSidebar />
                <main className="bg-neutral-50">
                    <SidebarTrigger />
                    {children}
                </main>
                <div className="w-screen bg-neutral-50">
                    <div className="bg-neutral-50 p-5">
                        <Ingresos />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
