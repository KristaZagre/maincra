'use client'

import { useEffect, useState } from 'react'

export default function StaleCheck({ children }: { children: React.ReactNode }) {
    const [isStale, setIsStale] = useState(false)

    async function onBlur() {
        const { stale } = await fetch('/api/stale-check').then((res) => res.json() as Promise<{ stale: boolean }>)
        setIsStale(stale)
    }

    useEffect(() => {
        window.addEventListener('blur', onBlur)
        return () => window.removeEventListener('blur', onBlur)
    }, [])

    return isStale ? <div className="h-screen w-screen">This page is stale. Please refresh.</div> : <>{children}</>
}