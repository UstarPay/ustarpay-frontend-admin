import { useState, useCallback } from 'react'

export interface UseModalReturn {
  visible: boolean
  open: () => void
  close: () => void
  toggle: () => void
  data: any
  setData: (data: any) => void
}

export function useModal(initialVisible = false): UseModalReturn {
  const [visible, setVisible] = useState(initialVisible)
  const [data, setData] = useState<any>(null)

  const open = useCallback(() => {
    setVisible(true)
  }, [])

  const close = useCallback(() => {
    setVisible(false)
    setData(null) // 关闭时清空数据
  }, [])

  const toggle = useCallback(() => {
    setVisible(prev => !prev)
  }, [])

  return {
    visible,
    open,
    close,
    toggle,
    data,
    setData,
  }
}
