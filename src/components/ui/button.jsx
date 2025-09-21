import React from 'react'
import cx from 'classnames'


export function Button({ variant = 'default', size = 'md', className, ...props }) {
const base = 'inline-flex items-center justify-center rounded-2xl shadow-sm transition px-4 py-2';
const variants = {
default: 'bg-white text-black hover:opacity-90',
outline: 'border border-white/20 hover:bg-white/10',
secondary: 'bg-white/10 hover:bg-white/20',
ghost: 'hover:bg-white/10'
};
const sizes = {
sm: 'px-3 py-1.5 text-sm',
md: 'px-4 py-2',
lg: 'px-5 py-3 text-lg',
icon: 'p-2'
};
return <button className={cx(base, variants[variant], sizes[size], className)} {...props} />
}