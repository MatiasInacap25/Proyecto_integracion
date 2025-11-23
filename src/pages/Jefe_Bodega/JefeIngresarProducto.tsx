import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import JefeBodegaSidebar from "@/components/JefeBodegaSidebar"
import IngresoProducto from "@/components/FormIngresoProducto"

export default function JefeIngresarProducto({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <JefeBodegaSidebar />
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
