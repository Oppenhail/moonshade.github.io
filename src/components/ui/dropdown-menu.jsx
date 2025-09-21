import React from 'react'
import * as RD from '@radix-ui/react-dropdown-menu'


export function DropdownMenu({ children }) { return <RD.Root>{children}</RD.Root> }
export function DropdownMenuTrigger({ asChild = false, children }) { return <RD.Trigger asChild={asChild}>{children}</RD.Trigger> }
export function DropdownMenuContent({ className = '', align = 'start', children }) {
return (
<RD.Portal>
<RD.Content align={align} className={`z-50 min-w-[12rem] rounded-xl border border-white/10 bg-black/80 backdrop-blur p-2 shadow-xl ${className}`}>
{children}
</RD.Content>
</RD.Portal>
)
}
export function DropdownMenuItem({ className = '', ...props }) {
return <RD.Item className={`px-3 py-2 rounded-lg hover:bg-white/10 cursor-pointer ${className}`} {...props} />
}