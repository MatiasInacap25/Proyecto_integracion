import { Home, ArrowDownToLine, ArrowUpFromLine, LogOut, CircleMinus, Timer, ArchiveX, TrendingDown } from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

import userpng from "@/assets/usericon.png";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "../components/ui/avatar"
import { Button } from "./ui/button";

import { userStore } from "../store/user";

import { Logout } from "@/api/api";

export default function BodegueroSidebar() {
    const items = [
        {
            title: "Inicio",
            url: "/jefebodega",
            icon: Home,
        },
        {
            title: "Ingresar producto",
            url: "/jefebodega/IngresarProducto",
            icon: ArrowUpFromLine,
        },
        {
            title: "Salida producto",
            url: "/jefebodega/SalidaProducto",
            icon: ArrowDownToLine,
        },
        {
            title: "Registrar merma",
            url: "/jefebodega/RegistrarMerma",
            icon: CircleMinus,
        },
        {
            title: "Mermas pendientes",
            url: "/jefebodega/RegistrosMermas",
            icon: Timer,
        },
        {
            title: "Registro de mermas",
            url: "/jefebodega/RegistroMermas",
            icon: ArchiveX,
        },
        {
            title: "Comparación de mermas",
            url: "/jefebodega/ComparacionMermas",
            icon: TrendingDown,
        }
    ]

    const logoutUser = userStore((state) => state.logout);

    const onSubmit = async () => {
        console.log("Logging out...");
        try {
            const rest = await Logout();
            if (rest.status === 200) {
                logoutUser();
                window.location.href = "/login";
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }

    const png = userpng;
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <Sidebar>
            <SidebarHeader className="shadow-neutral-500/50 shadow-2xs">
                <DropdownMenuLabel>
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm ">
                        <Avatar className="h-8 w-8 rounded-lg ">
                            <AvatarImage src={png} alt={user.nombre} className="" />
                            <AvatarFallback className="rounded-lg"></AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">{user.nombre} {user.apellido}</span>
                            <span className="truncate text-xs"></span>
                        </div>
                    </div>
                </DropdownMenuLabel>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {items.map((item) => (
                                    <SidebarMenuItem className="rounded-md m-0.5" key={item.title}>
                                        <SidebarMenuButton asChild>
                                            <a href={item.url}>
                                                <item.icon />
                                                <span className="text-lg text-gray-700">{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4">
                <Button variant="ghost" onClick={onSubmit} className="text-lg text-red-500 border-red-500 border-2 hover:text-red-600 ">
                    <LogOut />
                    Cerrar Sesión</Button>
            </SidebarFooter>
        </Sidebar >
    )
}