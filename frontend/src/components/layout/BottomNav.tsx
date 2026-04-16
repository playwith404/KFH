import { NavLink } from 'react-router-dom'

type Item = { to: string; label: string }

function NavItem({ to, label }: Item) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs',
          isActive ? 'text-indigo-600' : 'text-slate-500',
        ].join(' ')
      }
    >
      <div className="h-1 w-8 rounded-full bg-current opacity-20" />
      <div className="font-medium">{label}</div>
    </NavLink>
  )
}

export function BottomNav({ items }: { items: Item[] }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-white">
      <div className="flex">{items.map((i) => <NavItem key={i.to} {...i} />)}</div>
    </div>
  )
}

