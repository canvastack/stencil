export const THEME_HOOKS = {
  THEME_BEFORE_LOAD: 'theme.before.load',
  THEME_AFTER_LOAD: 'theme.after.load',
  THEME_BEFORE_ACTIVATE: 'theme.before.activate',
  THEME_AFTER_ACTIVATE: 'theme.after.activate',
  THEME_BEFORE_DEACTIVATE: 'theme.before.deactivate',
  THEME_AFTER_DEACTIVATE: 'theme.after.deactivate',
  
  PAGE_BEFORE_RENDER: 'page.before.render',
  PAGE_AFTER_RENDER: 'page.after.render',
  PAGE_CONTENT: 'page.content',
  PAGE_TITLE: 'page.title',
  PAGE_META: 'page.meta',
  
  COMPONENT_BEFORE_RENDER: 'component.before.render',
  COMPONENT_AFTER_RENDER: 'component.after.render',
  COMPONENT_PROPS: 'component.props',
  
  HEADER_BEFORE: 'component.header.before',
  HEADER_AFTER: 'component.header.after',
  HEADER_LOGO: 'component.header.logo',
  HEADER_NAV: 'component.header.nav',
  
  FOOTER_BEFORE: 'component.footer.before',
  FOOTER_AFTER: 'component.footer.after',
  FOOTER_CONTENT: 'component.footer.content',
  
  SIDEBAR_BEFORE: 'component.sidebar.before',
  SIDEBAR_AFTER: 'component.sidebar.after',
  SIDEBAR_WIDGETS: 'component.sidebar.widgets',
  
  DATA_PRODUCTS_FETCH: 'data.products.fetch',
  DATA_PRODUCTS_FILTER: 'data.products.filter',
  DATA_PRODUCTS_SORT: 'data.products.sort',
  DATA_PRODUCT_TRANSFORM: 'data.product.transform',
  DATA_PRODUCT_PRICE: 'data.product.price',
  
  CART_ADD_ITEM: 'cart.add.item',
  CART_REMOVE_ITEM: 'cart.remove.item',
  CART_UPDATE_ITEM: 'cart.update.item',
  CART_CALCULATE_TOTAL: 'cart.calculate.total',
  
  STYLES_INJECT: 'styles.inject',
  STYLES_VARIABLES: 'styles.variables',
  STYLES_THEME_COLORS: 'styles.theme.colors',
  
  ADMIN_MENU: 'admin.menu',
  ADMIN_DASHBOARD_WIDGETS: 'admin.dashboard.widgets',
  ADMIN_SETTINGS_TABS: 'admin.settings.tabs',
  
  API_REQUEST_BEFORE: 'api.request.before',
  API_REQUEST_AFTER: 'api.request.after',
  API_RESPONSE_TRANSFORM: 'api.response.transform',
  API_ERROR_HANDLE: 'api.error.handle'
} as const;

export type ThemeHookName = typeof THEME_HOOKS[keyof typeof THEME_HOOKS];

export const HOOK_DESCRIPTIONS: Record<ThemeHookName, string> = {
  'theme.before.load': 'Fires before a theme is loaded',
  'theme.after.load': 'Fires after a theme is successfully loaded',
  'theme.before.activate': 'Fires before a theme is activated',
  'theme.after.activate': 'Fires after a theme is successfully activated',
  'theme.before.deactivate': 'Fires before a theme is deactivated',
  'theme.after.deactivate': 'Fires after a theme is successfully deactivated',
  
  'page.before.render': 'Fires before a page component renders',
  'page.after.render': 'Fires after a page component renders',
  'page.content': 'Filters the page content',
  'page.title': 'Filters the page title',
  'page.meta': 'Filters the page metadata',
  
  'component.before.render': 'Fires before any component renders',
  'component.after.render': 'Fires after any component renders',
  'component.props': 'Filters component props before rendering',
  
  'component.header.before': 'Renders content before the header',
  'component.header.after': 'Renders content after the header',
  'component.header.logo': 'Filters the header logo',
  'component.header.nav': 'Filters the header navigation',
  
  'component.footer.before': 'Renders content before the footer',
  'component.footer.after': 'Renders content after the footer',
  'component.footer.content': 'Filters the footer content',
  
  'component.sidebar.before': 'Renders content before the sidebar',
  'component.sidebar.after': 'Renders content after the sidebar',
  'component.sidebar.widgets': 'Filters the sidebar widgets',
  
  'data.products.fetch': 'Fires when products are being fetched',
  'data.products.filter': 'Filters the products list',
  'data.products.sort': 'Filters the products sort order',
  'data.product.transform': 'Transforms a single product object',
  'data.product.price': 'Filters a product price',
  
  'cart.add.item': 'Fires when an item is added to cart',
  'cart.remove.item': 'Fires when an item is removed from cart',
  'cart.update.item': 'Fires when a cart item is updated',
  'cart.calculate.total': 'Filters the cart total calculation',
  
  'styles.inject': 'Injects additional CSS styles',
  'styles.variables': 'Filters CSS variables',
  'styles.theme.colors': 'Filters theme color palette',
  
  'admin.menu': 'Filters the admin menu items',
  'admin.dashboard.widgets': 'Filters the admin dashboard widgets',
  'admin.settings.tabs': 'Filters the admin settings tabs',
  
  'api.request.before': 'Fires before an API request',
  'api.request.after': 'Fires after an API request',
  'api.response.transform': 'Transforms API response data',
  'api.error.handle': 'Handles API errors'
};
