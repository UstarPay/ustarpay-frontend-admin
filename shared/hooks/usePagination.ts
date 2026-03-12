import { useState, useMemo } from 'react'

export interface PaginationConfig {
  defaultPage?: number
  defaultPageSize?: number
  pageSizeOptions?: number[]
  showTotal?: boolean
  showQuickJumper?: boolean
  showSizeChanger?: boolean
}

export interface UsePaginationReturn {
  currentPage: number
  pageSize: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  goToFirstPage: () => void
  goToLastPage: () => void
  hasNext: boolean
  hasPrev: boolean
  isFirstPage: boolean
  isLastPage: boolean
  paginationConfig: any // Ant Design pagination props
  reset: () => void
}

export function usePagination(config: PaginationConfig = {}): UsePaginationReturn {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50, 100],
    showTotal = true,
    showQuickJumper = true,
    showSizeChanger = true,
  } = config

  const [currentPage, setCurrentPage] = useState(defaultPage)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => {
    return Math.ceil(total / pageSize)
  }, [total, pageSize])

  const setPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const setPageSizeAndResetPage = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // 重置到第一页
  }

  const nextPage = () => {
    setPage(currentPage + 1)
  }

  const prevPage = () => {
    setPage(currentPage - 1)
  }

  const goToFirstPage = () => {
    setPage(1)
  }

  const goToLastPage = () => {
    setPage(totalPages)
  }

  const hasNext = currentPage < totalPages
  const hasPrev = currentPage > 1
  const isFirstPage = currentPage === 1
  const isLastPage = currentPage === totalPages

  const reset = () => {
    setCurrentPage(defaultPage)
    setPageSize(defaultPageSize)
    setTotal(0)
  }

  // Ant Design 分页配置
  const paginationConfig = {
    current: currentPage,
    pageSize,
    total,
    pageSizeOptions,
    showTotal: showTotal
      ? (total: number, range: [number, number]) =>
          `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`
      : false,
    showQuickJumper,
    showSizeChanger,
    onChange: setPage,
    onShowSizeChange: (_current: number, size: number) => {
      setPageSizeAndResetPage(size)
    },
  }

  return {
    currentPage,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize: setPageSizeAndResetPage,
    setTotal,
    nextPage,
    prevPage,
    goToFirstPage,
    goToLastPage,
    hasNext,
    hasPrev,
    isFirstPage,
    isLastPage,
    paginationConfig,
    reset,
  }
}
