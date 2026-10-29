import type { ImgHTMLAttributes } from 'react';
type Props=ImgHTMLAttributes<HTMLImageElement>&{quality?:number;priority?:boolean;fill?:boolean};
export default function PreviewImage({quality,priority,fill,...props}:Props){return <img {...props} loading={priority?'eager':props.loading||'lazy'}/>}
