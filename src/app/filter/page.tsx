import { FilterList } from '@/components/filter/filter-list'
import { PageContainer } from '@/components/ui/page-container'

export default function FilterPage() {
  return (
    <PageContainer>
      <header className="mb-8">
        <p className="receipt-text text-[10px] tracking-[0.3em] text-ink-light">STEP 01</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">フィルターを選ぼう</h1>
      </header>

      <FilterList />
    </PageContainer>
  )
}
