import React, { useState, useMemo, useCallback } from 'react'
import { 
  Table, 
  Input, 
  Select, 
  Button, 
  Space, 
  Card, 
  Tag,
  Empty
} from 'antd'
import { 
  SearchOutlined, 
  ReloadOutlined, 
  ClearOutlined 
} from '@ant-design/icons'

const { Option } = Select

// 搜索字段类型定义
export interface SearchField {
  /** 字段键名 */
  key: string
  /** 字段标签 */
  label: string
  /** 字段类型 */
  type: 'text' | 'select' | 'date' | 'number'
  /** 占位符文本 */
  placeholder?: string
  /** 下拉选项（当type为select时使用） */
  options?: Array<{ label: string; value: any; color?: string }>
  /** 是否支持多选 */
  multiple?: boolean
  /** 字段宽度 */
  span?: number
  /** 最小宽度 */
  minWidth?: number | string
  /** 是否显示 */
  visible?: boolean
  /** 是否禁用（可为函数，根据当前表单值计算） */
  disabled?: boolean | ((formValues: SearchFormValues) => boolean)
  /** 当指定字段变化时清空本字段（用于级联） */
  clearWhen?: string
}

// 表格列定义
export interface TableColumn {
  /** 列键名 */
  key: string
  /** 列标题 */
  title: string
  /** 数据字段名 */
  dataIndex?: string
  /** 列宽度 */
  width?: number | string
  /** 是否固定 */
  fixed?: 'left' | 'right'
  /** 是否可排序 */
  sorter?: boolean | ((a: any, b: any) => number)
  /** 文字超出省略 */
  ellipsis?: boolean
  /** 渲染函数 */
  render?: (value: any, record: any, index: number) => React.ReactNode
  /** 是否显示 */
  visible?: boolean
}

// 搜索表单值类型
export interface SearchFormValues {
  [key: string]: any
}

// 组件Props
export interface SearchTableProps {
  /** 数据源 */
  dataSource: any[]
  /** 表格列配置 */
  columns: TableColumn[]
  /** 搜索字段配置 */
  searchFields: SearchField[]
  /** 表格标题 */
  title?: string
  /** 是否显示搜索区域 */
  showSearch?: boolean
  /** 是否显示刷新按钮 */
  showRefresh?: boolean
  /** 是否显示重置按钮 */
  showReset?: boolean
  /** 每页显示条数 */
  pageSize?: number
  /** 是否显示分页 */
  showPagination?: boolean
  /** 是否使用服务端分页 */
  serverSidePagination?: boolean
  /** 受控分页配置 */
  pagination?: {
    current: number
    pageSize: number
    total: number
  }
  /** 表格滚动配置 */
  scroll?: { x?: number | string; y?: number | string }
  /** 行选择配置 */
  rowSelection?: any
  /** 加载状态 */
  loading?: boolean
  /** 自定义类名 */
  className?: string
  /** 搜索区域卡片自定义类名 */
  searchCardClassName?: string
  /** 表格区域卡片自定义类名 */
  tableCardClassName?: string
  /** 搜索回调 */
  onSearch?: (values: SearchFormValues) => void
  /** 表单值变化回调（用于级联等场景） */
  onFormChange?: (values: SearchFormValues) => void
  /** 刷新回调 */
  onRefresh?: () => void
  /** 重置回调 */
  onReset?: () => void
  /** 表格变化回调 */
  onTableChange?: (pagination: any, filters: any, sorter: any) => void
}

/**
 * 通用搜索表格组件
 * 支持多字段搜索、下拉选择、分页等功能
 */
const SearchTable: React.FC<SearchTableProps> = ({
  dataSource = [],
  columns = [],
  searchFields = [],
  title,
  showSearch = true,
  showRefresh = true,
  showReset = true,
  pageSize = 10,
  showPagination = true,
  serverSidePagination = false,
  pagination: controlledPagination,
  scroll,
  rowSelection,
  loading = false,
  className = '',
  searchCardClassName = '',
  tableCardClassName = '',
  onSearch,
  onFormChange,
  onRefresh,
  onReset,
  onTableChange
}) => {
  // 搜索表单状态
  const [searchForm, setSearchForm] = useState<SearchFormValues>({})
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: pageSize,
    total: 0
  })

  const effectivePagination = controlledPagination || pagination

  // 过滤后的数据
  const filteredData = useMemo(() => {
    if (serverSidePagination) {
      return dataSource
    }

    if (!searchForm || Object.keys(searchForm).length === 0) {
      return dataSource
    }

    return dataSource.filter(record => {
      return searchFields.every(field => {
        const fieldValue = searchForm[field.key]
        if (!fieldValue || fieldValue === '') return true

        const recordValue = record[field.key]
        if (!recordValue) return false

        switch (field.type) {
          case 'text':
            return String(recordValue).toLowerCase().includes(String(fieldValue).toLowerCase())
          case 'select':
            if (field.multiple) {
              return Array.isArray(fieldValue) ? fieldValue.includes(recordValue) : fieldValue === recordValue
            }
            return recordValue === fieldValue
          case 'number':
            return Number(recordValue) === Number(fieldValue)
          case 'date':
            // 简单的日期比较，可以根据需要扩展
            return String(recordValue).includes(String(fieldValue))
          default:
            return true
        }
      })
    })
  }, [dataSource, searchForm, searchFields, serverSidePagination])

  // 更新分页总数
  React.useEffect(() => {
    if (serverSidePagination || controlledPagination) {
      return
    }

    setPagination(prev => ({
      ...prev,
      total: filteredData.length,
      current: 1 // 重置到第一页
    }))
  }, [filteredData.length, serverSidePagination, controlledPagination])

  // 分页数据
  const paginatedData = useMemo(() => {
    if (!showPagination) return filteredData
    if (serverSidePagination) return filteredData
    
    const start = (effectivePagination.current - 1) * effectivePagination.pageSize
    const end = start + effectivePagination.pageSize
    return filteredData.slice(start, end)
  }, [filteredData, effectivePagination.current, effectivePagination.pageSize, showPagination, serverSidePagination])

  // 处理搜索
  const handleSearch = useCallback((values: SearchFormValues) => {
    setSearchForm(values)
    if (!controlledPagination) {
      setPagination(prev => ({ ...prev, current: 1 }))
    }
    onSearch?.(values)
  }, [onSearch, controlledPagination])

  // 处理重置
  const handleReset = useCallback(() => {
    setSearchForm({})
    if (!controlledPagination) {
      setPagination(prev => ({ ...prev, current: 1 }))
    }
    onReset?.()
  }, [onReset, controlledPagination])

  // 处理刷新
  const handleRefresh = useCallback(() => {
    onRefresh?.()
  }, [onRefresh])

  // 处理表格变化
  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    if (!controlledPagination) {
      setPagination(pagination)
    }
    onTableChange?.(pagination, filters, sorter)
  }, [onTableChange, controlledPagination])

  // 渲染搜索字段
  const renderSearchField = (field: SearchField) => {
    if (field.visible === false) return null

    const commonProps = {
      key: field.key,
      placeholder: field.placeholder || `请输入${field.label}`,
      style: { width: '100%' }
    }

    switch (field.type) {
      case 'text':
        return (
          <Input
            {...commonProps}
            value={searchForm[field.key] || ''}
            onChange={(e) => {
              const newForm = { ...searchForm, [field.key]: e.target.value }
              setSearchForm(newForm)
              onFormChange?.(newForm)
            }}
            onPressEnter={() => handleSearch(searchForm)}
          />
        )
      
      case 'select':
        const selectDisabled = typeof field.disabled === 'function'
          ? field.disabled(searchForm)
          : field.disabled
        const clearFields: string[] = []
        searchFields.forEach(f => {
          if ('clearWhen' in f && f.clearWhen === field.key) {
            clearFields.push(f.key)
          }
        })
        return (
          <Select
            {...commonProps}
            value={searchForm[field.key]}
            disabled={selectDisabled}
            onChange={(value) => {
              const newForm = { ...searchForm, [field.key]: value }
              clearFields.forEach(k => { newForm[k] = undefined })
              setSearchForm(newForm)
              onFormChange?.(newForm)
            }}
            mode={field.multiple ? 'multiple' : undefined}
            allowClear
            showSearch
            optionFilterProp="children"
          >
            {field.options?.map(option => (
              <Option key={option.value} value={option.value}>
                {option.color ? (
                  <Tag color={option.color}>{option.label}</Tag>
                ) : (
                  option.label
                )}
              </Option>
            ))}
          </Select>
        )
      
      case 'number':
        return (
          <Input
            {...commonProps}
            type="number"
            value={searchForm[field.key] || ''}
            onChange={(e) => {
              const newForm = { ...searchForm, [field.key]: e.target.value }
              setSearchForm(newForm)
              onFormChange?.(newForm)
            }}
            onPressEnter={() => handleSearch(searchForm)}
          />
        )
      
      case 'date':
        return (
          <Input
            {...commonProps}
            type="date"
            value={searchForm[field.key] || ''}
            onChange={(e) => {
              const newForm = { ...searchForm, [field.key]: e.target.value }
              setSearchForm(newForm)
              onFormChange?.(newForm)
            }}
          />
        )
      
      default:
        return null
    }
  }

  // 渲染搜索区域
  const renderSearchArea = () => {
    if (!showSearch || searchFields.length === 0) return null

    const visibleFields = searchFields.filter(field => field.visible !== false)
    const getFieldWrapperStyle = (field: SearchField): React.CSSProperties => {
      const resolvedMinWidth = field.minWidth ?? (field.span ? Math.max(field.span * 36, 120) : 200)

      if (field.span && field.span > 0 && field.span <= 24) {
        return {
          flex: `0 1 calc(${(field.span / 24) * 100}% - 24px)`,
          minWidth: resolvedMinWidth
        }
      }

      return {
        flex: `1 1 ${typeof resolvedMinWidth === 'number' ? `${resolvedMinWidth}px` : resolvedMinWidth}`,
        minWidth: resolvedMinWidth,
        maxWidth: visibleFields.length === 1 ? 320 : undefined
      }
    }

    return (
      <Card className={`mb-4 ${searchCardClassName}`.trim()} size="small">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
          {visibleFields.map(field => (
            <div
              key={field.key}
              className="flex flex-col gap-1"
              style={getFieldWrapperStyle(field)}
            >
              <label className="text-sm font-medium text-gray-600">{field.label}</label>
              {renderSearchField(field)}
            </div>
          ))}
          <Space className="shrink-0 ml-auto">
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={() => handleSearch(searchForm)}
            >
              搜索
            </Button>
            {showReset && (
              <Button icon={<ClearOutlined />} onClick={handleReset}>
                重置
              </Button>
            )}
            {showRefresh && (
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
                刷新
              </Button>
            )}
          </Space>
        </div>
      </Card>
    )
  }

  // 渲染表格列
  const tableColumns = useMemo(() => {
    return columns
      .filter(col => col.visible !== false)
      .map(col => ({
        ...col,
        key: col.key,
        title: col.title,
        dataIndex: col.dataIndex || col.key,
        width: col.width,
        fixed: col.fixed,
        sorter: col.sorter,
        ellipsis: col.ellipsis,
        render: col.render
      }))
  }, [columns])

  return (
    <div className={className}>
      {/* 标题 */}
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
      )}

      {/* 搜索区域 */}
      {renderSearchArea()}

      {/* 表格 */}
      <Card className={tableCardClassName}>
        <Table
          columns={tableColumns}
          dataSource={paginatedData}
          rowKey={(record, index) => record.id || record.key || index}
          loading={loading}
          scroll={scroll}
          rowSelection={rowSelection}
          pagination={showPagination ? {
            ...effectivePagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100']
          } : false}
          onChange={handleTableChange}
          locale={{
            emptyText: <Empty description="暂无数据" />
          }}
        />
      </Card>
    </div>
  )
}

export default SearchTable
