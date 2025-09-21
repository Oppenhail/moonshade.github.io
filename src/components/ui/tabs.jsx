import React from 'react'
import * as RT from '@radix-ui/react-tabs'


export function Tabs({ value, onValueChange, children }) {
return <RT.Root value={value} onValueChange={onValueChange}>{children}</RT.Root>
}
export function TabsList({ className = '', ...props }) {
return <RT.List className={`inline-grid gap-2 bg-white/5 p-2 rounded-2xl ${className}`} {...props} />
}
export function TabsTrigger({ className = '', value, children }) {
return (
<RT.Trigger value={value} className={`px-4 py-2 rounded-xl data-[state=active]:bg-white data-[state=active]:text-black hover:bg-white/10 ${className}`}>
{children}
</RT.Trigger>
)
}
export function TabsContent({ className = '', value, children }) {
return <RT.Content value={value} className={className}>{children}</RT.Content>
}