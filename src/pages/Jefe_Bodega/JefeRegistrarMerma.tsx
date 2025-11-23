import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import JefeBodegaSidebar from "@/components/JefeBodegaSidebar"
import FormRegistroMerma from "@/components/FormRegistroMerma"

export default function JefeRegistrarMerma({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <JefeBodegaSidebar />
            <main className="bg-gray-50">
                <SidebarTrigger />
                {children}
            </main>
            <div className="w-screen">
                <div className="">
                    <FormRegistroMerma />
                </div>
            </div>
        </SidebarProvider >
    )
}
