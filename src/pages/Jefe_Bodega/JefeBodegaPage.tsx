import BodegueroSidebar from "@/components/JefeBodegaSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Inventario from "@/components/Inventario"

export default function JefeBodegaPage({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-linear-to-br from-blue-100 via-white to-blue-300">
            <SidebarProvider>
                <BodegueroSidebar />
                <main className="bg-neutral-50">
                    <SidebarTrigger />
                    {children}
                </main>
                <div className="w-screen bg-neutral-50">
                    <div className="bg-neutral-50">
                        <Inventario />
                    </div>
                </div>
            </SidebarProvider>
        </div>
    )
}
