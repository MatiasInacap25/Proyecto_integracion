import AdminSidebar from "@/components/AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import Users from "@/components/Users";
import FormRegistroUser from "@/components/FormRegistroUser";

export default function AdminUsers({ children }: { children: React.ReactNode }) {
    return (
        <>
            <SidebarProvider>
                <AdminSidebar />
                <main className="bg-neutral-50">
                    <SidebarTrigger />
                    {children}
                </main>
                <div className="w-screen bg-neutral-50 p-10">
                    <div className="bg-neutral-50">
                        <Users />
                        <FormRegistroUser />
                    </div>
                </div>
            </SidebarProvider>
        </>
    )
}
