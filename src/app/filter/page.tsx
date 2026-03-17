import { FilterList } from '@/components/filter/filter-list'
import { PageContainer } from '@/components/ui/page-container'
import { ReceiptFrame } from '@/components/ui/receipt-frame'

export default function FilterPage() {
  return (
    <PageContainer>
      <ReceiptFrame className="mb-6 px-4 py-3" showTornEdge={false}>
        <div className="receipt-text text-center">
          <p className="text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
          <p className="mt-1 text-lg font-bold">フィルターを選ぼう</p>
          <p className="text-xs text-ink-light">好きなフィルターをタップしてね</p>
          <p className="mt-1 text-xs text-ink-light tracking-widest">━━━━━━━━━━━━━━━━━━</p>
        </div>
      </ReceiptFrame>

      <FilterList />
    </PageContainer>
  )
}
