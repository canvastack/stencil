import{j as e}from"./ui-vendor-CzLWDOsI.js";import{r as u,c as Q,h as X}from"./react-vendor-92AQlTAG.js";import{C as V,a as H,R as K,b as G,i as I,S as Z,q as ee,r as se,s as te,t as ae,B as k,a3 as ne,aq as W,d as J,am as re,ai as oe,p as ie,E as ce,ag as le}from"./index-CA1Fui7q.js";import{A as q,a as Y}from"./alert-ByRl8DZI.js";import{M as de,a as me}from"./minimize-2-ntLFqfDl.js";import{S as _}from"./save-CMcfDeBZ.js";import{I as ue}from"./info-D97ENJ6t.js";import{F as he}from"./folder-D5YcqpnH.js";import"./three-vendor-CaHj5NkI.js";const fe=[{value:"typescript",label:"TypeScript",extension:".tsx"},{value:"javascript",label:"JavaScript",extension:".jsx"},{value:"css",label:"CSS",extension:".css"},{value:"json",label:"JSON",extension:".json"},{value:"html",label:"HTML",extension:".html"},{value:"markdown",label:"Markdown",extension:".md"}];function pe({value:F,onChange:T,language:s="typescript",theme:B="light",readOnly:r=!1,height:p="400px",onSave:S,fileName:N}){const E=u.useRef(null),[m,$]=u.useState({isFullscreen:!1,hasChanges:!1,lastSaved:null,cursorPosition:{line:1,column:1}}),[g,L]=u.useState(F),[v,R]=u.useState(s);u.useEffect(()=>{L(F),$(a=>({...a,hasChanges:!1}))},[F]);const y=u.useCallback(a=>{L(a),T(a),$(o=>({...o,hasChanges:!0}))},[T]),M=u.useCallback(()=>{S&&(S(),$(a=>({...a,hasChanges:!1,lastSaved:new Date})))},[S]),O=u.useCallback(a=>{if(a.ctrlKey&&a.key==="s"&&(a.preventDefault(),M()),a.key==="Tab"){a.preventDefault();const o=a.target,l=o.selectionStart,d=o.selectionEnd,c=g.substring(0,l)+"  "+g.substring(d);y(c),setTimeout(()=>{o.selectionStart=o.selectionEnd=l+2},0)}},[g,y,M]),t=u.useCallback(()=>{if(E.current){const a=E.current,l=a.value.substring(0,a.selectionStart).split(`
`),d=l.length,c=l[l.length-1].length+1;$(f=>({...f,cursorPosition:{line:d,column:c}}))}},[]),n=()=>{$(a=>({...a,isFullscreen:!a.isFullscreen}))},i=()=>{try{if(v==="json"){const a=JSON.parse(g),o=JSON.stringify(a,null,2);y(o)}else{const a=g.split(`
`);let o=0;const l=a.map(d=>{const c=d.trim();(c.includes("}")||c.includes("]")||c.includes("</"))&&(o=Math.max(0,o-1));const f="  ".repeat(o)+c;return(c.includes("{")||c.includes("[")||c.includes("<"))&&o++,f}).join(`
`);y(l)}}catch(a){console.warn("Failed to format code:",a)}},h=a=>{var d;const o=(d=a.split(".").pop())==null?void 0:d.toLowerCase();return{tsx:"typescript",ts:"typescript",jsx:"javascript",js:"javascript",css:"css",json:"json",html:"html",md:"markdown"}[o||""]||"typescript"};u.useEffect(()=>{if(N){const a=h(N);R(a)}},[N]);const x=`
    w-full p-4 font-mono text-sm border rounded-md resize-none
    ${B==="dark"?"bg-gray-900 text-gray-100 border-gray-700":"bg-white text-gray-900 border-gray-300"}
    ${r?"cursor-not-allowed opacity-75":""}
    focus:outline-none focus:ring-2 focus:ring-blue-500
  `,j=m.isFullscreen?"fixed inset-0 z-50 bg-background p-4":"";return e.jsxs("div",{className:j,children:[e.jsxs(V,{className:m.isFullscreen?"h-full flex flex-col":"",children:[e.jsxs(H,{className:"pb-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(K,{className:"h-5 w-5"}),e.jsx(G,{className:"text-base",children:N||"Code Editor"}),m.hasChanges&&e.jsx(I,{variant:"secondary",className:"text-xs",children:"Unsaved"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs(Z,{value:v,onValueChange:R,children:[e.jsx(ee,{className:"w-32",children:e.jsx(se,{})}),e.jsx(te,{children:fe.map(a=>e.jsx(ae,{value:a.value,children:a.label},a.value))})]}),e.jsx(k,{variant:"outline",size:"sm",onClick:i,disabled:r,children:e.jsx(ne,{className:"h-4 w-4"})}),e.jsx(k,{variant:"outline",size:"sm",onClick:n,children:m.isFullscreen?e.jsx(de,{className:"h-4 w-4"}):e.jsx(me,{className:"h-4 w-4"})}),S&&e.jsxs(k,{size:"sm",onClick:M,disabled:!m.hasChanges||r,children:[e.jsx(_,{className:"h-4 w-4 mr-2"}),"Save"]})]})]}),e.jsxs("div",{className:"flex items-center justify-between text-xs text-muted-foreground",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("span",{children:["Line ",m.cursorPosition.line,", Column ",m.cursorPosition.column]}),e.jsxs("span",{children:[g.length," characters"]}),e.jsxs("span",{children:[g.split(`
`).length," lines"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[m.lastSaved&&e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(W,{className:"h-3 w-3 text-green-600"}),"Saved ",m.lastSaved.toLocaleTimeString()]}),e.jsx(I,{variant:"outline",className:"text-xs",children:v.toUpperCase()})]})]})]}),e.jsxs(J,{className:m.isFullscreen?"flex-1 flex flex-col":"",children:[e.jsx("textarea",{ref:E,value:g,onChange:a=>y(a.target.value),onKeyDown:O,onSelect:t,onClick:t,className:x,style:{height:m.isFullscreen?"100%":p,minHeight:m.isFullscreen?"100%":"200px"},readOnly:r,placeholder:`Enter your ${v} code here...`,spellCheck:!1}),!r&&e.jsx("div",{className:"mt-2 text-xs text-muted-foreground",children:e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("span",{children:"Press Ctrl+S to save"}),e.jsx("span",{children:"Press Tab for indentation"}),e.jsx("span",{children:"Use the format button to auto-format code"})]})})]})]}),m.isFullscreen&&e.jsxs(q,{className:"mt-4",children:[e.jsx(ue,{className:"h-4 w-4"}),e.jsxs(Y,{children:[e.jsx("strong",{children:"Keyboard Shortcuts:"})," Ctrl+S (Save), Tab (Indent), Esc (Exit Fullscreen)"]})]})]})}function $e(){const F=Q(),[T]=X(),{currentTheme:s,currentThemeName:B}=re(),[r,p]=u.useState({currentFile:null,files:[],hasUnsavedChanges:!1,previewMode:!1,saveStatus:"idle"}),[S,N]=u.useState("");u.useEffect(()=>{if(s){const t=[];t.push({name:"theme.json",path:"theme.json",type:"file",content:JSON.stringify(s.metadata,null,2),language:"json"}),t.push({name:"index.ts",path:"index.ts",type:"file",content:E(),language:"typescript"}),Object.keys(s.components).forEach(i=>{t.push({name:`${i}.tsx`,path:`components/${i}.tsx`,type:"file",content:m(i),language:"typescript"})}),t.push({name:"main.css",path:"styles/main.css",type:"file",content:$(),language:"css"}),t.push({name:"components.css",path:"styles/components.css",type:"file",content:g(),language:"css"}),t.push({name:"README.md",path:"README.md",type:"file",content:L(),language:"markdown"}),p(i=>({...i,files:t}));const n=T.get("file");if(n){const i=t.find(h=>h.name===n);i&&v(i)}else t.length>0&&v(t[0])}},[s,T]);const E=()=>s?`import { Theme } from '@/core/engine/types';
${Object.keys(s.components).map(t=>`import ${t} from './components/${t}';`).join(`
`)}

const theme: Theme = {
  metadata: {
    name: '${s.metadata.name}',
    version: '${s.metadata.version}',
    description: '${s.metadata.description}',
    author: '${s.metadata.author}',
    license: '${s.metadata.license||"MIT"}'
  },
  components: {
${Object.keys(s.components).map(t=>`    ${t},`).join(`
`)}
  },
  assets: {
    styles: ['/themes/${B}/styles/main.css'],
    images: {},
    fonts: {}
  },
  config: ${JSON.stringify(s.config||{},null,4)}
};

export default theme;
`:"",m=t=>`import React from 'react';

export interface ${t}Props {
  className?: string;
  children?: React.ReactNode;
}

const ${t}: React.FC<${t}Props> = ({ 
  className, 
  children, 
  ...props 
}) => {
  return (
    <div className={className} {...props}>
      {/* ${t} component implementation */}
      <h2>${t} Component</h2>
      {children}
    </div>
  );
};

export default ${t};
`,$=()=>{var t,n,i,h,x,j,a,o,l,d,c,f,b,C,P,U,z,A,w,D;return s?`/* ${s.metadata.name} Theme Styles */

:root {
  --primary: ${((n=(t=s.config)==null?void 0:t.colors)==null?void 0:n.primary)||"#3b82f6"};
  --secondary: ${((h=(i=s.config)==null?void 0:i.colors)==null?void 0:h.secondary)||"#64748b"};
  --accent: ${((j=(x=s.config)==null?void 0:x.colors)==null?void 0:j.accent)||"#f59e0b"};
  --background: ${((o=(a=s.config)==null?void 0:a.colors)==null?void 0:o.background)||"#ffffff"};
  --foreground: ${((d=(l=s.config)==null?void 0:l.colors)==null?void 0:d.foreground)||"#1f2937"};
}

body {
  font-family: ${((f=(c=s.config)==null?void 0:c.typography)==null?void 0:f.fontFamily)||"Inter, system-ui, sans-serif"};
  font-size: ${((P=(C=(b=s.config)==null?void 0:b.typography)==null?void 0:C.fontSize)==null?void 0:P.base)||"16px"};
  background-color: var(--background);
  color: var(--foreground);
}

/* Global Styles */
.container {
  max-width: ${((z=(U=s.config)==null?void 0:U.layout)==null?void 0:z.maxWidth)||"1200px"};
  margin: 0 auto;
  padding: 0 ${((D=(w=(A=s.config)==null?void 0:A.layout)==null?void 0:w.spacing)==null?void 0:D.md)||"1.5rem"};
}

/* Add your custom styles here */
`:""},g=()=>{var t,n,i,h,x,j,a,o,l,d,c,f,b,C;return s?`/* Component Styles for ${s.metadata.name} */

/* Header Styles */
.theme-header {
  background-color: var(--background);
  border-bottom: 1px solid var(--secondary);
  padding: ${((i=(n=(t=s.config)==null?void 0:t.layout)==null?void 0:n.spacing)==null?void 0:i.md)||"1.5rem"} 0;
}

/* Footer Styles */
.theme-footer {
  background-color: var(--secondary);
  color: var(--background);
  padding: ${((j=(x=(h=s.config)==null?void 0:h.layout)==null?void 0:x.spacing)==null?void 0:j.lg)||"2rem"} 0;
  margin-top: auto;
}

/* Button Styles */
.theme-button {
  background-color: var(--primary);
  color: var(--background);
  padding: ${((l=(o=(a=s.config)==null?void 0:a.layout)==null?void 0:o.spacing)==null?void 0:l.sm)||"1rem"} ${((f=(c=(d=s.config)==null?void 0:d.layout)==null?void 0:c.spacing)==null?void 0:f.md)||"1.5rem"};
  border-radius: ${((C=(b=s.config)==null?void 0:b.layout)==null?void 0:C.borderRadius)||"0.375rem"};
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Add more component styles as needed */
`:""},L=()=>{var t,n,i,h,x,j,a,o,l,d,c,f,b,C,P,U,z,A;return s?`# ${s.metadata.name}

${s.metadata.description}

## Installation

1. Upload this theme package through the Theme Manager
2. Activate the theme from the dashboard
3. Customize settings as needed

## Features

${(t=s.config)!=null&&t.features?Object.entries(s.config.features).map(([w,D])=>`- **${w}**: ${D?"Enabled":"Disabled"}`).join(`
`):"- No specific features documented"}

## Components

This theme includes the following components:

${Object.keys(s.components).map(w=>`- **${w}**: Theme component for ${w.toLowerCase()}`).join(`
`)}

## Customization

### Colors

The theme uses CSS custom properties for easy color customization:

- \`--primary\`: ${((i=(n=s.config)==null?void 0:n.colors)==null?void 0:i.primary)||"#3b82f6"}
- \`--secondary\`: ${((x=(h=s.config)==null?void 0:h.colors)==null?void 0:x.secondary)||"#64748b"}
- \`--accent\`: ${((a=(j=s.config)==null?void 0:j.colors)==null?void 0:a.accent)||"#f59e0b"}
- \`--background\`: ${((l=(o=s.config)==null?void 0:o.colors)==null?void 0:l.background)||"#ffffff"}
- \`--foreground\`: ${((c=(d=s.config)==null?void 0:d.colors)==null?void 0:c.foreground)||"#1f2937"}

### Typography

- **Font Family**: ${((b=(f=s.config)==null?void 0:f.typography)==null?void 0:b.fontFamily)||"Inter, system-ui, sans-serif"}
- **Base Font Size**: ${((U=(P=(C=s.config)==null?void 0:C.typography)==null?void 0:P.fontSize)==null?void 0:U.base)||"16px"}

### Layout

- **Max Width**: ${((A=(z=s.config)==null?void 0:z.layout)==null?void 0:A.maxWidth)||"1200px"}
- **Spacing**: Consistent spacing scale using CSS custom properties

## Development

To modify this theme:

1. Edit the component files in the \`components/\` directory
2. Update styles in the \`styles/\` directory
3. Modify theme configuration in \`index.ts\`
4. Test your changes using the preview feature

## Author

**${s.metadata.author}**

## Version

${s.metadata.version}

## License

${s.metadata.license||"MIT"}
`:""},v=t=>{p(n=>({...n,currentFile:t})),N(t.content||"")},R=t=>{N(t),p(n=>({...n,hasUnsavedChanges:!0,saveStatus:"idle"}))},y=async()=>{if(r.currentFile){p(t=>({...t,saveStatus:"saving"}));try{const t=r.files.map(n=>{var i;return n.path===((i=r.currentFile)==null?void 0:i.path)?{...n,content:S,modified:!0}:n});p(n=>({...n,files:t,hasUnsavedChanges:!1,saveStatus:"saved"})),setTimeout(()=>{p(n=>({...n,saveStatus:"idle"}))},3e3)}catch(t){console.error("Failed to save file:",t),p(n=>({...n,saveStatus:"error"}))}}},M=()=>{r.hasUnsavedChanges?confirm("You have unsaved changes. Are you sure you want to leave?")&&F("/admin/themes"):F("/admin/themes")},O=()=>{p(t=>({...t,previewMode:!t.previewMode}))};return s?e.jsxs("div",{className:"p-6 space-y-6",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs(k,{variant:"outline",size:"sm",onClick:M,children:[e.jsx(ie,{className:"h-4 w-4 mr-2"}),"Back to Themes"]}),e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"Theme Code Editor"}),e.jsxs("p",{className:"text-muted-foreground",children:["Edit ",s.metadata.name," theme files"]})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[r.hasUnsavedChanges&&e.jsx(I,{variant:"secondary",children:"Unsaved Changes"}),r.saveStatus==="saved"&&e.jsxs(I,{variant:"default",className:"bg-green-600",children:[e.jsx(W,{className:"h-3 w-3 mr-1"}),"Saved"]}),e.jsxs(k,{variant:"outline",onClick:O,children:[e.jsx(ce,{className:"h-4 w-4 mr-2"}),r.previewMode?"Edit":"Preview"]}),e.jsxs(k,{onClick:y,disabled:!r.hasUnsavedChanges||r.saveStatus==="saving",children:[e.jsx(_,{className:"h-4 w-4 mr-2"}),r.saveStatus==="saving"?"Saving...":"Save"]})]})]}),e.jsxs("div",{className:"grid grid-cols-12 gap-6 h-[calc(100vh-200px)]",children:[e.jsx("div",{className:"col-span-3",children:e.jsxs(V,{className:"h-full",children:[e.jsx(H,{children:e.jsxs(G,{className:"text-base flex items-center gap-2",children:[e.jsx(he,{className:"h-4 w-4"}),"Files"]})}),e.jsx(J,{className:"p-0",children:e.jsx("div",{className:"space-y-1",children:r.files.map(t=>{var n;return e.jsxs("button",{onClick:()=>v(t),className:`w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${((n=r.currentFile)==null?void 0:n.path)===t.path?"bg-muted":""}`,children:[e.jsx(le,{className:"h-4 w-4"}),e.jsx("span",{className:"truncate",children:t.name}),t.modified&&e.jsx("div",{className:"w-2 h-2 bg-blue-600 rounded-full ml-auto"})]},t.path)})})})]})}),e.jsx("div",{className:"col-span-9",children:r.currentFile?e.jsx(pe,{value:S,onChange:R,language:r.currentFile.language,height:"100%",onSave:y,fileName:r.currentFile.name,readOnly:r.previewMode}):e.jsx(V,{className:"h-full",children:e.jsx(J,{className:"h-full flex items-center justify-center",children:e.jsxs("div",{className:"text-center",children:[e.jsx(K,{className:"h-12 w-12 text-muted-foreground mx-auto mb-4"}),e.jsx("h3",{className:"text-lg font-semibold mb-2",children:"No File Selected"}),e.jsx("p",{className:"text-muted-foreground",children:"Select a file from the explorer to start editing"})]})})})})]}),e.jsxs("div",{className:"flex items-center justify-between text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("span",{children:["Theme: ",s.metadata.name]}),e.jsxs("span",{children:["Version: ",s.metadata.version]}),r.currentFile&&e.jsxs("span",{children:["Editing: ",r.currentFile.name]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[r.hasUnsavedChanges&&e.jsx("span",{className:"text-orange-600",children:"● Unsaved changes"}),e.jsxs("span",{children:["Files: ",r.files.length]})]})]})]}):e.jsx("div",{className:"p-6",children:e.jsxs(q,{variant:"destructive",children:[e.jsx(oe,{className:"h-4 w-4"}),e.jsx(Y,{children:"No active theme found. Please activate a theme first."})]})})}export{$e as default};
