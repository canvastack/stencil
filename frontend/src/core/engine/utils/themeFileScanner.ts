export interface ThemeFile {
  name: string;
  path: string;
  type: 'file' | 'folder';
  language?: string;
  children?: ThemeFile[];
  isOpen?: boolean;
}

const themeFileManifest: Record<string, ThemeFile[]> = {
  'default': [
    {
      name: 'components',
      type: 'folder',
      path: 'components',
      isOpen: true,
      children: [
        {
          name: 'CTASection.tsx',
          type: 'file',
          path: 'components/CTASection.tsx',
          language: 'typescript'
        },
        {
          name: 'Footer.tsx',
          type: 'file',
          path: 'components/Footer.tsx',
          language: 'typescript'
        },
        {
          name: 'Header.tsx',
          type: 'file',
          path: 'components/Header.tsx',
          language: 'typescript'
        },
        {
          name: 'HeroCarousel.tsx',
          type: 'file',
          path: 'components/HeroCarousel.tsx',
          language: 'typescript'
        },
        {
          name: 'Product3DViewer.tsx',
          type: 'file',
          path: 'components/Product3DViewer.tsx',
          language: 'typescript'
        },
        {
          name: 'ScrollToTop.tsx',
          type: 'file',
          path: 'components/ScrollToTop.tsx',
          language: 'typescript'
        },
        {
          name: 'TypingEffect.tsx',
          type: 'file',
          path: 'components/TypingEffect.tsx',
          language: 'typescript'
        }
      ]
    },
    {
      name: 'pages',
      type: 'folder',
      path: 'pages',
      isOpen: true,
      children: [
        {
          name: 'About.tsx',
          type: 'file',
          path: 'pages/About.tsx',
          language: 'typescript'
        },
        {
          name: 'Cart.tsx',
          type: 'file',
          path: 'pages/Cart.tsx',
          language: 'typescript'
        },
        {
          name: 'Contact.tsx',
          type: 'file',
          path: 'pages/Contact.tsx',
          language: 'typescript'
        },
        {
          name: 'FAQ.tsx',
          type: 'file',
          path: 'pages/FAQ.tsx',
          language: 'typescript'
        },
        {
          name: 'Home.tsx',
          type: 'file',
          path: 'pages/Home.tsx',
          language: 'typescript'
        },
        {
          name: 'Index.tsx',
          type: 'file',
          path: 'pages/Index.tsx',
          language: 'typescript'
        },
        {
          name: 'NotFound.tsx',
          type: 'file',
          path: 'pages/NotFound.tsx',
          language: 'typescript'
        },
        {
          name: 'ProductDetail.tsx',
          type: 'file',
          path: 'pages/ProductDetail.tsx',
          language: 'typescript'
        },
        {
          name: 'Products.tsx',
          type: 'file',
          path: 'pages/Products.tsx',
          language: 'typescript'
        }
      ]
    },
    {
      name: 'styles',
      type: 'folder',
      path: 'styles',
      isOpen: true,
      children: [
        {
          name: 'base.css',
          type: 'file',
          path: 'styles/base.css',
          language: 'css'
        },
        {
          name: 'theme.css',
          type: 'file',
          path: 'styles/theme.css',
          language: 'css'
        }
      ]
    },
    {
      name: 'index.ts',
      type: 'file',
      path: 'index.ts',
      language: 'typescript'
    },
    {
      name: 'theme.json',
      type: 'file',
      path: 'theme.json',
      language: 'json'
    }
  ]
};

export function getThemeFileTree(themeName: string): ThemeFile[] {
  return themeFileManifest[themeName] || [];
}

export function findFileInTree(tree: ThemeFile[], filePath: string): ThemeFile | null {
  for (const node of tree) {
    if (node.path === filePath) {
      return node;
    }
    if (node.children) {
      const found = findFileInTree(node.children, filePath);
      if (found) return found;
    }
  }
  return null;
}

export function getAllFilePaths(tree: ThemeFile[]): string[] {
  const paths: string[] = [];
  
  function traverse(nodes: ThemeFile[]) {
    for (const node of nodes) {
      if (node.type === 'file') {
        paths.push(node.path);
      }
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(tree);
  return paths;
}

export async function loadThemeFileContent(themeName: string, filePath: string): Promise<string> {
  try {
    const response = await fetch(`/src/themes/${themeName}/${filePath}`);
    if (!response.ok) {
      throw new Error(`Failed to load file: ${filePath}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading file ${filePath}:`, error);
    
    return getPlaceholderContent(filePath);
  }
}

function getPlaceholderContent(filePath: string): string {
  if (filePath.endsWith('.tsx')) {
    return `import React from 'react';

// TODO: Implement ${filePath}

export default function Component() {
  return (
    <div>
      <h1>${filePath}</h1>
      <p>This component is not yet implemented.</p>
    </div>
  );
}
`;
  } else if (filePath.endsWith('.css')) {
    return `/* Styles for ${filePath} */

:root {
  /* Add your theme variables here */
}

/* Add your styles here */
`;
  } else if (filePath.endsWith('.json')) {
    return `{
  "name": "theme-file",
  "path": "${filePath}"
}
`;
  } else {
    return `// ${filePath}

// File content goes here
`;
  }
}
