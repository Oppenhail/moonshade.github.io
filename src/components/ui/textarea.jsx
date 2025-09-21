import React from 'react'


export function Textarea({ className = '', rows = 4, ...props }) {
return (
<textarea
rows={rows}
className={`w-full rounded-xl bg-black/30 border border-white/15 px-3 py-2 outline-none focus:ring-2 focus:ring-white/30 ${className}`}
{...props}
/>
)
}