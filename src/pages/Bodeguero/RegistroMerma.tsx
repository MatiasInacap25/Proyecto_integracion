import FormRegistroMerma from "@/components/FormRegistroMerma";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import BodegueroSidebar from "@/components/BodegueroSidebar"

export default function RegistroMerma({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <BodegueroSidebar />
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