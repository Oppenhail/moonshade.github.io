import React from 'react'


export function Input({ className = '', ...props }) {
return (
<input
className={`h-10 w-full rounded-xl bg-black/30 border border-white/15 px-3 outline-none focus:ring-2 focus:ring-white/30 ${className}`}
{...props}
/>
)
}