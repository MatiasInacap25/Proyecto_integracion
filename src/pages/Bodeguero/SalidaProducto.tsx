import BodegueroSidebar from "@/components/BodegueroSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import FormSalidaProducto from "@/components/FormSalidaProducto"

export default function SalidaProducto({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <BodegueroSidebar />
            <main className="bg-gray-50">
                <SidebarTrigger />
                {children}
            </main>
            <div className="w-screen">
                <div className="">
                    <FormSalidaProducto />
                </div>
            </div>
        </SidebarProvider >
    )
}
