import React from 'react'


export function Card({ className = '', ...props }) {
return <div className={`rounded-2xl border border-white/10 bg-white/5 ${className}`} {...props} />
}
export function CardHeader({ className = '', ...props }) {
return <div className={`p-4 border-b border-white/10 ${className}`} {...props} />
}
export function CardTitle({ className = '', ...props }) {
return <div className={`text-lg font-semibold ${className}`} {...props} />
}
export function CardContent({ className = '', ...props }) {
return <div className={`p-4 ${className}`} {...props} />
}