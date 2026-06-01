
type AdminHeaderProps = {
  title: string
}

export function AdminHeader({ title }: AdminHeaderProps) {
  return (
    <header className="w-full py-15 bg-gray-900/80 backdrop-blur-md shadow-md flex justify-center">
      <h1 className="text-2xl font-semibold text-center">
        {title}
      </h1>
    </header>
  )
}
