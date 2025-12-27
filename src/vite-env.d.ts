/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

// this is needed for importing CSS files in TypeScript with Vite