import { mockUser } from '../data/mock'
import Badge from '../components/Badge'
import { tierForSpend } from '../data/badges'
import { Link } from 'react-router-dom'
import { useI18n } from '../i18n'
import TiersShowcase from '../components/TiersShowcase'

export default function Account() {
  const { t } = useI18n()
  const tier = tierForSpend(mockUser.totalSpend)

  return (
    <section className="container py-12">
      <h1 className="text-2xl md:text-3xl font-bold">{t('account.title')}</h1>
      <TiersShowcase />

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 card p-6">
          <div className="font-semibold">{mockUser.name}</div>
          <div className="text-sm text-muted">{mockUser.email}</div>
          <div className="mt-4 flex items-center gap-2">
            <Badge tier={tier.tier} />
            <div className="text-sm text-muted">-{tier.discount}% {t('account.permanentDiscount')}</div>
          </div>
          <div className="mt-4 text-sm text-muted">{t('account.cumulative')}: <b>{mockUser.totalSpend}€</b></div>
        </div>
        <div className="md:col-span-2 card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-left bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">{t('account.table.order')}</th>
                <th className="px-4 py-3">{t('account.table.status')}</th>
                <th className="px-4 py-3">{t('account.table.items')}</th>
                <th className="px-4 py-3">{t('account.table.total')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {mockUser.orders.map(o => (
                <tr key={o.id} className="border-t border-border/70">
                  <td className="px-4 py-3 font-mono">{o.id}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{o.items}</td>
                  <td className="px-4 py-3">{o.total}€</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/orders/${o.id}`} className="btn-outline">{t('account.table.details')}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
