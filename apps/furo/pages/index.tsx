import { BackgroundVector } from '../components/BackgroundVector'
import { Layout } from '../components/Layout'

export default function Index() {
  return (
    <Layout
      className="my-40"
      backdrop={
        <div className="fixed inset-0 right-0 z-0 pointer-events-none opacity-20">
          <BackgroundVector width="100%" preserveAspectRatio="none" />
        </div>
      }
    >
      <div className="flex flex-col sm:grid sm:grid-cols-[580px_420px] rounded">asdsad</div>
    </Layout>
  )
}
