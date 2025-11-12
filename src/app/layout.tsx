import './globals.css'
import React from 'react'


export const metadata = {
title: 'Journal Chat',
}


export default function RootLayout({ children }: { children: React.ReactNode }) {
return (
<html lang="en">
<body className="bg-slate-50 text-slate-900 min-h-screen">
<div className="max-w-3xl mx-auto py-12 px-4">{children}</div>
</body>
</html>
)
}