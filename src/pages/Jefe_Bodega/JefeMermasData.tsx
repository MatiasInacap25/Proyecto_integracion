import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import JefeBodegaSidebar from "@/components/JefeBodegaSidebar"
import Mermas from "@/components/Mermas"

export default function JefeMermasData({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <JefeBodegaSidebar />
            <main className="bg-gray-50">
                <SidebarTrigger />
                {children}
            </main>
            <div className="w-screen">
                <div className="">
                    <Mermas />
                </div>
            </div>
        </SidebarProvider >
    )
}