import { Package, LayoutGrid, Settings as SettingsIcon, FileText } from "lucide-react";
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const ProductCatalog = lazy(() => import("../../pages/admin/products/ProductCatalog"));
const ProductPageContent = lazy(() => import("../pages/ProductPageContent"));
const ProductSettings = lazy(() => import("../pages/ProductSettings"));

interface ProductRoute extends RouteObject {
  label: string;
  icon: React.ReactNode;
}

export const productRoutes: ProductRoute[] = [
  {
    path: "",
    element: <ProductCatalog />,
    label: "Product Catalog",
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
    icon: <SettingsIcon className="h-4 w-4" />,
  },
];