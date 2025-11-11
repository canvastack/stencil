import{j as e}from"./ui-vendor-CJNjIdOR.js";import{as as q,C as g,d as j,ap as I,a as M,b as V,aa as Q,c as R,ag as u,L as h,a0 as W,e as X,a9 as Y,an as _,ax as ee,I as z,T as se,af as te,B as y,K as ae,s as oe}from"./index-Dj8ncPAG.js";import{r as B,c as ne}from"./react-vendor-92AQlTAG.js";import{P as re}from"./progress-CY2a3gIY.js";import{A as J,a as U}from"./alert-DrVHkPlt.js";import{J as ce}from"./jszip.min-VaQned3v.js";import{I as ie}from"./info-DMpDVy7a.js";import{D as me}from"./download-C93Gk9fO.js";import"./three-vendor-CVohgf7y.js";function le(){const{currentTheme:s,currentThemeName:N}=q(),[o,H]=B.useState({includeComponents:!0,includeAssets:!0,includeStyles:!0,includeDocumentation:!0,includeMetadata:!0,customName:"",customVersion:"",customDescription:""}),[c,r]=B.useState({isExporting:!1,exportProgress:0,exportComplete:!1,exportError:null,exportedFileName:null}),l=(t,d)=>{H(x=>({...x,[t]:d}))},Z=async()=>{var x,p,f,C,v,b,$,E,k,w,S,T,D,A,P,O,F,L;const t=new ce;if(!s)throw new Error("No active theme to export");if(r(a=>({...a,exportProgress:10})),o.includeMetadata){const a={...s.metadata,name:o.customName||s.metadata.name,version:o.customVersion||s.metadata.version,description:o.customDescription||s.metadata.description,exportedAt:new Date().toISOString(),exportedBy:"Theme Manager"};t.file("theme.json",JSON.stringify(a,null,2)),r(n=>({...n,exportProgress:20}))}if(o.includeComponents){const a=t.folder("components");Object.entries(s.components).forEach(([n,i])=>{if(i){const m=`import React from 'react';

export interface ${n}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${n}: React.FC<${n}Props> = ({ className, children, ...props }) => {
  return (
    <div className={className} {...props}>
      {/* ${n} component implementation */}
      {children}
    </div>
  );
};

export default ${n};
`;a==null||a.file(`${n}.tsx`,m)}}),r(n=>({...n,exportProgress:40}))}if(o.includeAssets){const a=t.folder("assets");if((x=s.assets)!=null&&x.images){const n=a==null?void 0:a.folder("images");Object.entries(s.assets.images).forEach(([i,m])=>{n==null||n.file(`${i}.placeholder`,`Image placeholder for ${m}`)})}if((p=s.assets)!=null&&p.fonts){const n=a==null?void 0:a.folder("fonts");Object.entries(s.assets.fonts).forEach(([i,m])=>{n==null||n.file(`${i}.placeholder`,`Font placeholder for ${m}`)})}r(n=>({...n,exportProgress:60}))}if(o.includeStyles){const a=t.folder("styles"),n=`/* ${s.metadata.name} Theme Styles */

:root {
  --primary: ${((C=(f=s.config)==null?void 0:f.colors)==null?void 0:C.primary)||"#3b82f6"};
  --secondary: ${((b=(v=s.config)==null?void 0:v.colors)==null?void 0:b.secondary)||"#64748b"};
  --accent: ${((E=($=s.config)==null?void 0:$.colors)==null?void 0:E.accent)||"#f59e0b"};
  --background: ${((w=(k=s.config)==null?void 0:k.colors)==null?void 0:w.background)||"#ffffff"};
  --foreground: ${((T=(S=s.config)==null?void 0:S.colors)==null?void 0:T.foreground)||"#1f2937"};
}

body {
  font-family: ${((A=(D=s.config)==null?void 0:D.typography)==null?void 0:A.fontFamily)||"Inter, system-ui, sans-serif"};
  font-size: ${((F=(O=(P=s.config)==null?void 0:P.typography)==null?void 0:O.fontSize)==null?void 0:F.base)||"16px"};
}

/* Add your custom styles here */
`;a==null||a.file("main.css",n),a==null||a.file("components.css",`/* Component Styles */

.theme-header {
  /* Header component styles */
}

.theme-footer {
  /* Footer component styles */
}

/* Add more component styles as needed */
`),r(m=>({...m,exportProgress:80}))}if(o.includeDocumentation){const a=`# ${s.metadata.name}

${s.metadata.description}

## Installation

1. Upload the theme ZIP file through the Theme Manager
2. Activate the theme from the dashboard
3. Customize settings as needed

## Features

${(L=s.config)!=null&&L.features?Object.entries(s.config.features).map(([i,m])=>`- ${i}: ${m?"Enabled":"Disabled"}`).join(`
`):"- No specific features documented"}

## Components

${Object.keys(s.components).map(i=>`- ${i}`).join(`
`)}

## Configuration

This theme supports the following configuration options:

- Colors: Primary, Secondary, Accent, Background, Foreground
- Typography: Font family, sizes, weights
- Layout: Max width, spacing, border radius
- Features: Dark mode, animations, lazy loading

## Author

${s.metadata.author}

## Version

${s.metadata.version}

## License

${s.metadata.license||"Not specified"}
`;t.file("README.md",a);const n={name:(o.customName||s.metadata.name).toLowerCase().replace(/\s+/g,"-"),version:o.customVersion||s.metadata.version,description:o.customDescription||s.metadata.description,main:"index.ts",author:s.metadata.author,license:s.metadata.license||"MIT",keywords:s.metadata.keywords||["theme","react","typescript"],peerDependencies:{react:"^18.0.0","react-dom":"^18.0.0"}};t.file("package.json",JSON.stringify(n,null,2))}const d=`import { Theme } from '@/core/engine/types';
${Object.keys(s.components).map(a=>`import ${a} from './components/${a}';`).join(`
`)}

const theme: Theme = {
  metadata: {
    name: '${o.customName||s.metadata.name}',
    version: '${o.customVersion||s.metadata.version}',
    description: '${o.customDescription||s.metadata.description}',
    author: '${s.metadata.author}',
    license: '${s.metadata.license||"MIT"}'
  },
  components: {
${Object.keys(s.components).map(a=>`    ${a},`).join(`
`)}
  },
  assets: {
    styles: ['/themes/${N}/styles/main.css'],
    images: {},
    fonts: {}
  },
  config: ${JSON.stringify(s.config||{},null,4)}
};

export default theme;
`;return t.file("index.ts",d),r(a=>({...a,exportProgress:100})),await t.generateAsync({type:"blob"})},G=async()=>{if(!s){r(t=>({...t,exportError:"No active theme to export"}));return}r(t=>({...t,isExporting:!0,exportProgress:0,exportError:null,exportComplete:!1}));try{const t=await Z(),d=`${(o.customName||s.metadata.name).toLowerCase().replace(/\s+/g,"-")}-v${o.customVersion||s.metadata.version}.zip`,x=URL.createObjectURL(t),p=document.createElement("a");p.href=x,p.download=d,document.body.appendChild(p),p.click(),document.body.removeChild(p),URL.revokeObjectURL(x),r(f=>({...f,isExporting:!1,exportComplete:!0,exportedFileName:d}))}catch(t){console.error("Export failed:",t),r(d=>({...d,isExporting:!1,exportError:t instanceof Error?t.message:"Export failed"}))}},K=()=>{r({isExporting:!1,exportProgress:0,exportComplete:!1,exportError:null,exportedFileName:null})};return s?e.jsxs("div",{className:"space-y-6",children:[e.jsxs(g,{children:[e.jsxs(M,{children:[e.jsxs(V,{className:"flex items-center gap-2",children:[e.jsx(Q,{className:"h-5 w-5"}),"Export Theme: ",s.metadata.name]}),e.jsx(R,{children:"Create a downloadable package of your current theme"})]}),e.jsx(j,{children:e.jsxs("div",{className:"grid md:grid-cols-2 gap-4 text-sm",children:[e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Current Version:"}),e.jsx("p",{children:s.metadata.version})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Author:"}),e.jsx("p",{children:s.metadata.author})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Components:"}),e.jsxs("p",{children:[Object.keys(s.components).length," components"]})]}),e.jsxs("div",{children:[e.jsx("span",{className:"font-medium",children:"Last Modified:"}),e.jsx("p",{children:new Date().toLocaleDateString()})]})]})})]}),e.jsxs(g,{children:[e.jsxs(M,{children:[e.jsx(V,{children:"Export Options"}),e.jsx(R,{children:"Choose what to include in your theme package"})]}),e.jsxs(j,{className:"space-y-6",children:[e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium mb-3",children:"Package Contents"}),e.jsxs("div",{className:"grid md:grid-cols-2 gap-4",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(u,{id:"components",checked:o.includeComponents,onCheckedChange:t=>l("includeComponents",!!t)}),e.jsxs(h,{htmlFor:"components",className:"flex items-center gap-2",children:[e.jsx(W,{className:"h-4 w-4"}),"Components"]})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(u,{id:"assets",checked:o.includeAssets,onCheckedChange:t=>l("includeAssets",!!t)}),e.jsxs(h,{htmlFor:"assets",className:"flex items-center gap-2",children:[e.jsx(X,{className:"h-4 w-4"}),"Assets (Images, Fonts)"]})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(u,{id:"styles",checked:o.includeStyles,onCheckedChange:t=>l("includeStyles",!!t)}),e.jsxs(h,{htmlFor:"styles",className:"flex items-center gap-2",children:[e.jsx(Y,{className:"h-4 w-4"}),"Styles & Configuration"]})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(u,{id:"documentation",checked:o.includeDocumentation,onCheckedChange:t=>l("includeDocumentation",!!t)}),e.jsxs(h,{htmlFor:"documentation",className:"flex items-center gap-2",children:[e.jsx(_,{className:"h-4 w-4"}),"Documentation"]})]}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(u,{id:"metadata",checked:o.includeMetadata,onCheckedChange:t=>l("includeMetadata",!!t)}),e.jsxs(h,{htmlFor:"metadata",className:"flex items-center gap-2",children:[e.jsx(ie,{className:"h-4 w-4"}),"Theme Metadata"]})]})]})]})]}),e.jsx(ee,{}),e.jsxs("div",{children:[e.jsx("h3",{className:"font-medium mb-3",children:"Custom Metadata (Optional)"}),e.jsxs("div",{className:"grid md:grid-cols-2 gap-4",children:[e.jsxs("div",{children:[e.jsx(h,{htmlFor:"customName",children:"Theme Name"}),e.jsx(z,{id:"customName",placeholder:s.metadata.name,value:o.customName,onChange:t=>l("customName",t.target.value)})]}),e.jsxs("div",{children:[e.jsx(h,{htmlFor:"customVersion",children:"Version"}),e.jsx(z,{id:"customVersion",placeholder:s.metadata.version,value:o.customVersion,onChange:t=>l("customVersion",t.target.value)})]})]}),e.jsxs("div",{className:"mt-4",children:[e.jsx(h,{htmlFor:"customDescription",children:"Description"}),e.jsx(se,{id:"customDescription",placeholder:s.metadata.description,value:o.customDescription,onChange:t=>l("customDescription",t.target.value),rows:3})]})]})]})]}),c.isExporting&&e.jsx(g,{children:e.jsx(j,{className:"p-6",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"font-medium",children:"Generating theme package..."}),e.jsxs("span",{className:"text-sm text-muted-foreground",children:[c.exportProgress,"%"]})]}),e.jsx(re,{value:c.exportProgress,className:"h-2"})]})})}),c.exportError&&e.jsxs(J,{variant:"destructive",children:[e.jsx(I,{className:"h-4 w-4"}),e.jsxs(U,{children:["Export failed: ",c.exportError]})]}),c.exportComplete&&e.jsxs(J,{children:[e.jsx(te,{className:"h-4 w-4"}),e.jsxs(U,{children:["Theme exported successfully as ",e.jsx("strong",{children:c.exportedFileName})]})]}),e.jsxs("div",{className:"flex justify-end gap-2",children:[c.exportComplete&&e.jsx(y,{variant:"outline",onClick:K,children:"Export Another"}),e.jsx(y,{onClick:G,disabled:c.isExporting||!o.includeComponents&&!o.includeAssets&&!o.includeStyles,children:c.isExporting?e.jsxs(e.Fragment,{children:[e.jsx(ae,{className:"h-4 w-4 mr-2 animate-spin"}),"Exporting..."]}):e.jsxs(e.Fragment,{children:[e.jsx(me,{className:"h-4 w-4 mr-2"}),"Export Theme"]})})]})]}):e.jsx(g,{children:e.jsx(j,{className:"p-6",children:e.jsxs("div",{className:"text-center py-8",children:[e.jsx(I,{className:"h-12 w-12 text-muted-foreground mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"No Active Theme"}),e.jsx("p",{className:"text-muted-foreground",children:"Please activate a theme before attempting to export."})]})})})}function ye(){const s=ne(),N=()=>{s("/admin/themes")};return e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(y,{variant:"outline",size:"sm",onClick:N,children:[e.jsx(oe,{className:"h-4 w-4 mr-2"}),"Back to Themes"]}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"Export Theme"}),e.jsx("p",{className:"text-muted-foreground",children:"Create a downloadable package of your current theme"})]})]}),e.jsx(le,{})]})}export{ye as default};
