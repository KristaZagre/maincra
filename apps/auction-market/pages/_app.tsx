import type { AppProps } from 'next/app'
import { FC } from 'react'
import { App } from '@sushiswap/ui'
import { Provider } from 'wagmi'

import '@sushiswap/ui/index.css'

const MyApp: FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <App.Shell>
      <App.Header>
        <App.Nav />
      </App.Header>
      <Provider autoConnect>
        <Component {...pageProps} />
      </Provider>
    </App.Shell>
  )
}

export default MyApp
