import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Mermas from "@/components/Mermas";

export default function AdminMermasPage({ children }: { children: React.ReactNode }) {
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
                        <Mermas />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
