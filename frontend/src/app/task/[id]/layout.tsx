// Генерируем статические параметры для всех доступных задач
export function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ]
}

export default function TaskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

