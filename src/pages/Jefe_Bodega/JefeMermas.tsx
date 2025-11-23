import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import JefeBodegaSidebar from "@/components/JefeBodegaSidebar"
import MermasPendientes from "@/components/MermasPendientes"

export default function JefeMermas({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <JefeBodegaSidebar />
            <main className="bg-gray-50">
                <SidebarTrigger />
                {children}
            </main>
            <div className="w-screen">
                <div className="">
                    <MermasPendientes />
                </div>
            </div>
        </SidebarProvider >
    )
}
