import BodegueroSidebar from "@/components/BodegueroSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import IngresoProducto from "@/components/FormIngresoProducto"

export default function IngresarProducto({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <BodegueroSidebar />
            <main className="bg-gray-50">
                <SidebarTrigger />
                {children}
            </main>
            <div className="w-screen">
                <div className="">
                    <IngresoProducto />
                </div>
            </div>
        </SidebarProvider >
    )
}
