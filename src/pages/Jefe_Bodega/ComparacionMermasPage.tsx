import BodegueroSidebar from "@/components/JefeBodegaSidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import ComparacionMermas from "@/components/ComparacionMermas"

export default function ComparacionMermasPage({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarProvider>
                <BodegueroSidebar />
                <main className="bg-neutral-50">
                    <SidebarTrigger />
                    {children}
                </main>
                <div className="w-screen bg-neutral-50">
                    <div className="bg-neutral-50 p-5">
                        <ComparacionMermas />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}