import { useState, useCallback, useMemo } from 'react'
import type { TableProps } from 'antd'

export interface TableSelection<T = any> {
  selectedRowKeys: React.Key[]
  selectedRows: T[]
  onSelectChange: (selectedRowKeys: React.Key[], selectedRows: T[]) => void
  onSelectAll: (selected: boolean, selectedRows: T[], changeRows: T[]) => void
  onSelect: (record: T, selected: boolean, selectedRows: T[], nativeEvent: Event) => void
  clearSelection: () => void
  hasSelected: boolean
  selectedCount: number
}

export interface TableSorting {
  sortField: string | null
  sortOrder: 'ascend' | 'descend' | null
  onSortChange: (field: string | null, order: 'ascend' | 'descend' | null) => void
  getSorterProps: (field: string) => any
}

export interface TableFiltering {
  filters: Record<string, any>
  setFilter: (field: string, value: any) => void
  clearFilter: (field: string) => void
  clearAllFilters: () => void
  getFilterProps: (field: string, options?: any[]) => any
}

export interface UseTableReturn<T = any> {
  // 分页
  currentPage: number
  pageSize: number
  total: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotal: (total: number) => void
  paginationConfig: any

  // 选择
  selection: TableSelection<T>

  // 排序
  sorting: TableSorting

  // 过滤
  filtering: TableFiltering

  // 表格配置
  tableProps: TableProps<T>

  // 重置
  reset: () => void
}

export function useTable<T = any>(options: {
  defaultPageSize?: number
  rowKey?: string | ((record: T) => string)
  multiple?: boolean
} = {}): UseTableReturn<T> {
  const { defaultPageSize = 20, rowKey = 'id', multiple = true } = options

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)

  // 选择状态
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRows, setSelectedRows] = useState<T[]>([])

  // 排序状态
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null)

  // 过滤状态
  const [filters, setFilters] = useState<Record<string, any>>({})

  // 分页处理
  const setPage = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size)
    setCurrentPage(1) // 重置到第一页
  }, [])

  const paginationConfig = useMemo(() => ({
    current: currentPage,
    pageSize,
    total,
    showTotal: (total: number, range: [number, number]) =>
      `显示 ${range[0]}-${range[1]} 条，共 ${total} 条数据`,
    showQuickJumper: true,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    onChange: setPage,
    onShowSizeChange: (_current: number, size: number) => setPageSize(size),
  }), [currentPage, pageSize, total, setPage, setPageSize])

  // 选择处理
  const onSelectChange = useCallback((keys: React.Key[], rows: T[]) => {
    setSelectedRowKeys(keys)
    setSelectedRows(rows)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedRowKeys([])
    setSelectedRows([])
  }, [])

  const selection = useMemo((): TableSelection<T> => ({
    selectedRowKeys,
    selectedRows,
    onSelectChange,
    onSelectAll: (selected, selectedRows, changeRows) => {
      // 可以在这里添加全选逻辑
    },
    onSelect: (record, selected, selectedRows) => {
      // 可以在这里添加单选逻辑
    },
    clearSelection,
    hasSelected: selectedRowKeys.length > 0,
    selectedCount: selectedRowKeys.length,
  }), [selectedRowKeys, selectedRows, onSelectChange, clearSelection])

  // 排序处理
  const onSortChange = useCallback((field: string | null, order: 'ascend' | 'descend' | null) => {
    setSortField(field)
    setSortOrder(order)
  }, [])

  const getSorterProps = useCallback((field: string) => ({
    sortOrder: sortField === field ? sortOrder : null,
    onHeaderCell: () => ({
      onClick: () => {
        let newOrder: 'ascend' | 'descend' | null = 'ascend'
        if (sortField === field) {
          if (sortOrder === 'ascend') {
            newOrder = 'descend'
          } else if (sortOrder === 'descend') {
            newOrder = null
          }
        }
        onSortChange(newOrder ? field : null, newOrder)
      },
    }),
  }), [sortField, sortOrder, onSortChange])

  const sorting = useMemo((): TableSorting => ({
    sortField,
    sortOrder,
    onSortChange,
    getSorterProps,
  }), [sortField, sortOrder, onSortChange, getSorterProps])

  // 过滤处理
  const setFilter = useCallback((field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }))
    setCurrentPage(1) // 重置到第一页
  }, [])

  const clearFilter = useCallback((field: string) => {
    setFilters(prev => {
      const newFilters = { ...prev }
      delete newFilters[field]
      return newFilters
    })
    setCurrentPage(1)
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({})
    setCurrentPage(1)
  }, [])

  const getFilterProps = useCallback((field: string, options?: any[]) => ({
    filteredValue: filters[field] || null,
    onFilter: options ? undefined : (value: any, record: T) => {
      const fieldValue = (record as any)[field]
      return String(fieldValue).toLowerCase().includes(String(value).toLowerCase())
    },
    filterDropdown: options ? undefined : ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
      // 这里可以返回自定义的过滤组件
      null
    ),
  }), [filters])

  const filtering = useMemo((): TableFiltering => ({
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    getFilterProps,
  }), [filters, setFilter, clearFilter, clearAllFilters, getFilterProps])

  // 重置所有状态
  const reset = useCallback(() => {
    setCurrentPage(1)
    setPageSizeState(defaultPageSize)
    setTotal(0)
    clearSelection()
    setSortField(null)
    setSortOrder(null)
    setFilters({})
  }, [defaultPageSize, clearSelection])

  // 表格属性
  const tableProps = useMemo((): TableProps<T> => ({
    rowKey,
    pagination: paginationConfig,
    rowSelection: multiple ? {
      selectedRowKeys,
      onChange: onSelectChange,
      onSelectAll: selection.onSelectAll,
      onSelect: selection.onSelect,
    } : undefined,
    onChange: (pagination, filters, sorter: any) => {
      if (sorter) {
        onSortChange(sorter.field || null, sorter.order || null)
      }
    },
  }), [rowKey, paginationConfig, multiple, selectedRowKeys, onSelectChange, selection, onSortChange])

  return {
    // 分页
    currentPage,
    pageSize,
    total,
    setPage,
    setPageSize,
    setTotal,
    paginationConfig,

    // 选择
    selection,

    // 排序
    sorting,

    // 过滤
    filtering,

    // 表格配置
    tableProps,

    // 重置
    reset,
  }
}
