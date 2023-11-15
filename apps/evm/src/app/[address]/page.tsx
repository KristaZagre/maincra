export default async function AccountPage({
  params,
}: { params: { address: string } }) {
  const positions = await fetch(
    `http://localhost:3000/pool/api/v1/positions/v2?user=${params.address}`,
    {
      next: { revalidate: 60 },
    },
  ).then((data) => data.json())
  return (
    <>
      <h1>{params.address}</h1>
      {positions && <div>{JSON.stringify(positions)}</div>}
    </>
  )
}
