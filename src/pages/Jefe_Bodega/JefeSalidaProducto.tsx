import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import JefeBodegaSidebar from "@/components/JefeBodegaSidebar"
import FormSalidaProducto from "@/components/FormSalidaProducto"

export default function JefeSalidaProducto({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <JefeBodegaSidebar />
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
