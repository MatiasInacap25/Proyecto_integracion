import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Proveedores from "@/components/proveedores";
import FormProveedor from "@/components/FormProveedor";

export default function AdminProveedoresPage({ children }: { children: React.ReactNode }) {
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
                        <Proveedores />
                        <FormProveedor />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
