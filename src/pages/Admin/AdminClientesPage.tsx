import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Clientes from "@/components/Clientes";
import FormCliente from "@/components/FormCliente";

export default function AdminClientesPage({ children }: { children: React.ReactNode }) {
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
                        <Clientes />
                        <FormCliente />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
