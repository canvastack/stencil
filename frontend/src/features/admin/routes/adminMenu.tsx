import { Package } from "lucide-react";
import { productRoutes } from "./productRoutes";

export const adminMenuItems = [
  // ... other menu items
  {
    label: "Products",
    icon: <Package className="h-4 w-4" />,
    items: productRoutes,
  },
  // ... other menu items
];