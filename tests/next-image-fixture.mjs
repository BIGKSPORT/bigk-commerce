// Resolve the actual Next Image component's named CJS export in the standalone
// esbuild fixture. Next.js handles this interop itself in the application build.
export { Image as default } from 'next/dist/client/image-component.js';
