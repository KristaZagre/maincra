import { Container, MaxWidth } from '@sushiswap/ui'
import React from 'react'

type Props = {
  children?: React.ReactNode
  maxWidth?: MaxWidth
}

function Layout({ children, maxWidth = '5xl' }: Props) {
  return (
    <Container maxWidth={maxWidth} className="h-full px-2 lg:mx-auto">
      <>
      {children}
      </>
    </Container>
  )
}

export default Layout
