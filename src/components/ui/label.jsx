import React from 'react'
export function Label({ className = '', ...props }) {
return <label className={`block text-sm text-white/80 mb-1 ${className}`} {...props} />
}