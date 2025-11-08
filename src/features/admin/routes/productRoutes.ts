import { Package, LayoutGrid, Settings, FileText } from "lucide-react";

export const productRoutes = [
  {
    path: "",
    element: <ProductList />,
    label: "Product List",
    icon: <Package className="h-4 w-4" />,
  },
  {
    path: "page-content",
    element: <ProductPageContent />,
    label: "Page Content",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    path: "settings",
    element: <ProductSettings />,
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
  },
];