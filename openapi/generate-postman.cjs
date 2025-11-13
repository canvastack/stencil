const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

function generatePostmanCollection() {
    console.log('📬 Generating Postman Collection for Stencil CMS API...\n');
    
    const collection = {
        info: {
            name: "Stencil CMS API - Complete Collection",
            description: "Comprehensive API collection for the Stencil CMS multi-tenant platform",
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
            version: {
                major: 1,
                minor: 0,
                patch: 0
            }
        },
        auth: {
            type: "bearer",
            bearer: [
                {
                    key: "token",
                    value: "{{jwt_token}}",
                    type: "string"
                }
            ]
        },
        event: [
            {
                listen: "prerequest",
                script: {
                    exec: [
                        "// Set tenant ID for multi-tenant isolation",
                        "pm.request.headers.add({",
                        "    key: 'X-Tenant-ID',",
                        "    value: pm.globals.get('tenant_id') || '6ba7b810-9dad-11d1-80b4-00c04fd430c8'",
                        "});",
                        "",
                        "// Set content type for POST/PUT requests",
                        "if (['POST', 'PUT', 'PATCH'].includes(pm.request.method)) {",
                        "    pm.request.headers.add({",
                        "        key: 'Content-Type',",
                        "        value: 'application/json'",
                        "    });",
                        "}"
                    ],
                    type: "text/javascript"
                }
            }
        ],
        variable: [
            {
                key: "base_url",
                value: "https://api.stencil-cms.com/api/v1",
                type: "string"
            },
            {
                key: "tenant_id",
                value: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
                type: "string"
            },
            {
                key: "jwt_token",
                value: "",
                type: "string"
            }
        ],
        item: []
    };
    
    // Add module folders
    const modules = [
        { name: "Authentication", endpoints: generateAuthEndpoints() },
        { name: "Content Management", endpoints: generateContentEndpoints() },
        { name: "E-Commerce", endpoints: generateECommerceEndpoints() },
        { name: "User Management", endpoints: generateUserEndpoints() },
        { name: "System Administration", endpoints: generateSystemEndpoints() },
        { name: "Assets & Media", endpoints: generateAssetsEndpoints() }
    ];
    
    modules.forEach(module => {
        collection.item.push({
            name: module.name,
            item: module.endpoints,
            description: `API endpoints for ${module.name} functionality`
        });
    });
    
    const outputPath = path.join(__dirname, 'generated', 'Stencil-CMS-API.postman_collection.json');
    fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2));
    
    console.log('✅ Postman collection generated successfully!');
    console.log(`📄 File: generated/Stencil-CMS-API.postman_collection.json`);
    console.log(`📊 Modules: ${modules.length}`);
    console.log(`🎯 Total endpoints: ${modules.reduce((sum, m) => sum + m.endpoints.length, 0)}`);
    
    return collection;
}

function generateAuthEndpoints() {
    return [
        {
            name: "Login",
            request: {
                method: "POST",
                header: [
                    {
                        key: "Content-Type",
                        value: "application/json"
                    }
                ],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        email: "admin@example.com",
                        password: "password123"
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/auth/login",
                    host: ["{{base_url}}"],
                    path: ["auth", "login"]
                },
                description: "Authenticate user and retrieve JWT token"
            }
        },
        {
            name: "Register",
            request: {
                method: "POST",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        name: "John Doe",
                        email: "john@example.com",
                        password: "password123",
                        password_confirmation: "password123"
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/auth/register",
                    host: ["{{base_url}}"],
                    path: ["auth", "register"]
                }
            }
        },
        {
            name: "Logout",
            request: {
                method: "POST",
                header: [],
                url: {
                    raw: "{{base_url}}/auth/logout",
                    host: ["{{base_url}}"],
                    path: ["auth", "logout"]
                }
            }
        }
    ];
}

function generateContentEndpoints() {
    return [
        {
            name: "Get Homepage",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/content/homepage",
                    host: ["{{base_url}}"],
                    path: ["content", "homepage"]
                }
            }
        },
        {
            name: "Update Homepage",
            request: {
                method: "PUT",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        title: "Welcome to Our Etching Services",
                        description: "Professional laser etching for all your needs",
                        hero_section: {
                            title: "Precision Etching Solutions",
                            subtitle: "Quality. Precision. Excellence."
                        }
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/content/homepage",
                    host: ["{{base_url}}"],
                    path: ["content", "homepage"]
                }
            }
        },
        {
            name: "Get About Page",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/content/about",
                    host: ["{{base_url}}"],
                    path: ["content", "about"]
                }
            }
        },
        {
            name: "Get Contact Info",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/content/contact",
                    host: ["{{base_url}}"],
                    path: ["content", "contact"]
                }
            }
        },
        {
            name: "Get FAQ List",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/content/faq?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["content", "faq"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        }
    ];
}

function generateECommerceEndpoints() {
    return [
        {
            name: "Get Products",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/products?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["products"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        },
        {
            name: "Create Product",
            request: {
                method: "POST",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        name: "Custom Metal Etching",
                        description: "Professional metal etching service",
                        price: 29.99,
                        category: "etching",
                        production_type: "vendor"
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/products",
                    host: ["{{base_url}}"],
                    path: ["products"]
                }
            }
        },
        {
            name: "Get Orders",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/orders?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["orders"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        },
        {
            name: "Create Order",
            request: {
                method: "POST",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        customer_id: "{{customer_id}}",
                        items: [
                            {
                                product_id: "{{product_id}}",
                                quantity: 1,
                                unit_price: 29.99
                            }
                        ],
                        order_type: "quotation_required"
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/orders",
                    host: ["{{base_url}}"],
                    path: ["orders"]
                }
            }
        },
        {
            name: "Get Inventory",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/inventory?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["inventory"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        }
    ];
}

function generateUserEndpoints() {
    return [
        {
            name: "Get Users",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/users?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["users"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        },
        {
            name: "Get Customers",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/customers?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["customers"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        },
        {
            name: "Create Customer",
            request: {
                method: "POST",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        name: "Acme Corporation",
                        email: "contact@acme.com",
                        phone: "+1-555-0123",
                        customer_type: "business",
                        billing_address: {
                            street: "123 Main St",
                            city: "Anytown",
                            state: "NY",
                            postal_code: "12345",
                            country: "US"
                        }
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/customers",
                    host: ["{{base_url}}"],
                    path: ["customers"]
                }
            }
        },
        {
            name: "Get Vendors",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/vendors?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["vendors"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        }
    ];
}

function generateSystemEndpoints() {
    return [
        {
            name: "Get Settings",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/admin/settings",
                    host: ["{{base_url}}"],
                    path: ["admin", "settings"]
                }
            }
        },
        {
            name: "Update Settings",
            request: {
                method: "PUT",
                header: [],
                body: {
                    mode: "raw",
                    raw: JSON.stringify({
                        site_name: "Acme Etching Services",
                        site_description: "Professional etching services",
                        contact_email: "info@acme-etching.com"
                    }, null, 2)
                },
                url: {
                    raw: "{{base_url}}/admin/settings",
                    host: ["{{base_url}}"],
                    path: ["admin", "settings"]
                }
            }
        },
        {
            name: "Get Financial Reports",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/admin/financial/reports?period=monthly",
                    host: ["{{base_url}}"],
                    path: ["admin", "financial", "reports"],
                    query: [
                        { key: "period", value: "monthly" }
                    ]
                }
            }
        }
    ];
}

function generateAssetsEndpoints() {
    return [
        {
            name: "Get Media Files",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/media?page=1&per_page=20",
                    host: ["{{base_url}}"],
                    path: ["media"],
                    query: [
                        { key: "page", value: "1" },
                        { key: "per_page", value: "20" }
                    ]
                }
            }
        },
        {
            name: "Upload Media File",
            request: {
                method: "POST",
                header: [],
                body: {
                    mode: "formdata",
                    formdata: [
                        {
                            key: "file",
                            type: "file",
                            src: ""
                        },
                        {
                            key: "folder_id",
                            value: "{{folder_id}}",
                            type: "text"
                        },
                        {
                            key: "alt_text",
                            value: "Sample image description",
                            type: "text"
                        }
                    ]
                },
                url: {
                    raw: "{{base_url}}/media/upload",
                    host: ["{{base_url}}"],
                    path: ["media", "upload"]
                }
            }
        },
        {
            name: "Get Themes",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/themes",
                    host: ["{{base_url}}"],
                    path: ["themes"]
                }
            }
        },
        {
            name: "Get Languages",
            request: {
                method: "GET",
                header: [],
                url: {
                    raw: "{{base_url}}/languages",
                    host: ["{{base_url}}"],
                    path: ["languages"]
                }
            }
        }
    ];
}

// Generate the collection
generatePostmanCollection();