import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import ProductosAdmin from "@/components/ProductosAdmin";
import FormProducto from "@/components/FormProducto";

export default function AdminProductosPage({ children }: { children: React.ReactNode }) {
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
                        <ProductosAdmin />
                        <FormProducto />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
