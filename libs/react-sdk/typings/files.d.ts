/// <reference types="react" />
declare module '*.mp4'
declare module '*.ttf'
declare module '*.woff'
declare module '*.webm'
declare module '*.woff2'
declare module '*.svg'
declare module '*.png' {
  const image: string | { src: string }
  export default image
}
declare module '*.webp' {
  const image: string | { src: string }
  export default image
}
